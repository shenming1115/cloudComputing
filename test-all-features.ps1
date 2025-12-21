# Social Forum 完整功能测试脚本
# 测试所有API端点并验证功能

param(
    [string]$BaseUrl = "http://localhost:8080"
)

$ErrorActionPreference = "Continue"
$SuccessCount = 0
$FailureCount = 0

# 颜色输出函数
function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
    $script:SuccessCount++
}

function Write-Failure {
    param([string]$Message, [string]$Details = "")
    Write-Host "✗ $Message" -ForegroundColor Red
    if ($Details) {
        Write-Host "  详情: $Details" -ForegroundColor Yellow
    }
    $script:FailureCount++
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ $Message" -ForegroundColor Cyan
}

function Write-TestHeader {
    param([string]$Message)
    Write-Host "`n========================================" -ForegroundColor Magenta
    Write-Host " $Message" -ForegroundColor Magenta
    Write-Host "========================================" -ForegroundColor Magenta
}

# API调用函数
function Invoke-ApiTest {
    param(
        [string]$Method,
        [string]$Endpoint,
        [hashtable]$Body = $null,
        [string]$Description
    )
    
    try {
        $params = @{
            Uri = "$BaseUrl$Endpoint"
            Method = $Method
            ContentType = "application/json"
            TimeoutSec = 30
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json -Depth 10)
        }
        
        $response = Invoke-RestMethod @params
        Write-Success "$Description"
        return $response
    }
    catch {
        $errorMessage = $_.Exception.Message
        if ($_.Exception.Response) {
            try {
                $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
                $errorBody = $reader.ReadToEnd()
                $errorMessage = "$errorMessage - $errorBody"
            } catch {}
        }
        Write-Failure "$Description" $errorMessage
        return $null
    }
}

# 开始测试
Write-Host "`n╔═══════════════════════════════════════════════════════╗" -ForegroundColor Blue
Write-Host "║     Social Forum 完整功能测试                         ║" -ForegroundColor Blue
Write-Host "║     测试服务器: $BaseUrl" + (" " * (40 - $BaseUrl.Length)) + "║" -ForegroundColor Blue
Write-Host "╚═══════════════════════════════════════════════════════╝" -ForegroundColor Blue

# 测试1: 健康检查
Write-TestHeader "1. 健康检查"
$health = Invoke-ApiTest -Method GET -Endpoint "/actuator/health" -Description "应用健康检查"

if ($health -and $health.status -eq "UP") {
    Write-Success "应用状态: UP"
} else {
    Write-Failure "应用未正常运行"
    Write-Host "`n⚠️  请先启动应用: java -jar target/social-forum.jar --spring.profiles.active=local" -ForegroundColor Yellow
    exit 1
}

# 生成测试数据
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$testUsername = "testuser_$timestamp"
$testEmail = "test_${timestamp}@example.com"
$testPassword = "Test@123456"

Write-Info "测试用户名: $testUsername"
Write-Info "测试邮箱: $testEmail"

# 测试2: 用户注册
Write-TestHeader "2. 用户注册功能"
$registerBody = @{
    username = $testUsername
    email = $testEmail
    password = $testPassword
}

$registeredUser = Invoke-ApiTest -Method POST -Endpoint "/api/users/register" -Body $registerBody -Description "注册新用户"

if ($registeredUser) {
    Write-Info "  用户ID: $($registeredUser.id)"
    $userId = $registeredUser.id
}

# 测试3: 用户登录
Write-TestHeader "3. 用户登录功能"
$loginBody = @{
    username = $testUsername
    password = $testPassword
}

$loggedInUser = Invoke-ApiTest -Method POST -Endpoint "/api/users/login" -Body $loginBody -Description "用户登录"

if ($loggedInUser) {
    Write-Info "  登录成功: $($loggedInUser.username)"
    $userId = $loggedInUser.id
}

# 测试4: 获取用户信息
Write-TestHeader "4. 获取用户信息"
if ($userId) {
    $userInfo = Invoke-ApiTest -Method GET -Endpoint "/api/users/$userId" -Description "获取用户详情"
    if ($userInfo) {
        Write-Info "  用户名: $($userInfo.username)"
        Write-Info "  邮箱: $($userInfo.email)"
    }
}

# 测试5: 创建帖子
Write-TestHeader "5. 创建帖子功能"
$postContent = "测试帖子 - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')`n这是自动化测试创建的帖子。`n#测试 #自动化"

$createPostBody = @{
    content = $postContent
    userId = $userId
    mediaType = "text"
}

$createdPost = Invoke-ApiTest -Method POST -Endpoint "/api/posts" -Body $createPostBody -Description "创建文字帖子"

if ($createdPost) {
    Write-Info "  帖子ID: $($createdPost.id)"
    $postId = $createdPost.id
}

# 测试6: 获取所有帖子
Write-TestHeader "6. 获取帖子列表"
$allPosts = Invoke-ApiTest -Method GET -Endpoint "/api/posts" -Description "获取所有帖子"

if ($allPosts) {
    Write-Info "  总帖子数: $($allPosts.Count)"
}

# 测试7: 分页获取帖子
Write-TestHeader "7. 分页获取帖子"
$paginatedPosts = Invoke-ApiTest -Method GET -Endpoint "/api/posts?page=0&size=5&paginated=true" -Description "分页获取(第1页, 5条/页)"

if ($paginatedPosts) {
    Write-Info "  总记录数: $($paginatedPosts.totalElements)"
    Write-Info "  本页记录: $($paginatedPosts.posts.Count)"
}

