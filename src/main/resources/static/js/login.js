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
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('user', JSON.stringify(data));
                window.location.href = 'index.html';
            } else {
                // Fallback if successful but no JSON returned
                localStorage.setItem('isLoggedIn', 'true');
                // We might not have user details here, so we might need to fetch them or just redirect
                window.location.href = 'index.html';
            }
        } else {
            if (contentType && contentType.indexOf("application/json") !== -1) {
                const error = await response.json();
                // Check for various error formats
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
            alert('Registration successful! Please login.');
            switchTab('login');
        } else {
            if (contentType && contentType.indexOf("application/json") !== -1) {
                const errorData = await response.json();
                let errorMessage = 'Registration failed';
                
                if (errorData.errors) {
                    // Validation errors map
                    errorMessage += ':\n' + Object.values(errorData.errors).join('\n');
                } else if (errorData.message) {
                    // Custom exception message
                    errorMessage += ': ' + errorData.message;
                } else if (errorData.error) {
                    // Standard Spring error
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
