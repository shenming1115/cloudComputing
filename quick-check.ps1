$baseUrl = 'http://localhost:8080'

Write-Host ''
Write-Host '========================================' -ForegroundColor Cyan
Write-Host '  快速功能检查' -ForegroundColor Cyan
Write-Host '========================================' -ForegroundColor Cyan
Write-Host ''

Write-Host '正在登录管理员账号...' -ForegroundColor Yellow

$adminLogin = @{
    username = 'admin123'
    password = 'Admin123456!'
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/users/login" -Method POST -Body $adminLogin -ContentType 'application/json'
    $token = $loginResponse.token
    $headers = @{ 'Authorization' = "Bearer $token" }
    Write-Host '✓ 管理员登录成功' -ForegroundColor Green
    Write-Host ''
    
    Write-Host '检查用户管理功能...' -ForegroundColor Yellow
    $users = Invoke-RestMethod -Uri "$baseUrl/api/admin/users" -Method GET -Headers $headers
    Write-Host "✓ 用户列表: 找到 $($users.Count) 个用户" -ForegroundColor Green
    $users | ForEach-Object { Write-Host "  - $($_.username) ($($_.role))" -ForegroundColor Gray }
    
    Write-Host ''
    Write-Host '检查帖子管理功能...' -ForegroundColor Yellow
    $posts = Invoke-RestMethod -Uri "$baseUrl/api/admin/posts" -Method GET -Headers $headers
    Write-Host "✓ 帖子列表: 找到 $($posts.Count) 个帖子" -ForegroundColor Green
    
    Write-Host ''
    Write-Host '检查评论管理功能...' -ForegroundColor Yellow
    $comments = Invoke-RestMethod -Uri "$baseUrl/api/admin/comments" -Method GET -Headers $headers
    Write-Host "✓ 评论列表: 找到 $($comments.Count) 个评论" -ForegroundColor Green
    
    Write-Host ''
    Write-Host '检查系统统计...' -ForegroundColor Yellow
    $stats = Invoke-RestMethod -Uri "$baseUrl/api/admin/stats" -Method GET -Headers $headers
    Write-Host '✓ 系统统计:' -ForegroundColor Green
    Write-Host "  - 总用户数: $($stats.totalUsers)" -ForegroundColor Gray
    Write-Host "  - 总帖子数: $($stats.totalPosts)" -ForegroundColor Gray
    Write-Host "  - 总评论数: $($stats.totalComments)" -ForegroundColor Gray
    
    Write-Host ''
    Write-Host '检查S3存储...' -ForegroundColor Yellow
    $s3Files = Invoke-RestMethod -Uri "$baseUrl/api/admin/s3/files" -Method GET -Headers $headers
    Write-Host "✓ S3文件: 找到 $($s3Files.Count) 个文件" -ForegroundColor Green
}
catch {
    Write-Host "✗ 错误: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ''
Write-Host '========================================' -ForegroundColor Cyan
Write-Host ''
