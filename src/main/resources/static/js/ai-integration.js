/**
 * AI Integration - Cloudflare Worker Integration
 * Handles AI-powered features including content suggestions and chat
 */

let currentAISuggestion = '';

/**
 * Open AI Boost Modal
 */
function openAIBoostModal() {
    const modal = document.getElementById('aiBoostModal');
    modal.style.display = 'flex';
    document.getElementById('aiTopicInput').value = '';
    document.getElementById('aiSuggestions').style.display = 'none';
    document.getElementById('getAISuggestionsBtn').style.display = 'inline-flex';
    document.getElementById('useAISuggestionBtn').style.display = 'none';
    currentAISuggestion = '';
}

/**
 * Close AI Boost Modal
 */
function closeAIBoostModal() {
    const modal = document.getElementById('aiBoostModal');
    modal.style.display = 'none';
}

/**
 * Get AI Content Suggestions
 */
async function getAISuggestions() {
    const topic = document.getElementById('aiTopicInput').value.trim();
    
    if (!topic) {
        alert('Please enter a topic or idea');
        return;
    }

    const btn = document.getElementById('getAISuggestionsBtn');
    const originalText = btn.textContent;
    btn.textContent = '✨ Generating...';
    btn.disabled = true;

    try {
        const authToken = localStorage.getItem('authToken');
        
        const response = await fetch('/api/ai/boost', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ topic })
        });

        if (response.status === 401) {
            alert('Session expired. Please login again.');
            window.location.href = '/html/login.html';
            return;
        }

        if (!response.ok) {
            throw new Error('Failed to get AI suggestions');
        }

        const data = await response.json();
        
        // Display suggestions
        document.getElementById('aiSuggestionsContent').textContent = data.suggestions;
        document.getElementById('aiSuggestions').style.display = 'block';
        currentAISuggestion = data.suggestions;
        
        // Show "Use This" button
        btn.style.display = 'none';
        document.getElementById('useAISuggestionBtn').style.display = 'inline-flex';
        
    } catch (error) {
        console.error('AI Boost Error:', error);
        alert('Failed to generate AI suggestions. Please try again.');
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

/**
 * Use AI Suggestion in Post
 */
function useAISuggestion() {
    if (currentAISuggestion) {
        document.getElementById('postContent').value = currentAISuggestion;
        closeAIBoostModal();
        alert('AI suggestion added to your post! Feel free to edit it.');
    }
}

/**
 * AI Chat Assistant (Optional Feature)
 * Can be integrated into a chat widget or help section
 */
async function askAIAssistant(question) {
    const authToken = localStorage.getItem('authToken');
    
    try {
        const response = await fetch('/api/ai/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ message: question })
        });

        if (response.status === 401) {
            throw new Error('Authentication required');
        }

        if (!response.ok) {
            throw new Error('Failed to get AI response');
        }

        const data = await response.json();
        return data.response;
        
    } catch (error) {
        console.error('AI Chat Error:', error);
        return 'Sorry, I am unable to respond right now. Please try again later.';
    }
}

/**
 * Platform Help with AI
 */
async function getAIPlatformHelp(question) {
    const authToken = localStorage.getItem('authToken');
    
    try {
        const response = await fetch('/api/ai/help', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ question })
        });

        if (!response.ok) {
            throw new Error('Failed to get help');
        }

        const data = await response.json();
        return data.help;
        
    } catch (error) {
        console.error('AI Help Error:', error);
        return null;
    }
}

/**
 * Close modal when clicking outside
 */
document.addEventListener('click', (e) => {
    const modal = document.getElementById('aiBoostModal');
    if (modal && e.target === modal) {
        closeAIBoostModal();
    }
});

// Export functions for use in other scripts
window.openAIBoostModal = openAIBoostModal;
window.closeAIBoostModal = closeAIBoostModal;
window.getAISuggestions = getAISuggestions;
window.useAISuggestion = useAISuggestion;
window.askAIAssistant = askAIAssistant;
window.getAIPlatformHelp = getAIPlatformHelp;
