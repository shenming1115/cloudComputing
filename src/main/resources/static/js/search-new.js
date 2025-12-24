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
    
    filterChips.forEach(chip => {
        chip.classList.remove('active');
        if (chip.textContent.toLowerCase() === filter) {
            chip.classList.add('active');
        }
    });

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
        const response = await fetch(`/api/search?query=${encodeURIComponent(query)}&type=${currentFilter}`);
        
        if (response.ok) {
            const data = await response.json();
            renderResults(data, query);
        } else {
            searchResults.innerHTML = '<div class="text-center" style="grid-column: 1/-1;">Error searching. Please try again.</div>';
        }
    } catch (error) {
        console.error('Search error:', error);
        searchResults.innerHTML = '<div class="text-center" style="grid-column: 1/-1;">Network error. Please try again.</div>';
    }
}

function renderResults(data, query) {
    let html = '';
    let totalResults = 0;

    if (currentFilter === 'all') {
        const posts = data.posts || [];
        const users = data.users || [];
        totalResults = posts.length + users.length;

        if (totalResults === 0) {
            searchResults.innerHTML = `
                <div class="text-center" style="grid-column: 1/-1; color: var(--text-secondary); padding: 40px;">
                    No results found for "${query}"
                </div>
            `;
            return;
        }

        // Render posts
        if (posts.length > 0) {
            html += '<div style="grid-column: 1/-1; font-weight: 600; margin-bottom: 12px;">Posts</div>';
            posts.forEach(post => {
                html += createPostCard(post);
            });
        }

        // Render users
        if (users.length > 0) {
            html += '<div style="grid-column: 1/-1; font-weight: 600; margin-top: 24px; margin-bottom: 12px;">People</div>';
            users.forEach(user => {
                html += createUserCard(user);
            });
        }
    } else if (currentFilter === 'people') {
        const users = data.users || [];
        totalResults = users.length;

        if (totalResults === 0) {
            searchResults.innerHTML = `
                <div class="text-center" style="grid-column: 1/-1; color: var(--text-secondary); padding: 40px;">
                    No people found for "${query}"
                </div>
            `;
            return;
        }

        users.forEach(user => {
            html += createUserCard(user);
        });
    } else if (currentFilter === 'tags') {
        const posts = data.posts || [];
        totalResults = posts.length;

        if (totalResults === 0) {
            searchResults.innerHTML = `
                <div class="text-center" style="grid-column: 1/-1; color: var(--text-secondary); padding: 40px;">
                    No posts with tag "${query}" found
                </div>
            `;
            return;
        }

        posts.forEach(post => {
            html += createPostCard(post);
        });
    }

    searchResults.innerHTML = html;
}

function createPostCard(post) {
    const user = post.user || { username: 'Unknown' };
    const avatar = user.username ? user.username.charAt(0).toUpperCase() : '?';
    const timestamp = new Date(post.createdAt).toLocaleDateString('en-MY', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone: 'Asia/Kuala_Lumpur'
    });

    return `
        <div class="card" style="padding: 16px; cursor: pointer;" onclick="window.location.href='post-details.html?id=${post.id}'">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                <div class="user-avatar" style="width: 40px; height: 40px; background: var(--primary-blue); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600;">
                    ${avatar}
                </div>
                <div>
                    <div style="font-weight: 600; font-size: 15px;">${user.username}</div>
                    <div style="font-size: 13px; color: var(--text-secondary);">${timestamp}</div>
                </div>
            </div>
            <div style="color: var(--text-primary);">${post.content.substring(0, 200)}${post.content.length > 200 ? '...' : ''}</div>
        </div>
    `;
}

function createUserCard(user) {
    const avatar = user.username ? user.username.charAt(0).toUpperCase() : '?';

    return `
        <div class="card" style="padding: 16px; cursor: pointer;" onclick="window.location.href='profile.html?id=${user.id}'">
            <div style="display: flex; align-items: center; gap: 12px;">
                <div class="user-avatar" style="width: 50px; height: 50px; background: var(--primary-blue); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 20px;">
                    ${avatar}
                </div>
                <div style="flex: 1;">
                    <div style="font-weight: 600; font-size: 16px;">${user.username}</div>
                    <div style="font-size: 14px; color: var(--text-secondary);">${user.email}</div>
                    ${user.bio ? `<div style="font-size: 14px; margin-top: 4px;">${user.bio}</div>` : ''}
                </div>
            </div>
        </div>
    `;
}
