$ErrorActionPreference = 'Stop'
$baseUrl = 'http://localhost:8080'

Write-Host ''
Write-Host '========================================'
Write-Host '  Admin Function Test'
Write-Host '========================================'
Write-Host ''

# Test health check
Write-Host '1. Health Check...'
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/health" -Method GET
    Write-Host '   OK - Application is running' -ForegroundColor Green
}
catch {
    Write-Host '   ERROR - Application not running' -ForegroundColor Red
    Write-Host '   Please run: .\start-app.ps1' -ForegroundColor Yellow
    exit
}

# Admin login
Write-Host ''
Write-Host '2. Admin Login...'
$adminData = @{
    username = 'admin123'
    password = 'pxTUxZPBBmgk3XD'
}

try {
    $loginJson = $adminData | ConvertTo-Json
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/users/login" -Method POST -Body $loginJson -ContentType 'application/json'
    $token = $loginResponse.token
    Write-Host '   OK - Login successful' -ForegroundColor Green
}
catch {
    Write-Host '   ERROR - Login failed' -ForegroundColor Red
    exit
}

$headers = @{ 'Authorization' = "Bearer $token" }

# Get users
Write-Host ''
Write-Host '3. Get Users...'
try {
    $users = Invoke-RestMethod -Uri "$baseUrl/api/admin/users" -Method GET -Headers $headers
    Write-Host "   OK - Found $($users.Count) users" -ForegroundColor Green
    foreach ($user in $users) {
        Write-Host "   - $($user.username) [$($user.role)]" -ForegroundColor Gray
    }
}
catch {
    Write-Host '   ERROR - Failed to get users' -ForegroundColor Red
}

# Get posts
Write-Host ''
Write-Host '4. Get Posts...'
try {
    $posts = Invoke-RestMethod -Uri "$baseUrl/api/admin/posts" -Method GET -Headers $headers
    Write-Host "   OK - Found $($posts.Count) posts" -ForegroundColor Green
}
catch {
    Write-Host '   ERROR - Failed to get posts' -ForegroundColor Red
}

# Get comments
Write-Host ''
Write-Host '5. Get Comments...'
try {
    $comments = Invoke-RestMethod -Uri "$baseUrl/api/admin/comments" -Method GET -Headers $headers
    Write-Host "   OK - Found $($comments.Count) comments" -ForegroundColor Green
}
catch {
    Write-Host '   ERROR - Failed to get comments' -ForegroundColor Red
}

# Get stats
Write-Host ''
Write-Host '6. Get System Stats...'
try {
    $stats = Invoke-RestMethod -Uri "$baseUrl/api/admin/stats" -Method GET -Headers $headers
    Write-Host '   OK - System Stats:' -ForegroundColor Green
    Write-Host "   - Users: $($stats.totalUsers)" -ForegroundColor Gray
    Write-Host "   - Posts: $($stats.totalPosts)" -ForegroundColor Gray
    Write-Host "   - Comments: $($stats.totalComments)" -ForegroundColor Gray
    $cpuPercent = [math]::Round($stats.systemCpu * 100, 2)
    Write-Host "   - CPU: $cpuPercent%" -ForegroundColor Gray
    $memoryMB = [math]::Round($stats.jvmMemory / 1MB, 2)
    Write-Host "   - Memory: $memoryMB MB" -ForegroundColor Gray
}
catch {
    Write-Host '   ERROR - Failed to get stats' -ForegroundColor Red
}

# Get S3 files
Write-Host ''
Write-Host '7. Get S3 Files...'
try {
    $s3Files = Invoke-RestMethod -Uri "$baseUrl/api/admin/s3/files" -Method GET -Headers $headers
    Write-Host "   OK - Found $($s3Files.Count) S3 files" -ForegroundColor Green
}
catch {
    Write-Host '   ERROR - Failed to get S3 files' -ForegroundColor Red
}

Write-Host ''
Write-Host '========================================'
Write-Host '  Test Complete'
Write-Host '========================================'
Write-Host ''
