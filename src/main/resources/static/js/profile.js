// Mock Data for User Posts
const USER_POSTS = [
    {
        id: 101,
        user: { name: 'Current User', handle: '@user', avatar: 'U' },
        content: 'Setting up my new development environment. Clean desk, clean code. 🖥️',
        timestamp: '2 days ago',
        likes: 12,
        comments: 1
    },
    {
        id: 102,
        user: { name: 'Current User', handle: '@user', avatar: 'U' },
        content: 'Just deployed my first app to the cloud! #CloudComputing #DevOps',
        timestamp: '5 days ago',
        likes: 34,
        comments: 4
    }
];

// DOM Elements
const userPostsFeed = document.getElementById('userPostsFeed');
const editProfileModal = document.getElementById('editProfileModal');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus();
    renderUserPosts();
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

// Render Posts
function renderUserPosts() {
    userPostsFeed.innerHTML = USER_POSTS.map(post => createPostHTML(post)).join('');
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
                <button class="action-btn">
                    <span>♥</span> ${post.likes}
                </button>
                <button class="action-btn">
                    <span>💬</span> ${post.comments}
                </button>
                <button class="action-btn">
                    <span>↗</span> Share
                </button>
            </div>
        </article>
    `;
}

// Modal Functions
function openEditProfileModal() {
    editProfileModal.style.display = 'flex';
}

function closeEditProfileModal() {
    editProfileModal.style.display = 'none';
}

function saveProfile() {
    // TODO: Implement API call to save profile
    alert('Profile updated successfully!');
    closeEditProfileModal();
}

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target == editProfileModal) {
        closeEditProfileModal();
    }
}
