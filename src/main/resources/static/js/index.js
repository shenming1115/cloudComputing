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
        // Ensure token is available for requests
        if (currentUser.token && !localStorage.getItem('authToken')) {
            localStorage.setItem('authToken', currentUser.token);
        }
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

        // Admin Dashboard Link
        if (currentUser.role === 'ADMIN') {
            if (!document.getElementById('adminDashboardLink')) {
                const adminLink = document.createElement('a');
                adminLink.id = 'adminDashboardLink';
                adminLink.href = '/html/admin-dashboard.html';
                adminLink.className = 'nav-item';
                adminLink.innerHTML = '<i class="fas fa-shield-alt"></i> Admin';
                adminLink.style.marginRight = '1rem';
                adminLink.style.color = '#ef4444'; // Red color to stand out
                navUser.insertBefore(adminLink, navUser.firstChild);
            }
        }

        // Update avatar and show role badge
        if (currentUser.username) {
             const avatar = currentUser.username.charAt(0).toUpperCase();
             const navUserAvatar = document.getElementById('navUserAvatar');
             navUserAvatar.textContent = avatar;
             
             // Add role badge next to avatar
             const role = currentUser.role || 'USER';
             const roleBadge = role === 'ADMIN' ? 
                 '<span style="background: #e74c3c; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; margin-left: 8px;">ADMIN</span>' :
                 '';
             
             // Update navigation to show role
             const navUserContainer = document.getElementById('navUser');
             let existingBadge = navUserContainer.querySelector('.role-badge');
             if (!existingBadge && role === 'ADMIN') {
                 const badgeElement = document.createElement('span');
                 badgeElement.className = 'role-badge';
                 badgeElement.style.cssText = 'background: #e74c3c; color: white; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: 600;';
                 badgeElement.textContent = 'ADMIN';
                 navUserContainer.insertBefore(badgeElement, navUserAvatar);
             }
             
             const widgetAvatar = document.querySelector('.create-post-card .user-avatar');
             if (widgetAvatar) widgetAvatar.textContent = avatar;
        }

        // Update right sidebar with user info
        updateUserSidebar();

        // Force refresh user data from server to ensure role is up to date
        if (currentUser.id) {
            fetch(`/api/users/${currentUser.id}`, {
                headers: getAuthHeaders()
            })
            .then(res => {
                if (res.ok) return res.json();
                throw new Error('Failed to fetch user data');
            })
            .then(updatedUser => {
                console.log('Refreshed user data from server:', updatedUser);
                // Merge updated data with existing token
                const newData = { ...currentUser, ...updatedUser };
                // Ensure role is present
                if (!newData.role) newData.role = 'USER';
                
                // Fallback: Ensure admin123 is always ADMIN
                if (newData.username === 'admin123') {
                    newData.role = 'ADMIN';
                }

                // Only update if something changed
                if (JSON.stringify(newData) !== JSON.stringify(currentUser)) {
                    console.log('User data changed, updating UI...');
                    currentUser = newData;
                    localStorage.setItem('userData', JSON.stringify(currentUser));
                    
                    // Re-run UI updates
                    updateUserSidebar();
                    
                    // Update nav badge if needed
                    const role = currentUser.role;
                    const navUserContainer = document.getElementById('navUser');
                    let existingBadge = navUserContainer.querySelector('.role-badge');
                    
                    if (role === 'ADMIN') {
                        if (!existingBadge) {
                             const badgeElement = document.createElement('span');
                             badgeElement.className = 'role-badge';
                             badgeElement.style.cssText = 'background: #e74c3c; color: white; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: 600;';
                             badgeElement.textContent = 'ADMIN';
                             const avatarEl = document.getElementById('navUserAvatar');
                             if (avatarEl && avatarEl.parentNode === navUserContainer) {
                                navUserContainer.insertBefore(badgeElement, avatarEl);
                             }
                        }
                    } else if (existingBadge) {
                        existingBadge.remove();
                    }
                }
            })
            .catch(err => console.warn('Background user refresh failed:', err));
        }
    } else {
        navGuest.style.display = 'flex';
        navUser.style.display = 'none';
        navProfileLink.style.display = 'none';
        heroSection.style.display = 'block';
        if (createPostCard) createPostCard.style.display = 'none';
        
        // Hide sidebar when not logged in
        const sidebar = document.getElementById('sidebarRight');
        if (sidebar) sidebar.style.display = 'none';
    }
}

