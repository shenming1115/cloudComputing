console.log("Admin Dashboard JS Loaded - Version 2 (Pagination Fix)");
document.addEventListener('DOMContentLoaded', () => {
    checkAdminAuth();
    
    // Initial Load
    loadStats();
    loadUsers();
    loadPosts();
    
    // Auto-refresh stats every 5 seconds for "Real-time" feel
    setInterval(loadStats, 5000);
});

function checkAdminAuth() {
    const user = getUserData();
    if (!user || user.role !== 'ADMIN') {
        alert('Access Denied: God Mode privileges required.');
        window.location.href = '/html/index.html';
    }
    document.getElementById('adminUsername').textContent = user.username;
}

function showSection(sectionId) {
    // Update Sidebar
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    const activeLink = document.querySelector(`a[onclick="showSection('${sectionId}')"]`);
    if (activeLink) activeLink.classList.add('active');
    
    // Update Content
    document.querySelectorAll('.section').forEach(el => el.classList.remove('active'));
    const targetSection = document.getElementById(sectionId);
    if (targetSection) targetSection.classList.add('active');
    
    // Load Data specific to section
    if (sectionId === 'users') loadUsers();
    if (sectionId === 'posts') loadPosts();
    if (sectionId === 's3') loadS3Files();
    if (sectionId === 'system') loadLogs();
}

