let loginWidgetId;
let registerWidgetId;

// Callback function called by Cloudflare Turnstile script when ready
window.onloadTurnstileCallback = function() {
    console.log("Turnstile script loaded, rendering widgets...");
    
    // Render Login Widget
    try {
        const loginContainer = document.getElementById('loginTurnstile');
        if (loginContainer) {
            loginContainer.innerHTML = ''; // Clear previous content
            loginWidgetId = turnstile.render('#loginTurnstile', {
                sitekey: '1x00000000000000000000AA',
                theme: 'light',
                callback: function(token) {
                    console.log('Login Turnstile challenge success', token);
                },
                'error-callback': function(err) {
                    console.error('Login Turnstile challenge error', err);
                }
            });
        }
    } catch (e) {
        console.error('Error rendering login turnstile:', e);
    }

    // Render Register Widget
    try {
        const registerContainer = document.getElementById('registerTurnstile');
        if (registerContainer) {
            registerContainer.innerHTML = ''; // Clear previous content
            registerWidgetId = turnstile.render('#registerTurnstile', {
                sitekey: '1x00000000000000000000AA',
                theme: 'light',
                callback: function(token) {
                    console.log('Register Turnstile challenge success', token);
                },
                'error-callback': function(err) {
                    console.error('Register Turnstile challenge error', err);
                }
            });
        }
    } catch (e) {
        console.error('Error rendering register turnstile:', e);
    }
};

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

    // Get Turnstile token
    const turnstileToken = turnstile.getResponse(loginWidgetId);
    if (!turnstileToken) {
        alert('Please complete the security verification (Turnstile)');
        return;
    }

    try {
        // Verify Turnstile token first
        const turnstileVerify = await fetch('/api/turnstile/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: turnstileToken })
        });

        if (!turnstileVerify.ok) {
            alert('Security verification failed. Please try again.');
            turnstile.reset(loginWidgetId);
            return;
        }

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
            turnstile.reset(loginWidgetId);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Network error: ' + error.message);
        turnstile.reset(loginWidgetId);
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

    // Get Turnstile token
    const turnstileToken = turnstile.getResponse(registerWidgetId);
    if (!turnstileToken) {
        alert('Please complete the security verification (Turnstile)');
        return;
    }

    try {
        // Verify Turnstile token first
        const turnstileVerify = await fetch('/api/turnstile/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: turnstileToken })
        });

        if (!turnstileVerify.ok) {
            alert('Security verification failed. Please try again.');
            turnstile.reset(registerWidgetId);
            return;
        }

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
            turnstile.reset(registerWidgetId);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Network error: ' + error.message);
        turnstile.reset(registerWidgetId);
    }
}

// Handle OAuth callback (when returning from Google login)
window.addEventListener('DOMContentLoaded', () => {
    // If Turnstile is already loaded (cached), manually trigger callback
    if (typeof turnstile !== 'undefined' && typeof loginWidgetId === 'undefined') {
        window.onloadTurnstileCallback();
    }

    const urlParams = new URLSearchParams(window.location.search);
    const oauthToken = urlParams.get('oauth_token');
    const username = urlParams.get('username');
    const email = urlParams.get('email');
    const role = urlParams.get('role');

    if (oauthToken) {
        // Store OAuth token
        localStorage.setItem('authToken', oauthToken);
        localStorage.setItem('userData', JSON.stringify({ username, email, role }));
        localStorage.setItem('isLoggedIn', 'true');
        
        // Clear URL parameters and redirect
        window.history.replaceState({}, document.title, '/html/index.html');
        window.location.href = '/html/index.html';
    }
});
