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
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

function getPostIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

async function loadPostDetails() {
    const postId = getPostIdFromUrl();
    if (!postId) {
        postContainer.innerHTML = '<div class="text-center">Post ID not found.</div>';
        return;
    }

    try {
        const response = await fetch(`/api/posts/${postId}`);
        if (response.ok) {
            const post = await response.json();
            renderPost(post);
        } else {
            postContainer.innerHTML = '<div class="text-center">Post not found.</div>';
        }
    } catch (error) {
        console.error('Error loading post:', error);
        postContainer.innerHTML = '<div class="text-center">Error loading post.</div>';
    }
}

function renderPost(post) {
    const user = post.user || { username: 'Unknown', id: 0 };
    const avatar = user.username ? user.username.charAt(0).toUpperCase() : '?';
    const timestamp = new Date(post.createdAt).toLocaleString();
    const likes = 0; // TODO: Implement likes
    const commentsCount = post.comments ? post.comments.length : 0;

    // 安全地转义用户输入
    const safeUsername = escapeHtml(user.username);
    const safeContent = sanitizeContent(post.content);

    postContainer.innerHTML = `
        <article class="card post-card">
            <div class="post-header">
                <div class="user-avatar">${avatar}</div>
                <div class="post-info">
                    <h3>${safeUsername}</h3>
                    <span>@${safeUsername} · ${timestamp}</span>
                </div>
            </div>
            <div class="post-content" style="font-size: 1.1rem;">
                ${safeContent}
            </div>
            <div class="post-actions">
                <button class="action-btn">
                    <span>♥</span> ${likes}
                </button>
                <button class="action-btn">
                    <span>💬</span> ${commentsCount}
                </button>
                <button class="action-btn" onclick="sharePost(${post.id})">
                    <span>↗</span> Share
                </button>
            </div>
        </article>
    `;
}

async function loadComments() {
    const postId = getPostIdFromUrl();
    if (!postId) return;

    try {
        const response = await fetch(`/api/comments/post/${postId}`);
        if (response.ok) {
            const comments = await response.json();
            if (comments.length === 0) {
                commentsList.innerHTML = '<div class="text-center" style="padding: 20px; color: var(--text-secondary);">No comments yet. Be the first to comment!</div>';
            } else {
                commentsList.innerHTML = comments.map(comment => createCommentHTML(comment)).join('');
            }
        } else {
            commentsList.innerHTML = '<div class="text-center">Failed to load comments.</div>';
        }
    } catch (error) {
        console.error('Error loading comments:', error);
        commentsList.innerHTML = '<div class="text-center">Error loading comments.</div>';
    }
}

function createCommentHTML(comment) {
    const user = comment.user || { username: 'Unknown' };
    const avatar = user.username ? user.username.charAt(0).toUpperCase() : '?';
    const timestamp = new Date(comment.createdAt).toLocaleString();

    // 安全地转义用户输入
    const safeUsername = escapeHtml(user.username);
    const safeContent = sanitizeContent(comment.content);

    return `
        <div class="comment-item">
            <div class="user-avatar" style="width: 32px; height: 32px; font-size: 0.8rem;">${avatar}</div>
            <div class="comment-content">
                <div class="comment-header">
                    <span class="comment-author">${safeUsername}</span>
                    <span class="comment-time">${timestamp}</span>
                </div>
                <div class="comment-text">${safeContent}</div>
            </div>
        </div>
    `;
}

async function submitComment() {
    const content = commentInput.value.trim();
    if (!content) return;

    const postId = getPostIdFromUrl();
    const user = JSON.parse(localStorage.getItem('user'));

    if (!user || !postId) return;

    const commentData = {
        content: content,
        postId: parseInt(postId),
        userId: user.id
    };

    try {
        const response = await fetch('/api/comments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(commentData)
        });

        if (response.ok) {
            commentInput.value = '';
            loadComments(); // Reload comments
            loadPostDetails(); // Reload post to update comment count
        } else {
            alert('Failed to post comment');
        }
    } catch (error) {
        console.error('Error posting comment:', error);
        alert('Error posting comment');
    }
}

async function sharePost(postId) {
    try {
        const response = await fetch(`/api/posts/${postId}/share`, {
            method: 'POST'
        });
        
        if (response.ok) {
            const data = await response.json();
            // Copy to clipboard
            navigator.clipboard.writeText(data.shareUrl).then(() => {
                alert('Share link copied to clipboard!');
            });
        } else {
            alert('Failed to generate share link');
        }
    } catch (error) {
        console.error('Error sharing post:', error);
        alert('Error sharing post');
    }
}
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

