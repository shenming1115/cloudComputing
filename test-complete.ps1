# Social Forum完整功能测试脚本
param([string]$BaseUrl = "http://localhost:8080")
$SuccessCount = 0
$FailureCount = 0
function Write-Success { param([string]$M) Write-Host "OK $M" -F Green; $script:SuccessCount++ }
function Write-Failure { param([string]$M, [string]$D = "") Write-Host "X $M" -F Red; if($D){ Write-Host "  $D" -F Yellow }; $script:FailureCount++ }
function Write-Info { param([string]$M) Write-Host "i $M" -F Cyan }
function Write-TestHeader { param([string]$M) Write-Host "`n=== $M ===" -F Magenta }
function Invoke-ApiTest { param([string]$Method, [string]$Endpoint, [hashtable]$Body = $null, [string]$Description)
    try { $params = @{Uri = "$BaseUrl$Endpoint"; Method = $Method; ContentType = "application/json"; TimeoutSec = 30}
        if($Body){ $params.Body = ($Body | ConvertTo-Json -Depth 10) }
        $response = Invoke-RestMethod @params
        Write-Success "$Description"
        return $response
    } catch { Write-Failure "$Description" $_.Exception.Message; return $null }
}
Write-Host "`n========== Social Forum 功能测试 ==========" -F Blue
Write-Host "测试服务器: $BaseUrl`n" -F Blue
Write-TestHeader "1. 健康检查"
$health = Invoke-ApiTest -Method GET -Endpoint "/actuator/health" -Description "应用健康检查"
if($health -and $health.status -eq "UP"){ Write-Success "应用状态: UP" }
else{ Write-Failure "应用未运行"; Write-Host "`n请启动应用: java -jar target/social-forum.jar --spring.profiles.active=local" -F Yellow; exit 1 }
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$testUsername = "testuser_$timestamp"
$testEmail = "test_${timestamp}@example.com"
$testPassword = "Test@123456"
Write-Info "测试用户: $testUsername"
Write-TestHeader "2. 用户注册"
$registerBody = @{username = $testUsername; email = $testEmail; password = $testPassword}
$registeredUser = Invoke-ApiTest -Method POST -Endpoint "/api/users/register" -Body $registerBody -Description "注册新用户"
if($registeredUser){ Write-Info "  用户ID: $($registeredUser.id)"; $userId = $registeredUser.id }
Write-TestHeader "3. 用户登录"
$loginBody = @{username = $testUsername; password = $testPassword}
$loggedInUser = Invoke-ApiTest -Method POST -Endpoint "/api/users/login" -Body $loginBody -Description "用户登录"
if($loggedInUser){ Write-Info "  登录成功"; $userId = $loggedInUser.id }
Write-TestHeader "4. 获取用户信息"
if($userId){ $userInfo = Invoke-ApiTest -Method GET -Endpoint "/api/users/$userId" -Description "获取用户详情" }
Write-TestHeader "5. 创建帖子"
$postContent = "测试帖子 - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
$createPostBody = @{content = $postContent; userId = $userId; mediaType = "text"}
$createdPost = Invoke-ApiTest -Method POST -Endpoint "/api/posts" -Body $createPostBody -Description "创建文字帖子"
if($createdPost){ Write-Info "  帖子ID: $($createdPost.id)"; $postId = $createdPost.id }
Write-TestHeader "6. 获取帖子列表"
$allPosts = Invoke-ApiTest -Method GET -Endpoint "/api/posts" -Description "获取所有帖子"
if($allPosts){ Write-Info "  总帖子数: $($allPosts.Count)" }
Write-TestHeader "7. 分页获取"
$paginatedPosts = Invoke-ApiTest -Method GET -Endpoint "/api/posts?page=0&size=5&paginated=true" -Description "分页获取"
if($paginatedPosts){ Write-Info "  总记录: $($paginatedPosts.totalElements)" }
Write-TestHeader "8. 获取帖子详情"
if($postId){ $postDetail = Invoke-ApiTest -Method GET -Endpoint "/api/posts/$postId" -Description "获取帖子详情" }
Write-TestHeader "9. 评论功能"
if($postId){ $commentBody = @{postId = $postId; userId = $userId; content = "测试评论"}
    $createdComment = Invoke-ApiTest -Method POST -Endpoint "/api/comments" -Body $commentBody -Description "添加评论"
    if($createdComment){ $commentId = $createdComment.id }
    $postComments = Invoke-ApiTest -Method GET -Endpoint "/api/comments/post/$postId" -Description "获取评论"
    if($postComments){ Write-Info "  评论数: $($postComments.Count)" }
}
Write-TestHeader "10. 点赞功能"
if($postId){ $like1 = Invoke-ApiTest -Method POST -Endpoint "/api/posts/$postId/likes?userId=$userId" -Description "点赞"
    $likeStatus = Invoke-ApiTest -Method GET -Endpoint "/api/posts/$postId/likes/status?userId=$userId" -Description "检查状态"
    if($likeStatus){ Write-Info "  点赞数: $($likeStatus.likeCount)" }
    $like2 = Invoke-ApiTest -Method POST -Endpoint "/api/posts/$postId/likes?userId=$userId" -Description "取消点赞"
}
Write-TestHeader "11. 分享功能"
if($postId){ try{ $shareResponse = Invoke-RestMethod -Uri "$BaseUrl/api/posts/$postId/share" -Method POST
        Write-Success "生成分享链接"
        Invoke-ApiTest -Method GET -Endpoint "/api/posts/share/$($shareResponse.shareToken)" -Description "访问分享"
    } catch{ Write-Failure "分享功能" $_.Exception.Message }
}
Write-TestHeader "12. 搜索功能"
$searchResults = Invoke-ApiTest -Method GET -Endpoint "/api/posts/search?keyword=测试" -Description "搜索帖子"
if($searchResults){ Write-Info "  结果: $($searchResults.Count) 条" }
Write-TestHeader "13. 用户帖子"
if($userId){ $userPosts = Invoke-ApiTest -Method GET -Endpoint "/api/posts/user/$userId" -Description "获取用户帖子" }
Write-TestHeader "14. 更新用户"
if($userId){ $updateBody = @{bio = "测试用户"}
    Invoke-ApiTest -Method PUT -Endpoint "/api/users/$userId" -Body $updateBody -Description "更新简介"
}
Write-TestHeader "15. 清理数据"
if($commentId){ try{ Invoke-RestMethod -Uri "$BaseUrl/api/comments/$commentId" -Method DELETE | Out-Null; Write-Success "删除评论" } catch{ Write-Failure "删除评论" $_.Exception.Message } }
if($postId){ try{ Invoke-RestMethod -Uri "$BaseUrl/api/posts/$postId" -Method DELETE | Out-Null; Write-Success "删除帖子" } catch{ Write-Failure "删除帖子" $_.Exception.Message } }
Write-Host "`n========== 测试结果汇总 ==========" -F Blue
$totalTests = $SuccessCount + $FailureCount
$successRate = if($totalTests -gt 0){ [math]::Round(($SuccessCount / $totalTests) * 100, 2) } else{ 0 }
Write-Host "总测试: $totalTests" -F White
Write-Host "成功: $SuccessCount" -F Green
Write-Host "失败: $FailureCount" -F Red
Write-Host "成功率: $successRate%" -F $(if($successRate -eq 100){"Green"} elseif($successRate -ge 80){"Yellow"} else{"Red"})
if($FailureCount -eq 0){ Write-Host "`n所有测试通过!" -F Green; exit 0 }
else{ Write-Host "`n部分测试失败!" -F Yellow; exit 1 }
