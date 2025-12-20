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
    isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const user = JSON.parse(localStorage.getItem('user'));
    currentUser = user;

    if (isLoggedIn) {
        navGuest.style.display = 'none';
        navUser.style.display = 'flex';
        navProfileLink.style.display = 'flex';
        heroSection.style.display = 'none';
        if (createPostCard) createPostCard.style.display = 'flex';

        // Update avatar
        if (user && user.username) {
             const avatar = user.username.charAt(0).toUpperCase();
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
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('user');
    window.location.reload();
}

// Render Posts with Likes
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

            if (posts.length === 0) {
                postsFeed.innerHTML = '<div class="text-center" style="padding: 40px; color: var(--text-secondary);">No posts yet. Be the first to post!</div>';
                return;
            }

            // Fetch like status for each post if logged in
            const postsWithLikes = await Promise.all(posts.map(async (post) => {
                const user = post.user || { username: 'Unknown' };
                let likeCount = 0;
                let isLiked = false;
                
                if (currentUser) {
                    try {
                        const likeStatusRes = await fetch(`/api/posts/${post.id}/likes/status?userId=${currentUser.id}`);
                        if (likeStatusRes.ok) {
                            const likeData = await likeStatusRes.json();
                            likeCount = likeData.likeCount;
                            isLiked = likeData.liked;
                        }
                    } catch (error) {
                        console.error('Error fetching like status:', error);
                    }
                }
                
                return {
                    id: post.id,
                    user: { 
                        name: user.username, 
                        handle: '@' + user.username, 
                        avatar: user.username ? user.username.charAt(0).toUpperCase() : '?' 
                    },
                    content: post.content,
                    imageUrl: post.imageUrl,
                    videoUrl: post.videoUrl,
                    mediaType: post.mediaType,
                    timestamp: formatTimestamp(post.createdAt),
                    likes: likeCount,
                    isLiked: isLiked,
                    comments: post.comments ? post.comments.length : 0
                };
            }));
            
            postsFeed.innerHTML = postsWithLikes.map(post => createPostHTML(post)).join('');
        } else {
            console.error('Failed to fetch posts:', response.status, response.statusText);
            postsFeed.innerHTML = `<div class="text-center">Failed to load posts. Server returned ${response.status}</div>`;
        }
    } catch (error) {
        console.error('Error:', error);
        postsFeed.innerHTML = `<div class="text-center">Error loading posts: ${error.message}</div>`;
    }
}

function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-MY', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        timeZone: 'Asia/Kuala_Lumpur'
    });
}

