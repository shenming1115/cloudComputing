/**
 * Authentication Utility Module
 * Handles JWT token storage and retrieval
 */

const AUTH_TOKEN_KEY = 'authToken';
const USER_DATA_KEY = 'userData';

// Get JWT token from localStorage
function getAuthToken() {
    return localStorage.getItem(AUTH_TOKEN_KEY);
}

// Set JWT token in localStorage
function setAuthToken(token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
}

// Remove JWT token from localStorage
function removeAuthToken() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
}

// Get user data from localStorage
function getUserData() {
    const userData = localStorage.getItem(USER_DATA_KEY);
    return userData ? JSON.parse(userData) : null;
}

// Set user data in localStorage
function setUserData(userData) {
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
}

// Remove user data from localStorage
function removeUserData() {
    localStorage.removeItem(USER_DATA_KEY);
}

// Check if user is logged in
function isLoggedIn() {
    return !!getAuthToken();
}

// Logout user
function logout() {
    removeAuthToken();
    removeUserData();
    // Also remove legacy keys if they exist
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('user');
    window.location.href = '/html/login.html';
}

// Get Authorization header for fetch requests
function getAuthHeaders() {
    const token = getAuthToken();
    if (token) {
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    }
    return {
        'Content-Type': 'application/json'
    };
}

// Make authenticated fetch request
async function authFetch(url, options = {}) {
    const token = getAuthToken();
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        }
    };
    
    const mergedOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    };
    
    try {
        const response = await fetch(url, mergedOptions);
        
        // Handle 401 Unauthorized - token expired or invalid
        if (response.status === 401) {
            console.warn('Authentication failed. Redirecting to login...');
            logout();
            return response;
        }
        
        return response;
    } catch (error) {
        console.error('Fetch error:', error);
        throw error;
    }
}

// Export functions for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getAuthToken,
        setAuthToken,
        removeAuthToken,
        getUserData,
        setUserData,
        removeUserData,
        isLoggedIn,
        logout,
        getAuthHeaders,
        authFetch
    };
}
