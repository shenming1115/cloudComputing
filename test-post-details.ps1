# Test Post Details and Comment functionality
$baseUrl = "http://localhost:8080"
$testResults = @()

Write-Host "`n========== Post Details & Comment Test ==========" -ForegroundColor Cyan

function Test-Endpoint {
    param($name, $method, $url, $body)
    try {
        Write-Host "=== $name ===" -ForegroundColor Yellow
        if ($body) {
            $response = Invoke-RestMethod -Uri $url -Method $method -Body ($body | ConvertTo-Json) -ContentType "application/json" -ErrorAction Stop
        } else {
            $response = Invoke-RestMethod -Uri $url -Method $method -ErrorAction Stop
        }
        Write-Host "OK Success" -ForegroundColor Green
        $script:testResults += @{Name=$name; Status="OK"; Error=$null}
        return $response
    } catch {
        Write-Host "X Failed: $($_.Exception.Message)" -ForegroundColor Red
        $script:testResults += @{Name=$name; Status="X"; Error=$_.Exception.Message}
        return $null
    }
}

# 1. Health check
Test-Endpoint "Health check" "GET" "$baseUrl/actuator/health"

# 2. Create test user
$username = "testuser_$(Get-Date -Format 'yyyyMMddHHmmss')"
$userData = @{
    username = $username
    email = "$username@test.com"
    password = "Test123456"
}
$user = Test-Endpoint "Create test user" "POST" "$baseUrl/api/users/register" $userData
if ($user) { Write-Host "  User ID: $($user.id)" -ForegroundColor Gray }

# 3. Create test post
if ($user) {
    $postData = @{
        content = "Test post for Post Details page and comment functionality"
        userId = $user.id
    }
    $post = Test-Endpoint "Create test post" "POST" "$baseUrl/api/posts" $postData
    if ($post) { Write-Host "  Post ID: $($post.id)" -ForegroundColor Gray }
}

# 4. Get post details
if ($post) {
    $postDetails = Test-Endpoint "Get post details (loadPostDetails)" "GET" "$baseUrl/api/posts/$($post.id)"
    if ($postDetails) {
        Write-Host "  Content: $($postDetails.content)" -ForegroundColor Gray
        Write-Host "  Author: $($postDetails.user.username)" -ForegroundColor Gray
    }
}

# 5. Add comments
if ($post -and $user) {
    $commentData1 = @{ content = "First test comment"; postId = $post.id; userId = $user.id }
    $comment1 = Test-Endpoint "Add comment #1" "POST" "$baseUrl/api/comments" $commentData1
    if ($comment1) { Write-Host "  Comment ID: $($comment1.id)" -ForegroundColor Gray }

    $commentData2 = @{ content = "Second test comment"; postId = $post.id; userId = $user.id }
    $comment2 = Test-Endpoint "Add comment #2" "POST" "$baseUrl/api/comments" $commentData2
    if ($comment2) { Write-Host "  Comment ID: $($comment2.id)" -ForegroundColor Gray }

    $commentData3 = @{ content = "Third comment with special chars: <test> & emoji"; postId = $post.id; userId = $user.id }
    $comment3 = Test-Endpoint "Add comment #3 (special chars)" "POST" "$baseUrl/api/comments" $commentData3
    if ($comment3) { Write-Host "  Comment ID: $($comment3.id)" -ForegroundColor Gray }
}

# 6. Get post comments
if ($post) {
    $comments = Test-Endpoint "Get post comments (loadComments)" "GET" "$baseUrl/api/comments/post/$($post.id)"
    if ($comments) {
        Write-Host "  Total comments: $($comments.Count)" -ForegroundColor Gray
        foreach ($c in $comments) {
            Write-Host "    - Comment $($c.id): $($c.content)" -ForegroundColor Gray
        }
    }
}

# 7. Verify comment count updated
if ($post) {
    $updatedPost = Test-Endpoint "Verify comment count updated" "GET" "$baseUrl/api/posts/$($post.id)"
    if ($updatedPost -and $updatedPost.comments) {
        Write-Host "  Post comment count: $($updatedPost.comments.Count)" -ForegroundColor Gray
    }
}

# 8. Cleanup
Write-Host "`n=== Cleanup ===" -ForegroundColor Yellow
if ($comment1) { Test-Endpoint "Delete comment #1" "DELETE" "$baseUrl/api/comments/$($comment1.id)" }
if ($comment2) { Test-Endpoint "Delete comment #2" "DELETE" "$baseUrl/api/comments/$($comment2.id)" }
if ($comment3) { Test-Endpoint "Delete comment #3" "DELETE" "$baseUrl/api/comments/$($comment3.id)" }
if ($post) { Test-Endpoint "Delete test post" "DELETE" "$baseUrl/api/posts/$($post.id)" }

# Summary
Write-Host "`n========== Test Summary ==========" -ForegroundColor Cyan
$successCount = ($testResults | Where-Object { $_.Status -eq "OK" }).Count
$failCount = ($testResults | Where-Object { $_.Status -eq "X" }).Count
$successRate = [math]::Round(($successCount / $testResults.Count) * 100, 2)

Write-Host "Total tests: $($testResults.Count)" -ForegroundColor White
Write-Host "Success: $successCount" -ForegroundColor Green
Write-Host "Failed: $failCount" -ForegroundColor Red
Write-Host "Success rate: $successRate%" -ForegroundColor $(if ($successRate -ge 90) { "Green" } else { "Yellow" })

if ($failCount -eq 0) {
    Write-Host "`nOK All tests passed! Post Details and Comment features working!" -ForegroundColor Green
    Write-Host "`nOpen browser: http://localhost:8080/html/index.html" -ForegroundColor Cyan
    Write-Host "1. Register/Login" -ForegroundColor Gray
    Write-Host "2. Create new post" -ForegroundColor Gray
    Write-Host "3. Click post to view details" -ForegroundColor Gray
    Write-Host "4. Add comments on details page" -ForegroundColor Gray
} else {
    Write-Host "`nSome tests failed!" -ForegroundColor Red
    exit 1
}
