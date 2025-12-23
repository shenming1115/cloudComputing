# API 测试脚本
# 测试所有功能端点

$baseUrl = "http://localhost:8080"
$testUser = @{
    username = "testuser"
    email = "testuser@example.com"
    password = "Test123456!"
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Social Forum API 测试脚本" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# 测试计数器
$passed = 0
$failed = 0

function Test-Endpoint {
    param($name, $method, $url, $body, $headers)
    Write-Host "测试: $name" -ForegroundColor Yellow
    try {
        $params = @{
            Uri = $url
            Method = $method
            ContentType = "application/json"
        }
        if ($headers) { $params.Headers = $headers }
        if ($body) { $params.Body = ($body | ConvertTo-Json) }
        
        $response = Invoke-RestMethod @params
        Write-Host "  ✓ 通过" -ForegroundColor Green
        $script:passed++
        return $response
    } catch {
        Write-Host "  ✗ 失败: $($_.Exception.Message)" -ForegroundColor Red
        $script:failed++
        return $null
    }
}

# 1. 健康检查
Write-Host "`n[1] 系统健康检查" -ForegroundColor Cyan
Test-Endpoint "Health Check" "GET" "$baseUrl/health"

# 2. 用户注册
Write-Host "`n[2] 用户注册" -ForegroundColor Cyan
$registerResult = Test-Endpoint "注册新用户" "POST" "$baseUrl/api/users/register" $testUser

# 3. 用户登录
Write-Host "`n[3] 用户登录" -ForegroundColor Cyan
$loginData = @{
    username = $testUser.username
    password = $testUser.password
}
$loginResult = Test-Endpoint "用户登录" "POST" "$baseUrl/api/users/login" $loginData

if ($loginResult -and $loginResult.token) {
    $token = $loginResult.token
    $userId = $loginResult.userId
    $headers = @{ "Authorization" = "Bearer $token" }
    Write-Host "  Token: $($token.Substring(0,20))..." -ForegroundColor Gray
    
    # 4. 获取所有帖子
    Write-Host "`n[4] 获取帖子列表" -ForegroundColor Cyan
    Test-Endpoint "获取所有帖子" "GET" "$baseUrl/api/posts"
    
    # 5. 创建帖子
    Write-Host "`n[5] 创建帖子" -ForegroundColor Cyan
    $postData = @{
        content = "这是一个测试帖子 - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
        imageUrl = ""
    }
    $createPostResult = Test-Endpoint "创建新帖子" "POST" "$baseUrl/api/posts/create" $postData $headers
    
    if ($createPostResult -and $createPostResult.id) {
        $postId = $createPostResult.id
        Write-Host "  帖子ID: $postId" -ForegroundColor Gray
        
        # 6. 获取单个帖子
        Write-Host "`n[6] 获取单个帖子" -ForegroundColor Cyan
        Test-Endpoint "获取帖子详情" "GET" "$baseUrl/api/posts/$postId"
        
        # 7. 点赞帖子
        Write-Host "`n[7] 点赞功能" -ForegroundColor Cyan
        Test-Endpoint "点赞帖子" "POST" "$baseUrl/api/likes/post/$postId" $null $headers
        
        # 8. 取消点赞
        Test-Endpoint "取消点赞" "DELETE" "$baseUrl/api/likes/post/$postId" $null $headers
        
        # 9. 创建评论
        Write-Host "`n[8] 评论功能" -ForegroundColor Cyan
        $commentData = @{
            postId = $postId
            content = "这是一条测试评论"
        }
        $commentResult = Test-Endpoint "创建评论" "POST" "$baseUrl/api/comments" $commentData $headers
        
        if ($commentResult -and $commentResult.id) {
            $commentId = $commentResult.id
            
            # 10. 点赞评论
            Test-Endpoint "点赞评论" "POST" "$baseUrl/api/likes/comment/$commentId" $null $headers
            
            # 11. 删除评论
            Test-Endpoint "删除评论" "DELETE" "$baseUrl/api/comments/$commentId" $null $headers
        }
        
        # 12. 分享帖子
        Write-Host "`n[9] 分享功能" -ForegroundColor Cyan
        Test-Endpoint "分享帖子" "POST" "$baseUrl/api/posts/$postId/share" $null $headers
        
        # 13. AI 助手测试
        Write-Host "`n[10] AI 助手功能" -ForegroundColor Cyan
        $aiData = @{
            message = "你好，请简单介绍一下你自己"
        }
        $aiResult = Test-Endpoint "AI 助手对话" "POST" "$baseUrl/api/ai/chat" $aiData $headers
        
        if ($aiResult -and $aiResult.response) {
            Write-Host "  AI 回复: $($aiResult.response.Substring(0, [Math]::Min(50, $aiResult.response.Length)))..." -ForegroundColor Gray
        }
        
        # 14. 搜索功能
        Write-Host "`n[11] 搜索功能" -ForegroundColor Cyan
        Test-Endpoint "搜索帖子" "GET" "$baseUrl/api/search?query=测试"
        
        # 15. 获取用户信息
        Write-Host "`n[12] 用户信息" -ForegroundColor Cyan
        Test-Endpoint "获取用户信息" "GET" "$baseUrl/api/users/$userId" $null $headers
        
        # 16. 获取用户帖子
        Test-Endpoint "获取用户帖子" "GET" "$baseUrl/api/posts/user/$userId"
        
        # 17. 删除帖子
        Write-Host "`n[13] 删除帖子" -ForegroundColor Cyan
        Test-Endpoint "删除帖子" "DELETE" "$baseUrl/api/posts/$postId" $null $headers
    }
}

# 测试管理员功能
Write-Host "`n[14] 管理员功能测试" -ForegroundColor Cyan
$adminLogin = @{
    username = "admin123"
    password = "Admin123456!"
}
$adminResult = Test-Endpoint "管理员登录" "POST" "$baseUrl/api/users/login" $adminLogin

if ($adminResult -and $adminResult.token) {
    $adminHeaders = @{ "Authorization" = "Bearer $($adminResult.token)" }
    
    Test-Endpoint "获取所有用户" "GET" "$baseUrl/api/admin/users" $null $adminHeaders
    Test-Endpoint "获取所有帖子" "GET" "$baseUrl/api/admin/posts" $null $adminHeaders
    Test-Endpoint "获取所有评论" "GET" "$baseUrl/api/admin/comments" $null $adminHeaders
}

# 总结
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  测试完成" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "通过: $passed" -ForegroundColor Green
Write-Host "失败: $failed" -ForegroundColor Red
Write-Host "总计: $($passed + $failed)`n" -ForegroundColor Yellow

if ($failed -eq 0) {
    Write-Host "✓ 所有测试通过！" -ForegroundColor Green
} else {
    Write-Host "✗ 部分测试失败，请检查日志" -ForegroundColor Red
}
