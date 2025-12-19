function switchTab(tab) {
    // Update tabs
    document.querySelectorAll('.auth-tab').forEach(t => {
        t.classList.remove('active');
    });
    event.target.classList.add('active');

    // Update forms
    document.querySelectorAll('.auth-form').forEach(f => {
        f.classList.remove('active');
    });
    document.getElementById(`${tab}Form`).classList.add('active');
}

async function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    console.log('Login attempt:', { email, password });
    
    // TODO: Implement actual API call
    // const response = await fetch('/api/login', { ... });
    
    // Simulate successful login
    localStorage.setItem('isLoggedIn', 'true');
    window.location.href = 'index.html';
}

async function handleRegister(event) {
    event.preventDefault();
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;

    console.log('Register attempt:', { name, email, password });

    // TODO: Implement actual API call
    // const response = await fetch('/api/register', { ... });

    // Simulate successful registration and login
    localStorage.setItem('isLoggedIn', 'true');
    window.location.href = 'index.html';
}
