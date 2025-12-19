// Mock Data
const MOCK_RESULTS = {
    posts: [
        {
            id: 1,
            type: 'post',
            user: { name: 'Sarah Wilson', handle: '@sarahw', avatar: 'S' },
            content: 'Just finished working on the new design system. Loving the minimalist vibes! 🎨✨ #Design #Minimalism',
            timestamp: '2 hours ago',
            likes: 24,
            comments: 5
        },
        {
            id: 2,
            type: 'post',
            user: { name: 'David Chen', handle: '@davidc', avatar: 'D' },
            content: 'Cloud computing is changing the way we deploy applications. The scalability is incredible.',
            timestamp: '4 hours ago',
            likes: 15,
            comments: 2
        }
    ],
    people: [
        { id: 101, type: 'user', name: 'Alice Design', handle: '@alice', avatar: 'A', bio: 'UI/UX Designer' },
        { id: 102, type: 'user', name: 'Bob Builder', handle: '@bob_dev', avatar: 'B', bio: 'Full Stack Developer' }
    ]
};

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

function performSearch(query) {
    if (!query.trim()) {
        searchResults.innerHTML = `
            <div class="text-center" style="grid-column: 1/-1; color: var(--text-secondary); padding: 40px;">
                Type something to start searching...
            </div>
        `;
        return;
    }

    // Simulate API search
    const results = [];
    
    if (currentFilter === 'all' || currentFilter === 'posts') {
        results.push(...MOCK_RESULTS.posts.filter(p => p.content.toLowerCase().includes(query.toLowerCase())));
    }
    
    if (currentFilter === 'all' || currentFilter === 'people') {
        results.push(...MOCK_RESULTS.people.filter(u => u.name.toLowerCase().includes(query.toLowerCase()) || u.handle.toLowerCase().includes(query.toLowerCase())));
    }

    renderResults(results);
}

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