function createPostHTML(post) {
    const safeContent = sanitizeContent(post.content);
    const safeName = escapeHtml(post.user.name);
    const safeHandle = escapeHtml(post.user.handle);
    
    let mediaHtml = '';
    if (post.imageUrl) {
        mediaHtml = `<img src="${escapeHtml(post.imageUrl)}" alt="Post image" style="width: 100%; border-radius: var(--radius-md); margin-top: 12px;">`;
    } else if (post.videoUrl) {
        mediaHtml = `<video controls style="width: 100%; border-radius: var(--radius-md); margin-top: 12px;">
            <source src="${escapeHtml(post.videoUrl)}" type="video/mp4">
            Your browser does not support the video tag.
        </video>`;
    }
    
    const likeIcon = post.isLiked ? '❤️' : '🤍';
    const likeClass = post.isLiked ? 'liked' : '';
    
    return `
        <article class="card post-card">
            <div class="post-header">
                <div class="user-avatar">${post.user.avatar}</div>
                <div class="post-info">
                    <h3 style="font-size: 16px; font-weight: 600;">${safeName}</h3>
                    <span style="color: var(--text-secondary); font-size: 14px;">${safeHandle} · ${post.timestamp}</span>
                </div>
            </div>
            <div class="post-content">
                ${safeContent}
                ${mediaHtml}
            </div>
            <div class="post-actions">
                <button class="action-btn ${likeClass}" onclick="handleLike(${post.id})" id="like-btn-${post.id}">
                    <span id="like-icon-${post.id}">${likeIcon}</span> <span id="like-count-${post.id}">${post.likes}</span>
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

// Like Handler
async function handleLike(postId) {
    if (!isLoggedIn || !currentUser) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch(`/api/posts/${postId}/likes?userId=${currentUser.id}`, {
            method: 'POST'
        });

        if (response.ok) {
            const data = await response.json();
            const likeBtn = document.getElementById(`like-btn-${postId}`);
            const likeIcon = document.getElementById(`like-icon-${postId}`);
            const likeCount = document.getElementById(`like-count-${postId}`);
            
            if (data.liked) {
                likeBtn.classList.add('liked');
                likeIcon.textContent = '❤️';
            } else {
                likeBtn.classList.remove('liked');
                likeIcon.textContent = '🤍';
            }
            
            likeCount.textContent = data.likeCount;
        }
    } catch (error) {
        console.error('Error toggling like:', error);
    }
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

// Post Creation with Upload
let selectedFile = null;
let selectedMediaType = null;

function handleFileSelect(input, mediaType) {
    const file = input.files[0];
    if (file) {
        selectedFile = file;
        selectedMediaType = mediaType;
        document.getElementById('selectedFileName').textContent = `Selected: ${file.name}`;
    }
}

async function submitPost() {
    if (!isLoggedIn || !currentUser) {
        window.location.href = 'login.html';
        return;
    }
    
    const content = postContentInput.value.trim();
    if (!content) {
        alert('Please enter some content');
        return;
    }

    try {
        let imageUrl = null;
        let videoUrl = null;
        let mediaType = 'text';

        // Upload media file if selected
        if (selectedFile) {
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('userId', currentUser.id);

            const uploadEndpoint = selectedMediaType === 'image' ? '/api/posts/upload-image' : '/api/posts/upload-video';
            
            const uploadResponse = await fetch(uploadEndpoint, {
                method: 'POST',
                body: formData
            });

            if (uploadResponse.ok) {
                const uploadData = await uploadResponse.json();
                if (selectedMediaType === 'image') {
                    imageUrl = uploadData.imageUrl;
                    mediaType = 'image';
                } else {
                    videoUrl = uploadData.videoUrl;
                    mediaType = selectedMediaType === 'reel' ? 'reel' : 'video';
                }
            } else {
                const error = await uploadResponse.json();
                alert('Failed to upload media: ' + (error.error || error.message || 'Unknown error'));
                return;
            }
        }

        // Create post with media URLs
        const response = await fetch('/api/posts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                content: content,
                userId: currentUser.id,
                imageUrl: imageUrl,
                videoUrl: videoUrl,
                mediaType: mediaType
            })
        });

        if (response.ok) {
            await renderPosts();
            closeCreatePostModal();
            // Reset file selection
            selectedFile = null;
            selectedMediaType = null;
            document.getElementById('selectedFileName').textContent = '';
            document.getElementById('imageInput').value = '';
            document.getElementById('videoInput').value = '';
            document.getElementById('reelInput').value = '';
        } else {
            const error = await response.json();
            alert('Failed to create post: ' + (error.error || error.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error creating post: ' + error.message);
    }
}

function handleComment(postId) {
    if (!isLoggedIn) {
        window.location.href = 'login.html';
        return;
    }
    window.location.href = `post-details.html?id=${postId}`;
}

async function handleShare(postId) {
    if (!isLoggedIn) {
        window.location.href = 'login.html';
        return;
    }
    
    try {
        const response = await fetch(`/api/posts/${postId}/share`, { method: 'POST' });
        const data = await response.json();
        
        if (data.shareUrl) {
            if (navigator.clipboard) {
                await navigator.clipboard.writeText(data.shareUrl);
                alert('Link copied to clipboard!');
            } else {
                prompt("Copy this link:", data.shareUrl);
            }
        }
    } catch (err) {
        console.error(err);
        alert('Failed to generate share link');
    }
}

// Utility functions
function sanitizeContent(content) {
    const div = document.createElement('div');
    div.textContent = content;
    return div.innerHTML.replace(/\n/g, '<br>');
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Close modal on outside click
window.onclick = function(event) {
    if (event.target == createPostModal) {
        closeCreatePostModal();
    }
}
