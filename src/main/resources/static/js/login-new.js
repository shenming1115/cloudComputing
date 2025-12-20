function switchTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(t => {
        t.classList.remove('active');
    });
    event.target.classList.add('active');

    document.querySelectorAll('.auth-form').forEach(f => {
        f.classList.remove('active');
    });
    document.getElementById(`${tab}Form`).classList.add('active');
}

async function handleLogin(event) {
    event.preventDefault();
    const identifier = document.getElementById('loginUsername').value.trim();
    const email = document.getElementById('loginEmail')?.value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!identifier || !password) {
        alert('Please fill in all fields');
        return;
    }

    try {
        const response = await fetch('/api/users/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                username: identifier,
                email: email || identifier,
                password: password 
            })
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('user', JSON.stringify(data));
            window.location.href = 'index.html';
        } else {
            const error = await response.json();
            alert('Login failed: ' + (error.error || error.message || 'Invalid credentials'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Network error: ' + error.message);
    }
}

async function handleRegister(event) {
    event.preventDefault();
    const username = document.getElementById('registerUsername').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword')?.value;

    // Validation
    if (!username || !email || !password) {
        alert('Please fill in all fields');
        return;
    }

    if (confirmPassword && password !== confirmPassword) {
        alert('Passwords do not match!');
        return;
    }

    // Password strength check (client-side)
    const passwordRegex = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!]).{8,}$/;
    if (!passwordRegex.test(password)) {
        alert('Password must be at least 8 characters long and contain:\n' +
              '- At least one digit\n' +
              '- At least one lowercase letter\n' +
              '- At least one uppercase letter\n' +
              '- At least one special character (@#$%^&+=!)');
        return;
    }

    try {
        const response = await fetch('/api/users/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password })
        });

        if (response.ok) {
            alert('Registration successful! Please login.');
            switchTab('login');
        } else {
            const error = await response.json();
            alert('Registration failed: ' + (error.error || error.message || 'Please try again'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Network error: ' + error.message);
    }
}
