// Mock Data
const MOCK_POSTS = [
    {
        id: 1,
        user: { name: 'Sarah Wilson', handle: '@sarahw', avatar: 'S' },
        content: 'Just finished working on the new design system. Loving the minimalist vibes! 🎨✨ #Design #Minimalism',
        timestamp: '2 hours ago',
        likes: 24,
        comments: 5
    },
    {
        id: 2,
        user: { name: 'David Chen', handle: '@davidc', avatar: 'D' },
        content: 'Cloud computing is changing the way we deploy applications. The scalability is incredible.',
        timestamp: '4 hours ago',
        likes: 15,
        comments: 2
    },
    {
        id: 3,
        user: { name: 'Emily Parker', handle: '@emilyp', avatar: 'E' },
        content: 'Coffee and coding - the perfect Sunday morning setup. ☕💻',
        timestamp: '6 hours ago',
        likes: 42,
        comments: 8
    }
];

// DOM Elements
const postsFeed = document.getElementById('postsFeed');
const createPostModal = document.getElementById('createPostModal');
const postContentInput = document.getElementById('postContent');
const navGuest = document.getElementById('navGuest');
const navUser = document.getElementById('navUser');
const navProfileLink = document.getElementById('navProfileLink');
const heroSection = document.getElementById('heroSection');
const createPostCard = document.querySelector('.create-post-card');

// State
let isLoggedIn = false;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus();
    renderPosts();
});

function checkLoginStatus() {
    // Check localStorage for login status (simulated)
    isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

    if (isLoggedIn) {
        navGuest.style.display = 'none';
        navUser.style.display = 'flex';
        navProfileLink.style.display = 'flex';
        heroSection.style.display = 'none';
        if (createPostCard) createPostCard.style.display = 'flex';
    } else {
        navGuest.style.display = 'flex';
        navUser.style.display = 'none';
        navProfileLink.style.display = 'none';
        heroSection.style.display = 'block';
        if (createPostCard) createPostCard.style.display = 'none'; // Hide create post widget for guests
    }
}

function logout() {
    localStorage.removeItem('isLoggedIn');
    window.location.reload();
}

// Render Posts
function renderPosts() {
    postsFeed.innerHTML = MOCK_POSTS.map(post => createPostHTML(post)).join('');
}

function createPostHTML(post) {
    return `
        <article class="card post-card">
            <div class="post-header">
                <div class="user-avatar">${post.user.avatar}</div>
                <div class="post-info">
                    <h3>${post.user.name}</h3>
                    <span>${post.user.handle} · ${post.timestamp}</span>
                </div>
            </div>
            <div class="post-content">
                ${post.content}
            </div>
            <div class="post-actions">
                <button class="action-btn" onclick="handleLike(${post.id})">
                    <span>♥</span> ${post.likes}
                </button>
                <button class="action-btn" onclick="handleComment(${post.id})">
                    <span>💬</span> ${post.comments}
                </button>
                <button class="action-btn" onclick="handleShare(${post.id})">
                    <span>↗</span> Share
                </button>
            </div>
        </article>
    `;
}

// Modal Functions
function openCreatePostModal() {
    if (!isLoggedIn) {
        window.location.href = 'login.html';
        return;
    }
    createPostModal.style.display = 'flex';
}

function closeCreatePostModal() {
    createPostModal.style.display = 'none';
    postContentInput.value = '';
}

// Post Actions
function submitPost() {
    if (!isLoggedIn) {
        window.location.href = 'login.html';
        return;
    }
    
    const content = postContentInput.value.trim();
    if (!content) return;

    const newPost = {
        id: MOCK_POSTS.length + 1,
        user: { name: 'Current User', handle: '@user', avatar: 'U' },
        content: content,
        timestamp: 'Just now',
        likes: 0,
        comments: 0
    };

    MOCK_POSTS.unshift(newPost);
    renderPosts();
    closeCreatePostModal();
}

function handleLike(postId) {
    if (!isLoggedIn) {
        window.location.href = 'login.html';
        return;
    }

    const post = MOCK_POSTS.find(p => p.id === postId);
    if (post) {
        post.likes++;
        renderPosts();
    }
}

function handleComment(postId) {
    if (!isLoggedIn) {
        window.location.href = 'login.html';
        return;
    }
    // TODO: Implement comment logic
    alert('Comment feature coming soon!');
}

function handleShare(postId) {
    if (!isLoggedIn) {
        window.location.href = 'login.html';
        return;
    }
    // TODO: Implement share logic
    alert('Share feature coming soon!');
}

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target == createPostModal) {
        closeCreatePostModal();
    }
}
