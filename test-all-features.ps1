# Social Forum Application - Automated Test Script
# Tests all major features including registration, login, posts, likes, comments, search, and uploads

$baseUrl = "http://localhost:8080"
$testResults = @()
$testUser = @{
    username = "testuser_$(Get-Random)"
    email = "test_$(Get-Random)@example.com"
    password = "TestPass123!"
}

function Test-API {
    param(
        [string]$TestName,
        [string]$Method,
        [string]$Endpoint,
        [object]$Body,
        [int]$ExpectedStatus = 200
    )
    
    Write-Host "`n=== Testing: $TestName ===" -ForegroundColor Cyan
    
    try {
        $uri = "$baseUrl$Endpoint"
        $params = @{
            Uri = $uri
            Method = $Method
            ContentType = "application/json"
            ErrorAction = "Stop"
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json -Depth 10)
        }
        
        $response = Invoke-RestMethod @params -StatusCodeVariable statusCode
        
        if ($statusCode -eq $ExpectedStatus) {
            Write-Host "✓ PASS: $TestName" -ForegroundColor Green
            Write-Host "  Status: $statusCode"
            $testResults += @{Test = $TestName; Result = "PASS"; Status = $statusCode}
            return $response
        } else {
            Write-Host "✗ FAIL: $TestName" -ForegroundColor Red
            Write-Host "  Expected: $ExpectedStatus, Got: $statusCode"
            $testResults += @{Test = $TestName; Result = "FAIL"; Status = $statusCode}
            return $null
        }
    } catch {
        Write-Host "✗ FAIL: $TestName" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)"
        $testResults += @{Test = $TestName; Result = "FAIL"; Error = $_.Exception.Message}
        return $null
    }
}

Write-Host "`n╔════════════════════════════════════════════╗" -ForegroundColor Yellow
Write-Host "║   Social Forum - Automated Test Suite     ║" -ForegroundColor Yellow
Write-Host "╚════════════════════════════════════════════╝" -ForegroundColor Yellow

# Test 1: Health Check
Write-Host "`n--- Phase 1: Health Check ---" -ForegroundColor Magenta
Test-API -TestName "Health Check" -Method "GET" -Endpoint "/actuator/health"

# Test 2: User Registration
Write-Host "`n--- Phase 2: User Registration ---" -ForegroundColor Magenta
$registerResponse = Test-API -TestName "User Registration" -Method "POST" -Endpoint "/api/users/register" -Body $testUser -ExpectedStatus 201

if ($registerResponse) {
    Write-Host "  Registered User ID: $($registerResponse.id)"
    Write-Host "  Username: $($registerResponse.username)"
}

# Test 3: User Login
Write-Host "`n--- Phase 3: User Login ---" -ForegroundColor Magenta
$loginBody = @{
    username = $testUser.username
    password = $testUser.password
}
$loginResponse = Test-API -TestName "User Login" -Method "POST" -Endpoint "/api/users/login" -Body $loginBody

