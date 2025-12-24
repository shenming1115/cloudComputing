/**
 * AI Chat Assistant Widget
 * Floating chat widget with Cloudflare Workers AI integration
 */

class AIChatAssistant {
    constructor() {
        this.isOpen = false;
        this.messages = [];
        this.init();
    }

    init() {
        this.createWidget();
        this.attachEventListeners();
        this.showWelcomeMessage();
    }

    createWidget() {
        const widgetHTML = `
            <!-- Floating Chat Button -->
            <button class="ai-chat-button" id="aiChatButton" title="AI Assistant">
                <span>🤖</span>
            </button>

            <!-- Chat Window -->
            <div class="ai-chat-window" id="aiChatWindow">
                <!-- Header -->
                <div class="ai-chat-header">
                    <div class="ai-chat-header-content">
                        <div class="ai-chat-avatar">✨</div>
                        <div class="ai-chat-title">
                            <h3>AI Assistant</h3>
                            <div class="ai-chat-subtitle">Always here to help</div>
                        </div>
                    </div>
                    <button class="ai-chat-close" id="aiChatClose">×</button>
                </div>

                <!-- Messages Container -->
                <div class="ai-chat-messages" id="aiChatMessages">
                    <!-- Messages will be inserted here -->
                </div>

                <!-- Input Area -->
                <div class="ai-chat-input-container">
                    <div class="ai-chat-input-wrapper">
                        <input 
                            type="text" 
                            class="ai-chat-input" 
                            id="aiChatInput" 
                            placeholder="Type your message..."
                            autocomplete="off"
                        />
                        <button class="ai-chat-send" id="aiChatSend" title="Send message">
                            <span>▶</span>
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', widgetHTML);
    }

    attachEventListeners() {
        const chatButton = document.getElementById('aiChatButton');
        const chatWindow = document.getElementById('aiChatWindow');
        const closeButton = document.getElementById('aiChatClose');
        const sendButton = document.getElementById('aiChatSend');
        const inputField = document.getElementById('aiChatInput');

        chatButton.addEventListener('click', () => this.toggleChat());
        closeButton.addEventListener('click', () => this.closeChat());
        sendButton.addEventListener('click', () => this.sendMessage());
        
        inputField.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });
    }

    toggleChat() {
        this.isOpen = !this.isOpen;
        const chatWindow = document.getElementById('aiChatWindow');
        const chatButton = document.getElementById('aiChatButton');
        
        if (this.isOpen) {
            chatWindow.classList.add('active');
            chatButton.classList.add('active');
            document.getElementById('aiChatInput').focus();
        } else {
            chatWindow.classList.remove('active');
            chatButton.classList.remove('active');
        }
    }

    closeChat() {
        this.isOpen = false;
        document.getElementById('aiChatWindow').classList.remove('active');
        document.getElementById('aiChatButton').classList.remove('active');
    }

    showWelcomeMessage() {
        const messagesContainer = document.getElementById('aiChatMessages');
        const welcomeHTML = `
            <div class="ai-welcome-message">
                <div class="ai-welcome-icon">👋</div>
                <h4>Hello! I'm your AI Assistant</h4>
                <p>I can help you with content suggestions, post ideas, and answer your questions. How can I assist you today?</p>
                
                <div class="ai-suggestions">
                    <button class="ai-suggestion-btn" onclick="aiChat.quickMessage('Help me write a post about technology')">
                        💡 Help me write a post
                    </button>
                    <button class="ai-suggestion-btn" onclick="aiChat.quickMessage('Give me content ideas')">
                        ✨ Give me content ideas
                    </button>
                    <button class="ai-suggestion-btn" onclick="aiChat.quickMessage('What can you do?')">
                        ❓ What can you do?
                    </button>
                </div>
            </div>
        `;
        messagesContainer.innerHTML = welcomeHTML;
    }

    quickMessage(text) {
        document.getElementById('aiChatInput').value = text;
        this.sendMessage();
    }

    async sendMessage() {
        const inputField = document.getElementById('aiChatInput');
        const message = inputField.value.trim();

        if (!message) return;

        // Clear input
        inputField.value = '';

        // Add user message
        this.addMessage(message, 'user');

        // Show typing indicator
        this.showTypingIndicator();

        // Get JWT token - REQUIRED for AI chat
        const token = localStorage.getItem('authToken');
        
        // Check if user is logged in
        if (!token) {
            this.hideTypingIndicator();
            this.addMessage('请先登录才能使用AI助手。Please log in first to use the AI assistant.', 'assistant');
            return;
        }

        try {
            // Call AI API with authentication
            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    message: message,
                    context: 'general'
                })
            });

            this.hideTypingIndicator();

            if (response.ok) {
                const data = await response.json();
                const aiResponse = data.response || data.suggestions || 'I received your message!';
                this.addMessage(aiResponse, 'assistant');
            } else {
                const errorData = await response.json();
                this.addMessage(errorData.error || 'Sorry, I encountered an error. Please try again.', 'assistant');
            }
        } catch (error) {
            console.error('AI Chat Error:', error);
            this.hideTypingIndicator();
            this.addMessage('Sorry, I\'m having trouble connecting. Please try again later.', 'assistant');
        }

        // Scroll to bottom
        this.scrollToBottom();
    }

    addMessage(text, sender) {
        const messagesContainer = document.getElementById('aiChatMessages');
        
        // Remove welcome message if exists
        const welcome = messagesContainer.querySelector('.ai-welcome-message');
        if (welcome) {
            welcome.remove();
        }

        const messageHTML = `
            <div class="ai-chat-message ${sender}">
                <div class="ai-chat-message-avatar">
                    ${sender === 'user' ? '👤' : '🤖'}
                </div>
                <div class="ai-chat-message-content">
                    <div class="ai-chat-message-bubble">
                        ${this.formatMessage(text)}
                    </div>
                    <div class="ai-chat-message-time">
                        ${this.getCurrentTime()}
                    </div>
                </div>
            </div>
        `;

        messagesContainer.insertAdjacentHTML('beforeend', messageHTML);
        this.scrollToBottom();

        // Store message
        this.messages.push({ text, sender, time: new Date() });
    }

    formatMessage(text) {
        // Convert line breaks to <br>
        return text.replace(/\n/g, '<br>');
    }

    getCurrentTime() {
        const now = new Date();
        return now.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }

    showTypingIndicator() {
        const messagesContainer = document.getElementById('aiChatMessages');
        const typingHTML = `
            <div class="ai-chat-message assistant" id="typingIndicator">
                <div class="ai-chat-message-avatar">🤖</div>
                <div class="ai-chat-message-content">
                    <div class="ai-typing-indicator active">
                        <div class="ai-typing-dots">
                            <div class="ai-typing-dot"></div>
                            <div class="ai-typing-dot"></div>
                            <div class="ai-typing-dot"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        messagesContainer.insertAdjacentHTML('beforeend', typingHTML);
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        if (indicator) {
            indicator.remove();
        }
    }

    scrollToBottom() {
        const messagesContainer = document.getElementById('aiChatMessages');
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

// Initialize AI Chat Assistant when DOM is loaded
let aiChat;
document.addEventListener('DOMContentLoaded', () => {
    aiChat = new AIChatAssistant();
});
