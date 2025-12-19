// Mock Data (In a real app, this would come from an API based on URL param ID)
const MOCK_POST = {
    id: 1,
    user: { name: 'Sarah Wilson', handle: '@sarahw', avatar: 'S' },
    content: 'Just finished working on the new design system. Loving the minimalist vibes! 🎨✨ #Design #Minimalism',
    timestamp: '2 hours ago',
    likes: 24,
    comments: 5
};

const MOCK_COMMENTS = [
    {
        id: 1,
        user: { name: 'David Chen', handle: '@davidc', avatar: 'D' },
        content: 'This looks amazing! Great job on the color palette.',
        timestamp: '1 hour ago'
    },
    {
        id: 2,
        user: { name: 'Emily Parker', handle: '@emilyp', avatar: 'E' },
        content: 'So clean and fresh. Love it!',
        timestamp: '30 mins ago'
    }
];

// DOM Elements
const postContainer = document.getElementById('postContainer');
const commentsList = document.getElementById('commentsList');
const commentInput = document.getElementById('commentInput');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus();
    loadPostDetails();
    loadComments();
});

function checkLoginStatus() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (!isLoggedIn) {
        window.location.href = 'login.html';
    }
}

function logout() {
    localStorage.removeItem('isLoggedIn');
    window.location.href = 'index.html';
}

function loadPostDetails() {
    // In reality, we would get the ID from URL params: const urlParams = new URLSearchParams(window.location.search);
    // const postId = urlParams.get('id');
    
    postContainer.innerHTML = `
        <article class="card post-card">
            <div class="post-header">
                <div class="user-avatar">${MOCK_POST.user.avatar}</div>
                <div class="post-info">
                    <h3>${MOCK_POST.user.name}</h3>
                    <span>${MOCK_POST.user.handle} · ${MOCK_POST.timestamp}</span>
                </div>
            </div>
            <div class="post-content" style="font-size: 1.1rem;">
                ${MOCK_POST.content}
            </div>
            <div class="post-actions">
                <button class="action-btn">
                    <span>♥</span> ${MOCK_POST.likes}
                </button>
                <button class="action-btn">
                    <span>💬</span> ${MOCK_POST.comments}
                </button>
                <button class="action-btn">
                    <span>↗</span> Share
                </button>
            </div>
        </article>
    `;
}

function loadComments() {
    commentsList.innerHTML = MOCK_COMMENTS.map(comment => createCommentHTML(comment)).join('');
}

function createCommentHTML(comment) {
    return `
        <div class="comment-item">
            <div class="user-avatar" style="width: 32px; height: 32px; font-size: 0.8rem;">${comment.user.avatar}</div>
            <div class="comment-content">
                <div class="comment-header">
                    <span class="comment-author">${comment.user.name}</span>
                    <span class="comment-time">${comment.timestamp}</span>
                </div>
                <div class="comment-text">${comment.content}</div>
            </div>
        </div>
    `;
}

function submitComment() {
    const content = commentInput.value.trim();
    if (!content) return;

    const newComment = {
        id: MOCK_COMMENTS.length + 1,
        user: { name: 'Current User', handle: '@user', avatar: 'U' },
        content: content,
        timestamp: 'Just now'
    };

    MOCK_COMMENTS.unshift(newComment);
    loadComments();
    commentInput.value = '';
}