// --- System Monitor & AWS Health ---
async function loadStats() {
    try {
        const res = await authFetch('/api/admin/stats');
        if (res.ok) {
            const data = await res.json();
            
            // Basic Stats - 巨大化显示
            updateText('statTotalUsers', data.userCount || data.totalUsers || '0');
            updateText('statTotalPosts', data.postCount || data.totalPosts || '0');
            
            // CPU Load - 直接使用后端返回的格式化字符串
            const cpuLoad = data.cpuLoad || '0.0%';
            updateText('statCpu', cpuLoad);
            
            // 提取百分比数值用于进度条
            const cpuPercent = parseFloat(cpuLoad.replace('%', ''));
            const cpuBar = document.getElementById('cpuBar');
            if (cpuBar) {
                cpuBar.style.width = cpuPercent + '%';
            }
            
            // Memory - 格式化显示
            const memUsed = data.jvmMemory ? (data.jvmMemory / (1024 * 1024)).toFixed(0) : '0';
            updateText('statMemory', memUsed);

            // AWS Metadata
            if (data.awsMetadata) {
                updateText('awsInstanceId', data.awsMetadata.instanceId || 'N/A (Local)');
                updateText('awsRegion', data.awsMetadata.region || 'us-east-1');
                updateText('awsZone', data.awsMetadata.availabilityZone || 'us-east-1a');
                
                // Update Modal Data
                updateText('modalInstanceId', data.awsMetadata.instanceId || 'N/A');
                updateText('modalRegion', data.awsMetadata.region || 'us-east-1');
                updateText('modalZone', data.awsMetadata.availabilityZone || 'us-east-1a');
            }

            // DB Stats
            const dbConns = data.dbConnections || '5';
            updateText('dbConnections', dbConns);
            updateText('modalDbConnections', dbConns);
            
            // AI Status
            const aiStatus = document.getElementById('aiStatus');
            const aiStatusText = data.aiStatus || 'OFFLINE';
            updateText('modalAiStatus', aiStatusText);
            
            if (aiStatusText === 'ONLINE') {
                aiStatus.innerHTML = '<i class="fas fa-check-circle"></i> Online';
                aiStatus.style.color = '#00FF00';
            } else {
                aiStatus.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Offline';
                aiStatus.style.color = '#FF0000';
            }
            
            // 添加闪烁效果到更新的数值
            flashElement('statTotalUsers');
            flashElement('statTotalPosts');
            flashElement('statCpu');
            flashElement('statMemory');
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// 添加闪烁效果函数
function flashElement(id) {
    const el = document.getElementById(id);
    if (el) {
        el.style.textShadow = '0 0 50px #00FF00, 0 0 100px #00FF00';
        setTimeout(() => {
            el.style.textShadow = '0 0 30px #00FF00, 0 0 60px #00FF00';
        }, 200);
    }
}

function updateText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

// --- Modals ---
function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('active');
    }
}

// --- User Management ---
async function loadUsers() {
    try {
        const res = await authFetch('/api/admin/users');
        if (res.ok) {
            const users = await res.json();
            const tbody = document.getElementById('usersTableBody');
            if (!tbody) return;
            
            tbody.innerHTML = users.map(user => `
                <tr>
                    <td>#${user.id}</td>
                    <td>
                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                            <div style="width: 32px; height: 32px; background: #e0e7ff; color: #4f46e5; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">
                                ${user.username.charAt(0).toUpperCase()}
                            </div>
                            <span style="font-weight: 500;">${user.username}</span>
                        </div>
                    </td>
                    <td style="color: #6b7280;">${user.email}</td>
                    <td>
                        <span style="padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; background: ${user.role === 'ADMIN' ? '#fee2e2; color: #991b1b;' : '#d1fae5; color: #065f46;'}">
                            ${user.role}
                        </span>
                    </td>
                    <td style="color: #6b7280;">${new Date(user.createdAt).toLocaleDateString()}</td>
                    <td>
                        <div style="display: flex; gap: 0.5rem;">
                            ${user.role !== 'ADMIN' ? `
                                <button onclick="promoteUser(${user.id})" class="btn btn-primary" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;">
                                    <i class="fas fa-crown"></i> Promote
                                </button>
                            ` : ''}
                            <button onclick="deleteUser(${user.id})" class="btn btn-danger" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" ${user.role === 'ADMIN' ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''}>
                                <i class="fas fa-trash"></i> Terminate
                            </button>
                        </div>
                    </td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

async function promoteUser(id) {
    if (!confirm('Promote this user to ADMIN? They will have full system access.')) return;
    try {
        const res = await authFetch(`/api/admin/users/${id}/promote`, { method: 'POST' });
        if (res.ok) {
            alert('User promoted successfully!');
            loadUsers();
        } else {
            alert('Failed to promote user.');
        }
    } catch (error) {
        console.error(error);
    }
}

async function deleteUser(id) {
    if (!confirm('TERMINATE USER? This action is irreversible.')) return;
    try {
        const res = await authFetch(`/api/admin/users/${id}`, { method: 'DELETE' });
        if (res.ok) {
            alert('User terminated.');
            loadUsers();
            loadStats();
        } else {
            alert('Failed to terminate user.');
        }
    } catch (error) {
        console.error(error);
    }
}

// --- Global Posts ---
async function loadPosts() {
    try {
        const res = await authFetch('/api/posts'); 
        if (res.ok) {
            const data = await res.json();
            // Handle paginated response structure { posts: [], currentPage: 0, ... }
            const postsArray = Array.isArray(data) ? data : (data.posts || []);
            
            const tbody = document.getElementById('postsTableBody');
            if (!tbody) return;

            if (postsArray.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem; color: #6b7280;">No posts found</td></tr>';
                return;
            }

            tbody.innerHTML = postsArray.map(post => `
                <tr>
                    <td>#${post.id}</td>
                    <td>
                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                            <div style="width: 32px; height: 32px; background: #e0e7ff; color: #4f46e5; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">
                                ${post.user && post.user.username ? post.user.username.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <span style="font-weight: 500;">${post.user ? post.user.username : 'Unknown'}</span>
                        </div>
                    </td>
                    <td>${post.content ? (post.content.substring(0, 50) + (post.content.length > 50 ? '...' : '')) : ''}</td>
                    <td>
                        ${post.imageUrl ? 
                            `<a href="${post.imageUrl}" target="_blank" style="color: #3b82f6; display: flex; align-items: center; gap: 0.5rem;">
                                <i class="fas fa-image"></i> View
                             </a>` : 
                            '<span style="color: #9ca3af;">-</span>'}
                    </td>
                    <td style="color: #6b7280;">${new Date(post.createdAt).toLocaleDateString()}</td>
                    <td>
                        <button onclick="deletePost(${post.id})" class="btn btn-danger" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error(error);
    }
}

async function deletePost(id) {
    if (!confirm('NUKE POST? This will delete the DB record and S3 image.')) return;
    try {
        const res = await authFetch(`/api/posts/${id}`, { method: 'DELETE' });
        if (res.ok) {
            alert('Post nuked.');
            loadPosts();
            loadStats();
        }
    } catch (error) {
        console.error(error);
    }
}

// --- S3 Management ---
async function loadS3Files() {
    try {
        const res = await authFetch('/api/admin/s3/files');
        if (res.ok) {
            const files = await res.json();
            const tbody = document.getElementById('s3TableBody');
            if (!tbody) return;

            if (files.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem; color: #6b7280;">No files found in S3 bucket</td></tr>';
                return;
            }

            tbody.innerHTML = files.map(file => {
                // Real data from API
                const sizeBytes = file.size || 0;
                const sizeMB = (sizeBytes / (1024 * 1024)).toFixed(1);
                const sizeDisplay = sizeMB + ' MB';
                
                const type = file.key.split('.').pop().toUpperCase();
                const date = file.lastModified ? new Date(file.lastModified).toLocaleString() : 'N/A';
                
                return `
                <tr>
                    <td>
                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                            <div style="width: 32px; height: 32px; background: #f3f4f6; color: #4b5563; border-radius: 6px; display: flex; align-items: center; justify-content: center;">
                                <i class="fas fa-file-${['JPG','PNG','GIF'].includes(type) ? 'image' : 'alt'}"></i>
                            </div>
                            <span style="font-weight: 500; max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${file.key}">${file.key}</span>
                        </div>
                    </td>
                    <td style="color: #6b7280;">${sizeDisplay}</td>
                    <td><span class="badge badge-warning">${type}</span></td>
                    <td style="color: #6b7280;">${date}</td>
                    <td>
                        <div style="display: flex; gap: 0.5rem;">
                            <a href="${file.url}" target="_blank" class="btn btn-primary" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; text-decoration: none;">
                                <i class="fas fa-download"></i> Download
                            </a>
                            <button onclick="deleteS3File('${file.key}')" class="btn btn-danger" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    </td>
                </tr>
            `}).join('');
        }
    } catch (error) {
        console.error('Error loading S3 files:', error);
    }
}

// --- System Logs ---
function loadLogs() {
    const tbody = document.getElementById('logsTableBody');
    if (!tbody) return;

    // Mock Logs
    const components = ['AuthService', 'PostController', 'S3Service', 'Database', 'AIWorker'];
    const levels = ['INFO', 'INFO', 'INFO', 'WARN', 'ERROR'];
    const messages = [
        'User authentication successful',
        'New post created',
        'S3 object uploaded successfully',
        'Connection pool usage high',
        'Failed to process image thumbnail'
    ];

    const logs = Array.from({ length: 10 }, (_, i) => {
        const level = levels[Math.floor(Math.random() * levels.length)];
        return {
            timestamp: new Date(Date.now() - i * 50000).toISOString().replace('T', ' ').substring(0, 19),
            level: level,
            component: components[Math.floor(Math.random() * components.length)],
            message: messages[Math.floor(Math.random() * messages.length)]
        };
    });

    tbody.innerHTML = logs.map(log => `
        <tr>
            <td style="font-family: monospace; color: #6b7280;">${log.timestamp}</td>
            <td>
                <span class="badge ${log.level === 'INFO' ? 'badge-success' : log.level === 'WARN' ? 'badge-warning' : 'badge-danger'}">
                    ${log.level}
                </span>
            </td>
            <td style="font-weight: 500;">${log.component}</td>
            <td style="color: #374151;">${log.message}</td>
        </tr>
    `).join('');
}

function getFilePreview(key, url) {
    const ext = key.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
        return `<img src="${url}" alt="${key}">`;
    } else {
        return `<i class="fas fa-file fa-2x" style="color: #9ca3af;"></i>`;
    }
}

async function deleteS3File(key) {
    if (!confirm(`Delete file "${key}" from S3?`)) return;
    try {
        const res = await authFetch(`/api/admin/s3/files?key=${encodeURIComponent(key)}`, { method: 'DELETE' });
        if (res.ok) {
            loadS3Files();
        }
    } catch (error) {
        console.error(error);
    }
}

async function syncS3() {
    const btn = document.querySelector('button[onclick="syncS3()"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Checking...';
    btn.disabled = true;

    try {
        const res = await authFetch('/api/admin/s3/sync');
        if (res.ok) {
            const report = await res.json();
            
            document.getElementById('consistencyReport').style.display = 'block';
            document.getElementById('reportS3').textContent = report.s3Count;
            document.getElementById('reportDb').textContent = report.dbCount;
            document.getElementById('reportOrphans').textContent = report.orphans.length;
            
            if (report.orphans.length > 0) {
                document.getElementById('cleanupBtn').style.display = 'inline-block';
                document.getElementById('cleanupBtn').onclick = () => cleanupOrphans(report.orphans);
            } else {
                document.getElementById('cleanupBtn').style.display = 'none';
            }
        }
    } catch (error) {
        console.error(error);
        alert('Sync check failed');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

async function cleanupOrphans(orphans) {
    if (!orphans) return; 
    if (!confirm(`Delete ${orphans.length} orphan files from S3? This will free up storage.`)) return;
    
    let successCount = 0;
    for (const key of orphans) {
        try {
            await authFetch(`/api/admin/s3/files?key=${encodeURIComponent(key)}`, { method: 'DELETE' });
            successCount++;
        } catch (e) {
            console.error(e);
        }
    }
    
    alert(`Cleaned up ${successCount} files.`);
    syncS3(); // Refresh report
    loadS3Files(); // Refresh grid
}

// --- System Controls ---
async function forceGc() {
    if (!confirm('Force JVM Garbage Collection? This may cause a momentary pause.')) return;
    try {
        const res = await authFetch('/api/admin/maintenance/gc', { method: 'POST' });
        if (res.ok) {
            const data = await res.json();
            alert(`GC Executed. Memory freed: ${data.freed} MB`);
            loadStats();
        }
    } catch (error) {
        console.error(error);
    }
}

function toggleMaintenance() {
    alert('Maintenance Mode toggled (Simulation). In a real app, this would block non-admin access.');
}
