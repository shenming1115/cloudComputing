// DOM Elements
const userPostsFeed = document.getElementById('userPostsFeed');
const editProfileModal = document.getElementById('editProfileModal');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus();
    loadUserProfile();
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
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

function loadUserProfile() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        document.querySelector('.profile-name').textContent = user.username;
        document.querySelector('.profile-handle').textContent = '@' + user.username;
        document.querySelector('.profile-avatar-large').textContent = user.username.charAt(0).toUpperCase();
        
        // Update nav avatar as well
        const navAvatar = document.getElementById('navUserAvatar');
        if (navAvatar) navAvatar.textContent = user.username.charAt(0).toUpperCase();
    }
}

// Render Posts
async function renderUserPosts() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return;

    try {
        const response = await fetch(`/api/posts/user/${user.id}`);
        if (response.ok) {
            const posts = await response.json();
            
            const formattedPosts = posts.map(post => ({
                id: post.id,
                user: { 
                    name: post.user.username, 
                    handle: '@' + post.user.username, 
                    avatar: post.user.username.charAt(0).toUpperCase() 
                },
                content: post.content,
                timestamp: new Date(post.createdAt).toLocaleString(),
                likes: 0,
                comments: post.comments ? post.comments.length : 0
            }));
            
            if (formattedPosts.length === 0) {
                userPostsFeed.innerHTML = '<div class="text-center" style="padding: 40px; color: var(--text-secondary);">No posts yet.</div>';
            } else {
                userPostsFeed.innerHTML = formattedPosts.map(post => createPostHTML(post)).join('');
            }

            // Update stats (Posts count)
            const stats = document.querySelectorAll('.stat-value');
            if (stats.length > 0) stats[0].textContent = posts.length;

        } else {
            userPostsFeed.innerHTML = '<div class="text-center">Failed to load posts.</div>';
        }
    } catch (error) {
        console.error('Error:', error);
        userPostsFeed.innerHTML = '<div class="text-center">Error loading posts.</div>';
    }
}

function createPostHTML(post) {
    // Safely escape user input
    const safeContent = sanitizeContent(post.content);
    const safeName = escapeHtml(post.user.name);
    const safeHandle = escapeHtml(post.user.handle);
    
    return `
        <article class="card post-card">
            <div class="post-header">
                <div class="user-avatar">${post.user.avatar}</div>
                <div class="post-info">
                    <h3>${safeName}</h3>
                    <span>${safeHandle} · ${post.timestamp}</span>
                </div>
            </div>
            <div class="post-content">
                ${safeContent}
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
    // TODO: Implement API call to save profile (User update endpoint needed in backend)
    alert('Profile update not implemented in backend yet!');
    closeEditProfileModal();
}

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target == editProfileModal) {
        closeEditProfileModal();
    }
}
