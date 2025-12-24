/**
 * Security Utility Functions
 * Prevents XSS attacks and other security issues
 */

/**
 * Escape HTML special characters to prevent XSS attacks
 * @param {string} text - Text to escape
 * @returns {string} - Escaped safe text
 */
function escapeHtml(text) {
    if (!text) return '';
    
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Safely render user content (supports line breaks)
 * @param {string} content - User input content
 * @returns {string} - Safe HTML string
 */
function sanitizeContent(content) {
    if (!content) return '';
    
    // Escape HTML tags
    const escaped = escapeHtml(content);
    
    // Preserve line breaks (convert to <br>)
    return escaped.replace(/\n/g, '<br>');
}

/**
 * Validate URL safety (prevents javascript: protocol and others)
 * @param {string} url - URL to validate
 * @returns {boolean} - Whether URL is safe
 */
function isSafeUrl(url) {
    if (!url) return false;
    
    const safeProtocols = ['http:', 'https:', 'mailto:'];
    try {
        const urlObj = new URL(url, window.location.origin);
        return safeProtocols.includes(urlObj.protocol);
    } catch {
        return false;
    }
}

/**
 * Format timestamp to human-readable string
 * @param {string|Date} timestamp - Timestamp to format
 * @returns {string} - Formatted time string
 */
function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000); // seconds

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    
    return date.toLocaleDateString();
}

/**
 * Truncate text to maximum length
 * @param {string} text - Original text
 * @param {number} maxLength - Maximum length
 * @returns {string} - Truncated text with ellipsis
 */
function truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}
