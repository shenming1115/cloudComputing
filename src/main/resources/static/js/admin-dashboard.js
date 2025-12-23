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
    // Reuse the public API for now, but in a real app we'd want an admin-specific endpoint
    // that returns ALL posts regardless of visibility.
    // For this demo, we'll assume the public feed is sufficient or add an admin endpoint later.
    try {
        const res = await authFetch('/api/posts'); 
        if (res.ok) {
            const posts = await res.json();
            const tbody = document.getElementById('postsTableBody');
            if (!tbody) return;

            tbody.innerHTML = posts.map(post => `
                <tr>
                    <td>#${post.id}</td>
                    <td>${post.authorName}</td>
                    <td>${post.content.substring(0, 50)}...</td>
                    <td>${post.imageUrl ? '<i class="fas fa-image text-blue-500"></i>' : '<span class="text-gray-400">-</span>'}</td>
                    <td>${new Date(post.createdAt).toLocaleDateString()}</td>
                    <td>
                        <button onclick="deletePost(${post.id})" class="btn btn-danger" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;">
                            <i class="fas fa-bomb"></i> Nuke
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
            const grid = document.getElementById('s3Grid');
            if (!grid) return;

            if (files.length === 0) {
                grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #6b7280; padding: 2rem;">No files found in S3 bucket</div>';
                return;
            }

            grid.innerHTML = files.map(file => `
                <div class="s3-item">
                    <div class="s3-preview">
                        ${getFilePreview(file.key, file.url)}
                    </div>
                    <div class="s3-info">
                        <div style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 500;" title="${file.key}">${file.key}</div>
                        <div style="display: flex; justify-content: space-between; margin-top: 0.5rem;">
                            <a href="${file.url}" target="_blank" style="color: #3b82f6;"><i class="fas fa-download"></i></a>
                            <button onclick="deleteS3File('${file.key}')" style="color: #ef4444; background: none; border: none; cursor: pointer;"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading S3 files:', error);
    }
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
