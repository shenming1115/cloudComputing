/**
 * Security Utility Functions
 * 用于防止 XSS 攻击和其他安全问题
 */

/**
 * 转义 HTML 特殊字符，防止 XSS 攻击
 * @param {string} text - 需要转义的文本
 * @returns {string} - 转义后的安全文本
 */
function escapeHtml(text) {
    if (!text) return '';
    
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * 安全地渲染用户内容（支持换行）
 * @param {string} content - 用户输入的内容
 * @returns {string} - 安全的 HTML 字符串
 */
function sanitizeContent(content) {
    if (!content) return '';
    
    // 转义 HTML 标签
    const escaped = escapeHtml(content);
    
    // 保留换行符（转换为 <br>）
    return escaped.replace(/\n/g, '<br>');
}

/**
 * 验证 URL 是否安全（防止 javascript: 等协议）
 * @param {string} url - 需要验证的 URL
 * @returns {boolean} - 是否安全
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
 * 格式化时间戳
 * @param {string|Date} timestamp - 时间戳
 * @returns {string} - 格式化后的时间
 */
function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000); // 秒

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    
    return date.toLocaleDateString();
}

/**
 * 限制字符串长度
 * @param {string} text - 原始文本
 * @param {number} maxLength - 最大长度
 * @returns {string} - 截断后的文本
 */
function truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}
