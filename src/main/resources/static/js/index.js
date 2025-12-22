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
let currentUser = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus();
    renderPosts();
});

function checkLoginStatus() {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    
    // Support legacy storage format
    const legacyLogin = localStorage.getItem('isLoggedIn') === 'true';
    const legacyUser = localStorage.getItem('user');
    
    if (token && userData) {
        isLoggedIn = true;
        currentUser = JSON.parse(userData);
    } else if (legacyLogin && legacyUser) {
        // Migrate from legacy format
        isLoggedIn = true;
        currentUser = JSON.parse(legacyUser);
    } else {
        isLoggedIn = false;
        currentUser = null;
    }

    if (isLoggedIn && currentUser) {
        navGuest.style.display = 'none';
        navUser.style.display = 'flex';
        navProfileLink.style.display = 'flex';
        heroSection.style.display = 'none';
        if (createPostCard) createPostCard.style.display = 'flex';

        // Update avatar
        if (currentUser.username) {
             const avatar = currentUser.username.charAt(0).toUpperCase();
             document.getElementById('navUserAvatar').textContent = avatar;
             const widgetAvatar = document.querySelector('.create-post-card .user-avatar');
             if (widgetAvatar) widgetAvatar.textContent = avatar;
        }
    } else {
        navGuest.style.display = 'flex';
        navUser.style.display = 'none';
        navProfileLink.style.display = 'none';
        heroSection.style.display = 'block';
        if (createPostCard) createPostCard.style.display = 'none';
    }
}

function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('user');
    window.location.reload();
}

// Helper function to get auth headers
function getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    if (token) {
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    }
    return {
        'Content-Type': 'application/json'
    };
}

// Render Posts
async function renderPosts() {
    try {
        const response = await fetch('/api/posts');
        if (response.ok) {
            const posts = await response.json();
            
            if (!Array.isArray(posts)) {
                console.error('Expected array of posts but got:', posts);
                postsFeed.innerHTML = '<div class="text-center">Invalid data received from server.</div>';
                return;
            }

            const formattedPosts = posts.map(post => {
                const user = post.user || { username: 'Unknown' };
                return {
                    id: post.id,
                    user: { 
                        name: user.username, 
                        handle: '@' + user.username, 
                        avatar: user.username ? user.username.charAt(0).toUpperCase() : '?' 
                    },
                    content: post.content,
                    timestamp: new Date(post.createdAt).toLocaleString(),
                    likes: post.likesCount || 0,
                    comments: post.commentsCount || 0
                };
            });
            
            if (formattedPosts.length === 0) {
                postsFeed.innerHTML = '<div class="text-center" style="padding: 40px; color: var(--text-secondary);">No posts yet. Be the first to post!</div>';
            } else {
                postsFeed.innerHTML = formattedPosts.map(post => createPostHTML(post)).join('');
            }
        } else {
            console.error('Failed to fetch posts:', response.status, response.statusText);
            postsFeed.innerHTML = `<div class="text-center">Failed to load posts. Server returned ${response.status} ${response.statusText}</div>`;
        }
    } catch (error) {
        console.error('Error:', error);
        postsFeed.innerHTML = `<div class="text-center">Error loading posts: ${error.message}</div>`;
    }
}

function createPostHTML(post) {
    // Safely escape user input content
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
async function submitPost() {
    if (!isLoggedIn) {
        window.location.href = 'login.html';
        return;
    }
    
    const content = postContentInput.value.trim();
    if (!content) return;

    try {
        const response = await fetch('/api/posts', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                content: content,
                userId: currentUser.id,
                imageUrl: null
            })
        });

        if (response.status === 401) {
            alert('Session expired. Please login again.');
            logout();
            return;
        }

        if (response.ok) {
            renderPosts();
            closeCreatePostModal();
        } else {
            const error = await response.json();
            alert('Failed to create post: ' + (error.message || error.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error creating post');
    }
}

function handleLike(postId) {
    if (!isLoggedIn) {
        window.location.href = 'login.html';
        return;
    }
    alert('Like feature not implemented in backend yet.');
}

function handleComment(postId) {
    if (!isLoggedIn) {
        window.location.href = 'login.html';
        return;
    }
    window.location.href = `post-details.html?id=${postId}`;
}

function handleShare(postId) {
    if (!isLoggedIn) {
        window.location.href = 'login.html';
        return;
    }
    // Call share endpoint
    fetch(`/api/posts/${postId}/share`, { 
        method: 'POST',
        headers: getAuthHeaders()
    })
        .then(res => {
            if (res.status === 401) {
                alert('Session expired. Please login again.');
                logout();
                throw new Error('Unauthorized');
            }
            return res.json();
        })
        .then(data => {
            if (data.shareUrl) {
                prompt("Copy this link to share:", data.shareUrl);
            } else {
                alert('Could not generate share link');
            }
        })
        .catch(err => console.error(err));
}

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target == createPostModal) {
        closeCreatePostModal();
    }
}
