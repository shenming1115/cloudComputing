# Comprehensive Test Script for Social Forum Application
# Tests all features including comment count synchronization

$ErrorActionPreference = "Continue"

# Configuration
$BASE_URL = "http://localhost:8080"
$API_BASE = "$BASE_URL/api"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Social Forum Comprehensive Test Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test counters
$script:totalTests = 0
$script:passedTests = 0
$script:failedTests = 0

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [string]$Method = "GET",
        [object]$Body = $null,
        [hashtable]$Headers = @{}
    )
    
    $script:totalTests++
    Write-Host "Test $script:totalTests : $Name" -ForegroundColor Yellow
    
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            ContentType = "application/json"
            Headers = $Headers
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json -Depth 10)
        }
        
        $response = Invoke-RestMethod @params -ErrorAction Stop
        
        Write-Host "  PASSED" -ForegroundColor Green
        $script:passedTests++
        return $response
    }
    catch {
        Write-Host "  FAILED: $($_.Exception.Message)" -ForegroundColor Red
        $script:failedTests++
        return $null
    }
}

function Test-Health {
    Write-Host "`n--- Health Check ---" -ForegroundColor Magenta
    $health = Test-Endpoint "Health Check" "$BASE_URL/health"
    if ($health) {
        Write-Host "  Server Status: $($health.status)" -ForegroundColor Green
    }
}

function Test-UserRegistrationAndLogin {
    Write-Host "`n--- User Registration and Login ---" -ForegroundColor Magenta
    
    # Generate unique username
    $timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
    $username = "testuser_$timestamp"
    $password = "Password123"
    
    # Register user
    $registerData = @{
        username = $username
        email = "$username@test.com"
        password = $password
    }
    
    $registerResult = Test-Endpoint "Register New User" "$API_BASE/users/register" "POST" $registerData
    
    if ($registerResult) {
        Write-Host "  User ID: $($registerResult.id)" -ForegroundColor Cyan
        Write-Host "  Username: $($registerResult.username)" -ForegroundColor Cyan
        
        # Login
        $loginData = @{
            username = $username
            password = $password
        }
        
        $loginResult = Test-Endpoint "User Login" "$API_BASE/users/login" "POST" $loginData
        
        if ($loginResult) {
            Write-Host "  Login Success: User ID $($loginResult.id)" -ForegroundColor Cyan
            return @{
                userId = $loginResult.id
                username = $loginResult.username
            }
        }
    }
    
    return $null
}

function Test-PostCreation {
    param([hashtable]$User)
    
    Write-Host "`n--- Post Creation ---" -ForegroundColor Magenta
    
    if (-not $User) {
        Write-Host "  Skipping: No user available" -ForegroundColor Yellow
        return $null
    }
    
    # Create text post
    $postData = @{
        content = "This is a comprehensive test post created at $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss'). Testing comment count synchronization!"
        userId = $User.userId
    }
    
    $post = Test-Endpoint "Create Text Post" "$API_BASE/posts" "POST" $postData
    
    if ($post) {
        Write-Host "  Post ID: $($post.id)" -ForegroundColor Cyan
        Write-Host "  Content: $($post.content)" -ForegroundColor Cyan
        return $post.id
    }
    
    return $null
}

function Test-PostRetrieval {
    param([int]$PostId)
    
    Write-Host "`n--- Post Retrieval ---" -ForegroundColor Magenta
    
    if (-not $PostId) {
        Write-Host "  Skipping: No post available" -ForegroundColor Yellow
        return
    }
    
    # Get single post
    $post = Test-Endpoint "Get Post by ID" "$API_BASE/posts/$PostId"
    
    if ($post) {
        Write-Host "  Post ID: $($post.id)" -ForegroundColor Cyan
        Write-Host "  Comments Count: $($post.commentsCount)" -ForegroundColor Cyan
        Write-Host "  Likes Count: $($post.likesCount)" -ForegroundColor Cyan
        
        # Verify commentsCount property exists
        if ($null -ne $post.commentsCount) {
            Write-Host "  Comments count property exists" -ForegroundColor Green
        } else {
            Write-Host "  Comments count property missing!" -ForegroundColor Red
        }
    }
    
    # Get all posts
    $allPosts = Test-Endpoint "Get All Posts" "$API_BASE/posts"
    
    if ($allPosts -is [Array]) {
        Write-Host "  Total Posts: $($allPosts.Count)" -ForegroundColor Cyan
        
        # Check if posts have comment counts
        $postsWithCommentCount = $allPosts | Where-Object { $null -ne $_.commentsCount }
        if ($postsWithCommentCount.Count -gt 0) {
            Write-Host "  Posts include comment count data" -ForegroundColor Green
        } else {
            Write-Host "  Posts missing comment count data!" -ForegroundColor Red
        }
    }
}

