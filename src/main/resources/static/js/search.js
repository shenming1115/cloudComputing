// DOM Elements
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');
const filterChips = document.querySelectorAll('.filter-chip');

// State
let currentFilter = 'all';
let debounceTimer;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus();
    
    // Add input listener with debounce
    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            performSearch(e.target.value);
        }, 300);
    });
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

function setFilter(filter) {
    currentFilter = filter;
    
    // Update UI
    filterChips.forEach(chip => {
        chip.classList.remove('active');
        if (chip.textContent.toLowerCase() === filter) {
            chip.classList.add('active');
        }
    });

    // Re-run search if there's input
    if (searchInput.value) {
        performSearch(searchInput.value);
    }
}

async function performSearch(query) {
    if (!query.trim()) {
        searchResults.innerHTML = `
            <div class="text-center" style="grid-column: 1/-1; color: var(--text-secondary); padding: 40px;">
                Type something to start searching...
            </div>
        `;
        return;
    }

    searchResults.innerHTML = '<div class="text-center" style="grid-column: 1/-1;">Searching...</div>';

    try {
        // Fetch all posts (Client-side filtering for now as backend search is not implemented)
        // In a real app, we would have /api/search?q=query
        const response = await fetch('/api/posts');
        if (response.ok) {
            const posts = await response.json();
            const filteredPosts = posts.filter(post => 
                post.content.toLowerCase().includes(query.toLowerCase()) ||
                (post.user && post.user.username.toLowerCase().includes(query.toLowerCase()))
            );

            renderResults(filteredPosts, query);
        } else {
            searchResults.innerHTML = '<div class="text-center" style="grid-column: 1/-1;">Error searching posts.</div>';
        }
    } catch (error) {
        console.error('Search error:', error);
        searchResults.innerHTML = '<div class="text-center" style="grid-column: 1/-1;">Error searching posts.</div>';
    }
}

function renderResults(posts, query) {
    if (posts.length === 0) {
        searchResults.innerHTML = `
            <div class="text-center" style="grid-column: 1/-1; color: var(--text-secondary); padding: 40px;">
                No results found for "${query}"
            </div>
        `;
        return;
    }

    // Filter based on type if needed (currently only posts are supported)
    let displayPosts = posts;
    if (currentFilter === 'people') {
        displayPosts = []; // No user search yet
    }

    if (displayPosts.length === 0 && currentFilter === 'people') {
         searchResults.innerHTML = `
            <div class="text-center" style="grid-column: 1/-1; color: var(--text-secondary); padding: 40px;">
                User search is not supported yet.
            </div>
        `;
        return;
    }

    searchResults.innerHTML = displayPosts.map(post => createPostHTML(post)).join('');
}

function createPostHTML(post) {
    const user = post.user || { username: 'Unknown' };
    const avatar = user.username ? user.username.charAt(0).toUpperCase() : '?';
    const timestamp = new Date(post.createdAt).toLocaleString();
    const likes = 0;
    const commentsCount = post.comments ? post.comments.length : 0;

    // 安全地转义用户输入
    const safeUsername = escapeHtml(user.username);
    const safeContent = sanitizeContent(post.content);

    return `
        <article class="card post-card">
            <div class="post-header">
                <div class="user-avatar">${avatar}</div>
                <div class="post-info">
                    <h3>${safeUsername}</h3>
                    <span>@${safeUsername} · ${timestamp}</span>
                </div>
            </div>
            <div class="post-content">
                ${safeContent}
            </div>
            <div class="post-actions">
                <button class="action-btn">
                    <span>♥</span> ${likes}
                </button>
                <button class="action-btn" onclick="window.location.href='post-details.html?id=${post.id}'">
                    <span>💬</span> ${commentsCount}
                </button>
                <button class="action-btn">
                    <span>↗</span> Share
                </button>
            </div>
        </article>
    `;
}

    renderResults(results);


function renderResults(results) {
    if (results.length === 0) {
        searchResults.innerHTML = `
            <div class="text-center" style="grid-column: 1/-1; color: var(--text-secondary); padding: 40px;">
                No results found for "${searchInput.value}"
            </div>
        `;
        return;
    }

    searchResults.innerHTML = results.map(item => {
        if (item.type === 'post') {
            return createPostHTML(item);
        } else {
            return createUserHTML(item);
        }
    }).join('');
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
                <button class="action-btn"><span>♥</span> ${post.likes}</button>
                <button class="action-btn" onclick="window.location.href='post-details.html?id=${post.id}'"><span>💬</span> ${post.comments}</button>
            </div>
        </article>
    `;
}

function createUserHTML(user) {
    return `
        <div class="card user-result-card">
            <div class="user-avatar">${user.avatar}</div>
            <div class="user-result-info">
                <div class="user-result-name">${user.name}</div>
                <div class="user-result-handle">${user.handle}</div>
                <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 4px;">${user.bio}</div>
            </div>
            <button class="btn btn-secondary" style="padding: 4px 12px; font-size: 0.8rem;">Follow</button>
        </div>
    `;
}
