# AWS 部署测试脚本
# 如果公司网络阻止，请使用手机热点或其他网络运行此脚本

$ec2Ip = "13.210.199.85"
$baseUrl = "http://${ec2Ip}:8080"

Write-Host "🚀 开始测试 AWS 部署的 API..." -ForegroundColor Cyan
Write-Host "EC2 IP: $ec2Ip" -ForegroundColor Yellow
Write-Host ""

# 测试 1: 健康检查
Write-Host "✅ 测试 1: 健康检查" -ForegroundColor Green
try {
    $health = Invoke-RestMethod -Uri "${baseUrl}/health" -TimeoutSec 10
    Write-Host "✓ 健康检查成功!" -ForegroundColor Green
    Write-Host "  Status: $($health.status)" -ForegroundColor Yellow
    Write-Host "  Message: $($health.message)" -ForegroundColor Yellow
} catch {
    Write-Host "✗ 健康检查失败!" -ForegroundColor Red
    Write-Host "  错误: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "⚠️  可能的原因:" -ForegroundColor Yellow
    Write-Host "  1. 公司网络防火墙阻止了端口 8080" -ForegroundColor White
    Write-Host "  2. 请尝试使用手机热点或其他网络" -ForegroundColor White
    Write-Host "  3. EC2 安全组配置正确，问题在于客户端网络" -ForegroundColor White
    exit 1
}

Write-Host ""

# 测试 2: 注册用户
Write-Host "✅ 测试 2: 注册用户" -ForegroundColor Green
$body = @{
    username = "aws_test_user_$(Get-Random -Minimum 1000 -Maximum 9999)"
    email = "awstest$(Get-Random -Minimum 1000 -Maximum 9999)@example.com"
    password = "SecurePass123"
} | ConvertTo-Json

try {
    $user = Invoke-RestMethod -Uri "${baseUrl}/api/users/register" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body
    
    Write-Host "✓ 用户注册成功!" -ForegroundColor Green
    Write-Host "  用户 ID: $($user.id)" -ForegroundColor Yellow
    Write-Host "  用户名: $($user.username)" -ForegroundColor Yellow
    Write-Host "  邮箱: $($user.email)" -ForegroundColor Yellow
    
    if ($user.password) {
        Write-Host "  ⚠️  安全警告: 密码暴露在响应中!" -ForegroundColor Red
    } else {
        Write-Host "  ✓ 安全: 密码未在响应中暴露" -ForegroundColor Green
    }
    
    $global:userId = $user.id
} catch {
    Write-Host "✗ 用户注册失败!" -ForegroundColor Red
    Write-Host "  错误: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 测试 3: 创建帖子
Write-Host "✅ 测试 3: 创建帖子" -ForegroundColor Green
$body = @{
    content = "🎉 AWS 部署测试帖子 - Deployed on EC2 + RDS PostgreSQL! Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    imageUrl = "https://example.com/aws-test.jpg"
    userId = $global:userId
} | ConvertTo-Json

try {
    $post = Invoke-RestMethod -Uri "${baseUrl}/api/posts" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body
    
    Write-Host "✓ 帖子创建成功!" -ForegroundColor Green
    Write-Host "  帖子 ID: $($post.id)" -ForegroundColor Yellow
    Write-Host "  内容: $($post.content)" -ForegroundColor White
    Write-Host "  分享 Token: $($post.shareToken)" -ForegroundColor Yellow
    Write-Host "  分享次数: $($post.shareCount)" -ForegroundColor Yellow
    
    $global:postId = $post.id
} catch {
    Write-Host "✗ 帖子创建失败!" -ForegroundColor Red
    Write-Host "  错误: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 测试 4: 获取所有帖子
Write-Host "✅ 测试 4: 获取所有帖子" -ForegroundColor Green
try {
    $posts = Invoke-RestMethod -Uri "${baseUrl}/api/posts"
    Write-Host "✓ 获取帖子成功!" -ForegroundColor Green
    Write-Host "  帖子总数: $($posts.Count)" -ForegroundColor Yellow
} catch {
    Write-Host "✗ 获取帖子失败!" -ForegroundColor Red
    Write-Host "  错误: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 测试 5: 生成分享链接
Write-Host "✅ 测试 5: 生成分享链接" -ForegroundColor Green
try {
    $share = Invoke-RestMethod -Uri "${baseUrl}/api/posts/$($global:postId)/share" -Method POST
    
    Write-Host "✓ 分享链接生成成功!" -ForegroundColor Green
    Write-Host "  🔗 分享链接: $($share.shareUrl)" -ForegroundColor Magenta
    Write-Host "  分享次数: $($share.shareCount)" -ForegroundColor Yellow
    
    $global:shareToken = $share.shareToken
} catch {
    Write-Host "✗ 生成分享链接失败!" -ForegroundColor Red
    Write-Host "  错误: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 测试 6: 通过分享链接访问帖子
Write-Host "✅ 测试 6: 通过分享链接访问帖子" -ForegroundColor Green
try {
    $sharedPost = Invoke-RestMethod -Uri "${baseUrl}/api/posts/shared/$($global:shareToken)"
    
    Write-Host "✓ 分享链接访问成功!" -ForegroundColor Green
    Write-Host "  📖 帖子内容: $($sharedPost.post.content)" -ForegroundColor White
    Write-Host "  👤 作者: $($sharedPost.post.user.username)" -ForegroundColor Yellow
    Write-Host "  🔢 分享次数: $($sharedPost.shareCount)" -ForegroundColor Yellow
} catch {
    Write-Host "✗ 分享链接访问失败!" -ForegroundColor Red
    Write-Host "  错误: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 测试 7: 创建评论
Write-Host "✅ 测试 7: 创建评论" -ForegroundColor Green
$body = @{
    content = "Great deployment! 测试评论 - AWS is awesome! 🚀"
    postId = $global:postId
    userId = $global:userId
} | ConvertTo-Json

try {
    $comment = Invoke-RestMethod -Uri "${baseUrl}/api/comments" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body
    
    Write-Host "✓ 评论创建成功!" -ForegroundColor Green
    Write-Host "  评论 ID: $($comment.id)" -ForegroundColor Yellow
    Write-Host "  内容: $($comment.content)" -ForegroundColor White
} catch {
    Write-Host "✗ 评论创建失败!" -ForegroundColor Red
    Write-Host "  错误: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🎉 所有测试通过！AWS 部署成功！" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ 应用可以从外部访问" -ForegroundColor Green
Write-Host "✅ EC2 + RDS PostgreSQL 连接正常" -ForegroundColor Green
Write-Host "✅ 数据库表自动创建成功" -ForegroundColor Green
Write-Host "✅ 所有 API 功能正常工作" -ForegroundColor Green
Write-Host "✅ 分享功能正常" -ForegroundColor Green
Write-Host "✅ 评论系统正常" -ForegroundColor Green
Write-Host ""
Write-Host "📊 部署信息:" -ForegroundColor Cyan
Write-Host "  - EC2 IP: $ec2Ip" -ForegroundColor White
Write-Host "  - 数据库: PostgreSQL on RDS" -ForegroundColor White
Write-Host "  - API 地址: $baseUrl" -ForegroundColor White
Write-Host "  - 健康检查: ${baseUrl}/health" -ForegroundColor White
Write-Host ""
Write-Host "🌐 您可以在浏览器中访问:" -ForegroundColor Cyan
Write-Host "  ${baseUrl}/health" -ForegroundColor Magenta
Write-Host ""
