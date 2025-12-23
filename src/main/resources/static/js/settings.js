// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus();
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

function switchSection(sectionId) {
    // Update Sidebar
    document.querySelectorAll('.settings-nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('onclick').includes(sectionId)) {
            item.classList.add('active');
        }
    });

    // Update Content
    document.querySelectorAll('.settings-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(`${sectionId}Section`).classList.add('active');
}

function handleSaveAccount(event) {
    event.preventDefault();
    // TODO: Implement API call
    alert('Account settings saved successfully!');
}