# 测试8: 获取帖子详情
Write-TestHeader "8. 获取帖子详情"
if ($postId) {
    $postDetail = Invoke-ApiTest -Method GET -Endpoint "/api/posts/$postId" -Description "获取帖子详情"
    if ($postDetail) {
        Write-Info "  作者: $($postDetail.user.username)"
    }
}

# 测试9: 添加评论
Write-TestHeader "9. 评论功能"
if ($postId) {
    $commentBody = @{
        postId = $postId
        userId = $userId
        content = "测试评论 - $(Get-Date -Format 'HH:mm:ss')"
    }
    
    $createdComment = Invoke-ApiTest -Method POST -Endpoint "/api/comments" -Body $commentBody -Description "添加评论"
    
    if ($createdComment) {
        Write-Info "  评论ID: $($createdComment.id)"
        $commentId = $createdComment.id
    }
    
    $postComments = Invoke-ApiTest -Method GET -Endpoint "/api/comments/post/$postId" -Description "获取帖子评论"
    if ($postComments) {
        Write-Info "  评论数: $($postComments.Count)"
    }
}

# 测试10: 点赞功能
Write-TestHeader "10. 点赞功能"
if ($postId) {
    $like1 = Invoke-ApiTest -Method POST -Endpoint "/api/posts/$postId/likes?userId=$userId" -Description "点赞帖子"
    
    $likeStatus = Invoke-ApiTest -Method GET -Endpoint "/api/posts/$postId/likes/status?userId=$userId" -Description "检查点赞状态"
    if ($likeStatus) {
        Write-Info "  已点赞: $($likeStatus.liked)"
        Write-Info "  点赞数: $($likeStatus.likeCount)"
    }
    
    $like2 = Invoke-ApiTest -Method POST -Endpoint "/api/posts/$postId/likes?userId=$userId" -Description "取消点赞"
    
    $likeStatus2 = Invoke-ApiTest -Method GET -Endpoint "/api/posts/$postId/likes/status?userId=$userId" -Description "再次检查状态"
    if ($likeStatus2) {
        Write-Info "  已点赞: $($likeStatus2.liked)"
        Write-Info "  点赞数: $($likeStatus2.likeCount)"
    }
}

# 测试11: 分享功能
Write-TestHeader "11. 分享功能"
if ($postId) {
    try {
        $shareResponse = Invoke-RestMethod -Uri "$BaseUrl/api/posts/$postId/share" -Method POST -ContentType "application/json"
        Write-Success "生成分享链接"
        Write-Info "  分享URL: $($shareResponse.shareUrl)"
        
        $sharedPost = Invoke-ApiTest -Method GET -Endpoint "/api/posts/share/$($shareResponse.shareToken)" -Description "访问分享链接"
    }
    catch {
        Write-Failure "生成分享链接" $_.Exception.Message
    }
}

# 测试12: 搜索功能
Write-TestHeader "12. 搜索功能"
$searchResults = Invoke-ApiTest -Method GET -Endpoint "/api/posts/search?keyword=测试" -Description "搜索帖子"

if ($searchResults) {
    Write-Info "  搜索结果: $($searchResults.Count) 条"
}

# 测试13: 用户帖子列表
Write-TestHeader "13. 用户帖子列表"
if ($userId) {
    $userPosts = Invoke-ApiTest -Method GET -Endpoint "/api/posts/user/$userId" -Description "获取用户帖子"
    if ($userPosts) {
        Write-Info "  用户帖子数: $($userPosts.Count)"
    }
}

# 测试14: 更新用户信息
Write-TestHeader "14. 更新用户信息"
if ($userId) {
    $updateBody = @{
        bio = "自动化测试用户 - $(Get-Date -Format 'yyyy-MM-dd')"
    }
    
    $updatedUser = Invoke-ApiTest -Method PUT -Endpoint "/api/users/$userId" -Body $updateBody -Description "更新用户简介"
}

# 测试15: 清理测试数据
Write-TestHeader "15. 清理测试数据"
if ($commentId) {
    try {
        Invoke-RestMethod -Uri "$BaseUrl/api/comments/$commentId" -Method DELETE | Out-Null
        Write-Success "删除测试评论"
    }
    catch {
        Write-Failure "删除测试评论" $_.Exception.Message
    }
}

if ($postId) {
    try {
        Invoke-RestMethod -Uri "$BaseUrl/api/posts/$postId" -Method DELETE | Out-Null
        Write-Success "删除测试帖子"
    }
    catch {
        Write-Failure "删除测试帖子" $_.Exception.Message
    }
}

# 测试结果汇总
Write-Host "`n╔═══════════════════════════════════════════════════════╗" -ForegroundColor Blue
Write-Host "║                    测试结果汇总                        ║" -ForegroundColor Blue
Write-Host "╚═══════════════════════════════════════════════════════╝" -ForegroundColor Blue

$totalTests = $SuccessCount + $FailureCount
$successRate = if ($totalTests -gt 0) { [math]::Round(($SuccessCount / $totalTests) * 100, 2) } else { 0 }

Write-Host "`n总测试数: $totalTests" -ForegroundColor White
Write-Host "成功: $SuccessCount" -ForegroundColor Green
Write-Host "失败: $FailureCount" -ForegroundColor Red
Write-Host "成功率: $successRate%" -ForegroundColor $(if ($successRate -eq 100) { "Green" } elseif ($successRate -ge 80) { "Yellow" } else { "Red" })

if ($FailureCount -eq 0) {
    Write-Host "`n🎉 所有测试通过！应用功能正常。" -ForegroundColor Green
    exit 0
} else {
    Write-Host "`n⚠️  有 $FailureCount 个测试失败，请检查上述错误。" -ForegroundColor Yellow
    exit 1
}