function updateUserSidebar() {
    console.log('updateUserSidebar called');
    try {
        const sidebar = document.getElementById('sidebarRight');
        if (!sidebar) {
            return;
        }
        
        if (!currentUser) {
            sidebar.style.display = 'none';
            return;
        }
        
        // Ensure sidebar is visible
        sidebar.style.display = 'block';

        // Helper to safely update text
        const setText = (id, text) => {
            const el = document.getElementById(id);
            if (el) {
                el.textContent = text;
            } else {
                console.warn(`Element with id '${id}' not found`);
            }
        };

        // Update Basic Info
        const avatar = currentUser.username ? currentUser.username.charAt(0).toUpperCase() : '?';
        setText('sidebarAvatar', avatar);
        setText('sidebarUsername', currentUser.username || 'Unknown User');
        setText('sidebarEmail', currentUser.email || 'No email provided');
        setText('sidebarUserId', currentUser.id || 'N/A');
        
        // Update Member Since
        const year = currentUser.createdAt ? new Date(currentUser.createdAt).getFullYear() : new Date().getFullYear();
        setText('sidebarMemberSince', year);

        // Update Role Badge & Text
        const role = currentUser.role || 'USER';
        setText('sidebarRole', role);
        
        const roleBadgeContainer = document.getElementById('sidebarRoleBadge');
        if (roleBadgeContainer) {
            if (role === 'ADMIN') {
                roleBadgeContainer.innerHTML = '<span style="background: #e74c3c; color: white; padding: 4px 12px; border-radius: 6px; font-size: 12px; font-weight: 700; letter-spacing: 0.5px;">🛡️ ADMIN</span>';
            } else {
                roleBadgeContainer.innerHTML = '<span style="background: #3498db; color: white; padding: 4px 12px; border-radius: 6px; font-size: 12px; font-weight: 700; letter-spacing: 0.5px;">👤 USER</span>';
            }
        }

        // Update Permissions
        const permissionsContainer = document.getElementById('sidebarPermissions');
        if (permissionsContainer) {
            if (role === 'ADMIN') {
                permissionsContainer.innerHTML = `
                    <li style="color: #27ae60;">✓ Create & Edit Posts</li>
                    <li style="color: #27ae60;">✓ Delete Any Post</li>
                    <li style="color: #27ae60;">✓ Manage Users</li>
                    <li style="color: #27ae60;">✓ Admin Panel Access</li>
                `;
            } else {
                permissionsContainer.innerHTML = `
                    <li style="color: #27ae60;">✓ Create Posts</li>
                    <li style="color: #27ae60;">✓ Edit Own Posts</li>
                    <li style="color: #95a5a6;">✗ Delete Others' Posts</li>
                    <li style="color: #95a5a6;">✗ Admin Panel Access</li>
                `;
            }
        }
        
    } catch (e) {
        console.error('CRITICAL ERROR in updateUserSidebar:', e);
        alert('UI Error: ' + e.message);
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
                    userId: user.id, // Add userId for ownership check
                    user: { 
                        name: user.username, 
                        handle: '@' + user.username, 
                        avatar: user.username ? user.username.charAt(0).toUpperCase() : '?',
                        role: user.role || 'USER'
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
    
    // Add role badge if user is admin
    const userRole = post.user.role || 'USER';
    const roleBadge = userRole === 'ADMIN' ? 
        '<span style="background: #e74c3c; color: white; padding: 2px 6px; border-radius: 3px; font-size: 10px; font-weight: 600; margin-left: 6px;">ADMIN</span>' : 
        '';
    
    // Add delete button if admin or owner
    let deleteButton = '';
    if (isLoggedIn && currentUser) {
        const isAdmin = currentUser.role === 'ADMIN';
        const isOwner = currentUser.id === post.userId;
        
        if (isAdmin || isOwner) {
            deleteButton = `
                <button class="action-btn delete-btn" onclick="deletePost(${post.id})" style="color: #e74c3c; margin-left: auto;">
                    <span>🗑️</span> Delete
                </button>
            `;
        }
    }
    
    return `
        <article class="card post-card" id="post-${post.id}">
            <div class="post-header">
                <div class="user-avatar">${post.user.avatar}</div>
                <div class="post-info">
                    <h3>${safeName}${roleBadge}</h3>
                    <span>${safeHandle} · ${post.timestamp}</span>
                </div>
                ${deleteButton}
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
function deletePost(postId) {
    if (!confirm('Are you sure you want to delete this post?')) {
        return;
    }

    fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
    })
    .then(response => {
        if (response.ok) {
            // Remove post from UI
            const postElement = document.getElementById(`post-${postId}`);
            if (postElement) {
                postElement.remove();
            } else {
                renderPosts(); // Fallback
            }
        } else {
            return response.json().then(err => {
                throw new Error(err.message || 'Failed to delete post');
            });
        }
    })
    .catch(error => {
        console.error('Error deleting post:', error);
        alert('Failed to delete post: ' + error.message);
    });
}

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
