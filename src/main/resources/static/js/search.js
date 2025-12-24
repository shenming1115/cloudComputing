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
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    if (!token || !userData) {
        window.location.href = 'login.html';
    }
}

function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
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
        const token = localStorage.getItem('authToken');
        const response = await fetch(`/api/search?query=${encodeURIComponent(query)}&type=${currentFilter}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            renderResults(data, query);
        } else {
            searchResults.innerHTML = '<div class="text-center" style="grid-column: 1/-1;">Error searching.</div>';
        }
    } catch (error) {
        console.error('Search error:', error);
        searchResults.innerHTML = '<div class="text-center" style="grid-column: 1/-1;">Error searching.</div>';
    }
}

function renderResults(data, query) {
    const posts = data.posts || [];
    const users = data.users || [];
    const allResults = [...posts, ...users];

    if (allResults.length === 0) {
        searchResults.innerHTML = `
            <div class="text-center" style="grid-column: 1/-1; color: var(--text-secondary); padding: 40px;">
                No results found for "${query}"
            </div>
        `;
        return;
    }

    let html = '';
    
    // Render users first if any
    if (users.length > 0) {
        html += users.map(user => createUserHTML(user)).join('');
    }

    // Render posts
    if (posts.length > 0) {
        html += posts.map(post => createPostHTML(post)).join('');
    }

    searchResults.innerHTML = html;
}

function createPostHTML(post) {
    const user = post.user || { username: 'Unknown' };
    const avatar = user.username ? user.username.charAt(0).toUpperCase() : '?';
    const timestamp = new Date(post.createdAt).toLocaleString();
    const likes = 0;
    const commentsCount = post.comments ? post.comments.length : 0;

    // Safely escape user input
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

function createUserHTML(user) {
    const avatar = user.username ? user.username.charAt(0).toUpperCase() : '?';
    const safeUsername = escapeHtml(user.username);
    const safeEmail = escapeHtml(user.email);

    return `
        <div class="card user-result-card" style="display: flex; align-items: center; padding: 15px; gap: 15px;">
            <div class="user-avatar" style="width: 50px; height: 50px; font-size: 1.2rem;">${avatar}</div>
            <div class="user-result-info" style="flex: 1;">
                <div class="user-result-name" style="font-weight: bold;">${safeUsername}</div>
                <div class="user-result-handle" style="color: var(--text-secondary); font-size: 0.9rem;">${safeEmail}</div>
            </div>
            <button class="btn btn-secondary" style="padding: 6px 16px; font-size: 0.9rem;">View Profile</button>
        </div>
    `;
}