if ($loginResponse) {
    $userId = $loginResponse.id
    Write-Host "  Logged in User ID: $userId"
    
    # Test 4: Create Post
    Write-Host "`n--- Phase 4: Create Post ---" -ForegroundColor Magenta
    $postBody = @{
        content = "This is an automated test post created at $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') GMT+8"
        userId = $userId
        mediaType = "text"
    }
    $postResponse = Test-API -TestName "Create Post" -Method "POST" -Endpoint "/api/posts" -Body $postBody -ExpectedStatus 201
    
    if ($postResponse) {
        $postId = $postResponse.id
        Write-Host "  Created Post ID: $postId"
        
        # Test 5: Get All Posts
        Write-Host "`n--- Phase 5: Retrieve Posts ---" -ForegroundColor Magenta
        Test-API -TestName "Get All Posts" -Method "GET" -Endpoint "/api/posts"
        
        # Test 6: Get Specific Post
        Test-API -TestName "Get Post by ID" -Method "GET" -Endpoint "/api/posts/$postId"
        
        # Test 7: Like Post
        Write-Host "`n--- Phase 6: Like System ---" -ForegroundColor Magenta
        $likeResponse = Test-API -TestName "Like Post" -Method "POST" -Endpoint "/api/posts/$postId/likes?userId=$userId"
        
        if ($likeResponse) {
            Write-Host "  Liked: $($likeResponse.liked)"
            Write-Host "  Like Count: $($likeResponse.likeCount)"
        }
        
        # Test 8: Get Like Status
        Test-API -TestName "Get Like Status" -Method "GET" -Endpoint "/api/posts/$postId/likes/status?userId=$userId"
        
        # Test 9: Unlike Post
        $unlikeResponse = Test-API -TestName "Unlike Post" -Method "POST" -Endpoint "/api/posts/$postId/likes?userId=$userId"
        if ($unlikeResponse) {
            Write-Host "  Liked: $($unlikeResponse.liked)"
            Write-Host "  Like Count: $($unlikeResponse.likeCount)"
        }
        
        # Test 10: Comment System
        Write-Host "`n--- Phase 7: Comment System ---" -ForegroundColor Magenta
        $commentBody = @{
            content = "This is a test comment"
            userId = $userId
            postId = $postId
        }
        Test-API -TestName "Create Comment" -Method "POST" -Endpoint "/api/comments" -Body $commentBody -ExpectedStatus 201
        
        # Test 11: Get Comments for Post
        Test-API -TestName "Get Comments for Post" -Method "GET" -Endpoint "/api/comments/post/$postId"
        
        # Test 12: Search Functionality
        Write-Host "`n--- Phase 8: Search Functionality ---" -ForegroundColor Magenta
        Test-API -TestName "Search All" -Method "GET" -Endpoint "/api/search?query=test&type=all"
        Test-API -TestName "Search People" -Method "GET" -Endpoint "/api/search?query=$($testUser.username)&type=people"
        Test-API -TestName "Search Tags" -Method "GET" -Endpoint "/api/search?query=automated&type=tags"
        
        # Test 13: User Profile
        Write-Host "`n--- Phase 9: User Profile ---" -ForegroundColor Magenta
        Test-API -TestName "Get User Profile" -Method "GET" -Endpoint "/api/users/$userId"
        Test-API -TestName "Get User's Posts" -Method "GET" -Endpoint "/api/posts/user/$userId"
        
        # Test 14: Share Post
        Write-Host "`n--- Phase 10: Share Functionality ---" -ForegroundColor Magenta
        $shareResponse = Test-API -TestName "Generate Share Link" -Method "POST" -Endpoint "/api/posts/$postId/share"
        if ($shareResponse) {
            Write-Host "  Share URL: $($shareResponse.shareUrl)"
            Write-Host "  Share Count: $($shareResponse.shareCount)"
        }
        
        # Test 15: Clean Up - Delete Post
        Write-Host "`n--- Phase 11: Cleanup ---" -ForegroundColor Magenta
        Test-API -TestName "Delete Post" -Method "DELETE" -Endpoint "/api/posts/$postId"
    }
}

# Print Summary
Write-Host "`n`n╔════════════════════════════════════════════╗" -ForegroundColor Yellow
Write-Host "║           TEST SUMMARY                     ║" -ForegroundColor Yellow
Write-Host "╚════════════════════════════════════════════╝" -ForegroundColor Yellow

$passCount = ($testResults | Where-Object {$_.Result -eq "PASS"}).Count
$failCount = ($testResults | Where-Object {$_.Result -eq "FAIL"}).Count
$totalCount = $testResults.Count

Write-Host "`nTotal Tests: $totalCount" -ForegroundColor Cyan
Write-Host "Passed: $passCount" -ForegroundColor Green
Write-Host "Failed: $failCount" -ForegroundColor Red
Write-Host "Success Rate: $([math]::Round(($passCount/$totalCount)*100, 2))%" -ForegroundColor Cyan

if ($failCount -gt 0) {
    Write-Host "`nFailed Tests:" -ForegroundColor Red
    $testResults | Where-Object {$_.Result -eq "FAIL"} | ForEach-Object {
        Write-Host "  - $($_.Test)" -ForegroundColor Red
        if ($_.Error) {
            Write-Host "    Error: $($_.Error)" -ForegroundColor DarkRed
        }
    }
}

Write-Host "`n`nTest completed at $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Cyan
Write-Host "Test user created: $($testUser.username)" -ForegroundColor Cyan

if ($passCount -eq $totalCount) {
    Write-Host "`n✓ ALL TESTS PASSED! ✓" -ForegroundColor Green
    exit 0
} else {
    Write-Host "`n✗ SOME TESTS FAILED ✗" -ForegroundColor Red
    exit 1
}