function Test-Comments {
    param(
        [int]$PostId,
        [hashtable]$User
    )
    
    Write-Host "`n--- Comment Operations ---" -ForegroundColor Magenta
    
    if (-not $PostId -or -not $User) {
        Write-Host "  Skipping: No post or user available" -ForegroundColor Yellow
        return
    }
    
    # Create first comment
    $comment1Data = @{
        content = "This is test comment #1"
        postId = $PostId
        userId = $User.userId
    }
    
    $comment1 = Test-Endpoint "Create Comment 1" "$API_BASE/comments" "POST" $comment1Data
    
    if ($comment1) {
        Write-Host "  Comment ID: $($comment1.id)" -ForegroundColor Cyan
        
        # Verify post comment count increased
        Start-Sleep -Milliseconds 500  # Brief pause for DB sync
        $postAfterComment1 = Test-Endpoint "Verify Post After Comment 1" "$API_BASE/posts/$PostId"
        
        if ($postAfterComment1) {
            Write-Host "  Post Comments Count: $($postAfterComment1.commentsCount)" -ForegroundColor Cyan
            
            if ($postAfterComment1.commentsCount -eq 1) {
                Write-Host "  Comment count correctly shows 1" -ForegroundColor Green
            } else {
                Write-Host "  Comment count should be 1, but is $($postAfterComment1.commentsCount)" -ForegroundColor Red
            }
        }
    }
    
    # Create second comment
    $comment2Data = @{
        content = "This is test comment #2"
        postId = $PostId
        userId = $User.userId
    }
    
    $comment2 = Test-Endpoint "Create Comment 2" "$API_BASE/comments" "POST" $comment2Data
    
    if ($comment2) {
        Write-Host "  Comment ID: $($comment2.id)" -ForegroundColor Cyan
        
        # Verify post comment count increased again
        Start-Sleep -Milliseconds 500
        $postAfterComment2 = Test-Endpoint "Verify Post After Comment 2" "$API_BASE/posts/$PostId"
        
        if ($postAfterComment2) {
            Write-Host "  Post Comments Count: $($postAfterComment2.commentsCount)" -ForegroundColor Cyan
            
            if ($postAfterComment2.commentsCount -eq 2) {
                Write-Host "  Comment count correctly shows 2" -ForegroundColor Green
            } else {
                Write-Host "  Comment count should be 2, but is $($postAfterComment2.commentsCount)" -ForegroundColor Red
            }
        }
    }
    
    # Get all comments for post
    $allComments = Test-Endpoint "Get All Comments for Post" "$API_BASE/comments/post/$PostId"
    
    if ($allComments -is [Array]) {
        Write-Host "  Total Comments: $($allComments.Count)" -ForegroundColor Cyan
    }
}

function Test-ShareFunctionality {
    param([int]$PostId)
    
    Write-Host "`n--- Share Functionality ---" -ForegroundColor Magenta
    
    if (-not $PostId) {
        Write-Host "  Skipping: No post available" -ForegroundColor Yellow
        return
    }
    
    $shareResult = Test-Endpoint "Generate Share Link" "$API_BASE/posts/$PostId/share" "POST"
    
    if ($shareResult) {
        Write-Host "  Share URL: $($shareResult.shareUrl)" -ForegroundColor Cyan
        Write-Host "  Share Token: $($shareResult.shareToken)" -ForegroundColor Cyan
        Write-Host "  Share Count: $($shareResult.shareCount)" -ForegroundColor Cyan
        
        # Test accessing post via share token
        $sharedPost = Test-Endpoint "Access Post via Share Token" "$API_BASE/posts/shared/$($shareResult.shareToken)"
        
        if ($sharedPost) {
            Write-Host "  Post accessible via share link" -ForegroundColor Green
        }
    }
}

function Test-SearchFunctionality {
    Write-Host "`n--- Search Functionality ---" -ForegroundColor Magenta
    
    $searchQuery = "test"
    $searchResult = Test-Endpoint "Search Posts" "$API_BASE/search?query=$searchQuery"
    
    if ($searchResult) {
        Write-Host "  Search Results: $($searchResult.Count) posts found" -ForegroundColor Cyan
    }
}

function Show-TestSummary {
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "Test Summary" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Total Tests: $script:totalTests" -ForegroundColor White
    Write-Host "Passed: $script:passedTests" -ForegroundColor Green
    Write-Host "Failed: $script:failedTests" -ForegroundColor Red
    
    $successRate = if ($script:totalTests -gt 0) { 
        [math]::Round(($script:passedTests / $script:totalTests) * 100, 2) 
    } else { 
        0 
    }
    
    Write-Host "Success Rate: $successRate%" -ForegroundColor $(if ($successRate -ge 80) { "Green" } elseif ($successRate -ge 60) { "Yellow" } else { "Red" })
    Write-Host ""
    
    if ($script:failedTests -eq 0) {
        Write-Host " All tests passed!" -ForegroundColor Green
    } else {
        Write-Host " Some tests failed. Please review the output above." -ForegroundColor Yellow
    }
}

# Main Test Execution
Write-Host "Starting comprehensive test suite...`n"

# Run all tests
Test-Health
$user = Test-UserRegistrationAndLogin
$postId = Test-PostCreation -User $user
Test-PostRetrieval -PostId $postId
Test-Comments -PostId $postId -User $user
Test-ShareFunctionality -PostId $postId
Test-SearchFunctionality

# Show summary
Show-TestSummary

Write-Host "Test execution completed." -ForegroundColor Cyan
