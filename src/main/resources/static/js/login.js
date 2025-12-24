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
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch('/api/users/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const contentType = response.headers.get("content-type");
        if (response.ok) {
            if (contentType && contentType.indexOf("application/json") !== -1) {
                const data = await response.json();
                
                // Store JWT token and user data
                if (data.token) {
                    localStorage.setItem('authToken', data.token);
                    localStorage.setItem('userData', JSON.stringify({
                        id: data.id,
                        username: data.username,
                        email: data.email,
                        role: data.role
                    }));
                    
                    // Remove legacy keys
                    localStorage.removeItem('isLoggedIn');
                    localStorage.removeItem('user');
                    
                    // Redirect based on role or username
                    if (data.role === 'ADMIN' || data.username === 'admin123') {
                        window.location.href = 'admin-dashboard.html';
                    } else {
                        window.location.href = 'index.html';
                    }
                } else {
                    alert('Login failed: No token received');
                }
            } else {
                alert('Login failed: Invalid response format');
            }
        } else {
            if (contentType && contentType.indexOf("application/json") !== -1) {
                const error = await response.json();
                const msg = error.message || error.error || 'Unknown error';
                alert('Login failed: ' + msg);
            } else {
                if (response.status === 404) {
                    alert('Login service not found (404). Please check the server URL.');
                } else if (response.status === 405) {
                    alert('Login method not allowed (405). This is a server configuration issue.');
                } else if (response.status === 500) {
                    alert('Internal Server Error (500). Please try again later.');
                } else {
                    const text = await response.text();
                    alert(`Login failed (${response.status}): ${text.substring(0, 100)}`);
                }
            }
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Network or System Error: ' + error.message);
    }
}

async function handleRegister(event) {
    event.preventDefault();
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;

    try {
        const response = await fetch('/api/users/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password })
        });

        const contentType = response.headers.get("content-type");
        
        if (response.ok) {
            if (contentType && contentType.indexOf("application/json") !== -1) {
                const data = await response.json();
                
                // Store JWT token and user data (auto-login after registration)
                if (data.token) {
                    localStorage.setItem('authToken', data.token);
                    localStorage.setItem('userData', JSON.stringify({
                        id: data.id,
                        username: data.username,
                        email: data.email,
                        role: data.role
                    }));
                    
                    alert('Registration successful! Welcome!');
                    window.location.href = 'index.html';
                } else {
                    alert('Registration successful! Please login.');
                    switchTab('login');
                }
            } else {
                alert('Registration successful! Please login.');
                switchTab('login');
            }
        } else {
            if (contentType && contentType.indexOf("application/json") !== -1) {
                const errorData = await response.json();
                let errorMessage = 'Registration failed';
                
                if (errorData.errors) {
                    errorMessage += ':\n' + Object.values(errorData.errors).join('\n');
                } else if (errorData.message) {
                    errorMessage += ': ' + errorData.message;
                } else if (errorData.error) {
                    errorMessage += ': ' + errorData.error;
                }
                
                alert(errorMessage);
            } else {
                if (response.status === 404) {
                    alert('Registration service not found (404). Please check the server URL.');
                } else if (response.status === 405) {
                    alert('Registration method not allowed (405). This is a server configuration issue.');
                } else if (response.status === 500) {
                    alert('Internal Server Error (500). Please try again later.');
                } else {
                    const text = await response.text();
                    alert(`Registration failed (${response.status}): ${text.substring(0, 100)}...`);
                }
            }
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Network or System Error: ' + error.message);
    }
}
