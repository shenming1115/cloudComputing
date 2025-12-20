# Social Forum Backend API Test Script
$baseUrl = "http://localhost:8080"
$testsPassed = 0
$testsFailed = 0
$timestamp = Get-Date -Format "HHmmss"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Social Forum Backend API Tests" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Test 1: Health Check
Write-Host "[Test 1] Health Check..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/health" -Method GET
    if ($response.status -eq "UP") {
        Write-Host "PASS: Health check successful" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "FAIL: Unexpected health status" -ForegroundColor Red
        $testsFailed++
    }
} catch {
    Write-Host "FAIL: $($_.Exception.Message)" -ForegroundColor Red
    $testsFailed++
}

# Test 2: Get All Posts
Write-Host "[Test 2] Get All Posts..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/posts" -Method GET
    Write-Host "PASS: Posts endpoint working (Count: $($response.Count))" -ForegroundColor Green
    $testsPassed++
} catch {
    Write-Host "FAIL: $($_.Exception.Message)" -ForegroundColor Red
    $testsFailed++
}

# Test 3: Register User (with unique username)
Write-Host "[Test 3] Register User..." -ForegroundColor Yellow
try {
    $body = @{
        username = "user_$timestamp"
        email = "user_${timestamp}@example.com"
        password = "SecurePass123!"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/api/users/register" -Method POST -ContentType "application/json" -Body $body

    if ($response.id -and $response.username -eq "user_$timestamp" -and -not $response.password) {
        Write-Host "PASS: User registered (Username: user_$timestamp)" -ForegroundColor Green
        $global:userId = $response.id
        $global:username = "user_$timestamp"
        $testsPassed++
    } else {
        Write-Host "FAIL: Unexpected response" -ForegroundColor Red
        $testsFailed++
    }
} catch {
    Write-Host "FAIL: $($_.Exception.Message)" -ForegroundColor Red
    $testsFailed++
}

# Test 4: Register Duplicate Username
Write-Host "[Test 4] Register Duplicate Username (should fail)..." -ForegroundColor Yellow
try {
    $body = @{
        username = "user_$timestamp"
        email = "user2_${timestamp}@example.com"
        password = "SecurePass123"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/api/users/register" -Method POST -ContentType "application/json" -Body $body -ErrorAction Stop
    Write-Host "FAIL: Should have returned 400 error" -ForegroundColor Red
    $testsFailed++
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host "PASS: Duplicate username rejected" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "FAIL: Wrong error code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
        $testsFailed++
    }
}

# Test 5: Create Post
Write-Host "[Test 5] Create Post..." -ForegroundColor Yellow
if ($global:userId) {
    try {
        $body = @{
            content = "This is my first post! Testing the social forum backend."
            imageUrl = "https://example.com/image.jpg"
            userId = $global:userId
        } | ConvertTo-Json

        $response = Invoke-RestMethod -Uri "$baseUrl/api/posts" -Method POST -ContentType "application/json" -Body $body

        if ($response.id -and $response.content) {
            Write-Host "PASS: Post created (ID: $($response.id), ShareToken: $($response.shareToken))" -ForegroundColor Green
            $global:postId = $response.id
            $global:shareToken = $response.shareToken
            $testsPassed++
        } else {
            Write-Host "FAIL: Unexpected response" -ForegroundColor Red
            $testsFailed++
        }
    } catch {
        Write-Host "FAIL: $($_.Exception.Message)" -ForegroundColor Red
        $testsFailed++
    }
} else {
    Write-Host "SKIP: User ID not available" -ForegroundColor Gray
}

# Test 6: Generate Share Link
Write-Host "[Test 6] Generate Share Link..." -ForegroundColor Yellow
if ($global:postId) {
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/api/posts/$($global:postId)/share" -Method POST

        if ($response.shareToken -and $response.shareUrl) {
            Write-Host "PASS: Share link generated" -ForegroundColor Green
            Write-Host "  URL: $($response.shareUrl)" -ForegroundColor Cyan
            Write-Host "  Share Count: $($response.shareCount)" -ForegroundColor Cyan
            $global:shareToken = $response.shareToken
            $testsPassed++
        } else {
            Write-Host "FAIL: Unexpected response" -ForegroundColor Red
            $testsFailed++
        }
    } catch {
        Write-Host "FAIL: $($_.Exception.Message)" -ForegroundColor Red
        $testsFailed++
    }
} else {
    Write-Host "SKIP: Post ID not available" -ForegroundColor Gray
}

# Test 7: Access Post via Share Link
Write-Host "[Test 7] Access Post via Share Link..." -ForegroundColor Yellow
if ($global:shareToken) {
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/api/posts/shared/$($global:shareToken)"

        if ($response.post -and $response.shareCount) {
            Write-Host "PASS: Post accessed via share token" -ForegroundColor Green
            Write-Host "  Content: $($response.post.content.Substring(0, [Math]::Min(30, $response.post.content.Length)))..." -ForegroundColor Cyan
            Write-Host "  Share Count: $($response.shareCount)" -ForegroundColor Cyan
            $testsPassed++
        } else {
            Write-Host "FAIL: Unexpected response" -ForegroundColor Red
            $testsFailed++
        }
    } catch {
        Write-Host "FAIL: $($_.Exception.Message)" -ForegroundColor Red
        $testsFailed++
    }
} else {
    Write-Host "SKIP: Share token not available" -ForegroundColor Gray
}

# Test 8: Pagination
Write-Host "[Test 8] Get Posts with Pagination..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/posts?page=0&size=10&paginated=true"

    if ($null -ne $response.totalPages -and $null -ne $response.currentPage) {
        Write-Host "PASS: Pagination working" -ForegroundColor Green
        Write-Host "  Current Page: $($response.currentPage)" -ForegroundColor Cyan
        Write-Host "  Total Pages: $($response.totalPages)" -ForegroundColor Cyan
        Write-Host "  Total Elements: $($response.totalElements)" -ForegroundColor Cyan
        Write-Host "  Posts in response: $($response.posts.Count)" -ForegroundColor Cyan
        $testsPassed++
    } else {
        Write-Host "FAIL: Unexpected response structure" -ForegroundColor Red
        Write-Host "  Response: $($response | ConvertTo-Json -Compress)" -ForegroundColor Gray
        $testsFailed++
    }
} catch {
    Write-Host "FAIL: $($_.Exception.Message)" -ForegroundColor Red
    $testsFailed++
}

# Test 9: Create Comment
Write-Host "[Test 9] Create Comment..." -ForegroundColor Yellow
if ($global:userId -and $global:postId) {
    try {
        $body = @{
            content = "Great post! This is a test comment."
            postId = $global:postId
            userId = $global:userId
        } | ConvertTo-Json

        $response = Invoke-RestMethod -Uri "$baseUrl/api/comments" -Method POST -ContentType "application/json" -Body $body

        if ($response.id -and $response.content) {
            Write-Host "PASS: Comment created (ID: $($response.id))" -ForegroundColor Green
            $testsPassed++
        } else {
            Write-Host "FAIL: Unexpected response" -ForegroundColor Red
            $testsFailed++
        }
    } catch {
        Write-Host "FAIL: $($_.Exception.Message)" -ForegroundColor Red
        $testsFailed++
    }
} else {
    Write-Host "SKIP: User ID or Post ID not available" -ForegroundColor Gray
}

# Test 10: Login
Write-Host "[Test 10] Login with Valid Credentials..." -ForegroundColor Yellow
if ($global:username) {
    try {
        $body = @{
            username = $global:username
            password = "SecurePass123!"
        } | ConvertTo-Json

        $response = Invoke-RestMethod -Uri "$baseUrl/api/users/login" -Method POST -ContentType "application/json" -Body $body

        if ($response.message -like "*successful*") {
            Write-Host "PASS: Login successful" -ForegroundColor Green
            $testsPassed++
        } else {
            Write-Host "FAIL: Unexpected response" -ForegroundColor Red
            $testsFailed++
        }
    } catch {
        Write-Host "FAIL: $($_.Exception.Message)" -ForegroundColor Red
        $testsFailed++
    }
} else {
    Write-Host "SKIP: Username not available" -ForegroundColor Gray
}

# Test 11: Login with Invalid Credentials
Write-Host "[Test 11] Login with Invalid Credentials (should fail)..." -ForegroundColor Yellow
if ($global:username) {
    try {
        $body = @{
            username = $global:username
            password = "WrongPassword"
        } | ConvertTo-Json

        $response = Invoke-RestMethod -Uri "$baseUrl/api/users/login" -Method POST -ContentType "application/json" -Body $body -ErrorAction Stop
        Write-Host "FAIL: Should have returned error" -ForegroundColor Red
        $testsFailed++
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 400 -or $statusCode -eq 401) {
            Write-Host "PASS: Invalid credentials rejected (Code: $statusCode)" -ForegroundColor Green
            $testsPassed++
        } else {
            Write-Host "FAIL: Wrong error code: $statusCode" -ForegroundColor Red
            $testsFailed++
        }
    }
} else {
    Write-Host "SKIP: Username not available" -ForegroundColor Gray
}

# Test 12: Empty Content Validation
Write-Host "[Test 12] Create Post with Empty Content (should fail)..." -ForegroundColor Yellow
if ($global:userId) {
    try {
        $body = @{
            content = ""
            userId = $global:userId
        } | ConvertTo-Json

        $response = Invoke-RestMethod -Uri "$baseUrl/api/posts" -Method POST -ContentType "application/json" -Body $body -ErrorAction Stop
        Write-Host "FAIL: Should have returned validation error" -ForegroundColor Red
        $testsFailed++
    } catch {
        if ($_.Exception.Response.StatusCode -eq 400) {
            Write-Host "PASS: Empty content rejected" -ForegroundColor Green
            $testsPassed++
        } else {
            Write-Host "FAIL: Wrong error code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
            $testsFailed++
        }
    }
} else {
    Write-Host "SKIP: User ID not available" -ForegroundColor Gray
}

# Test 13: Invalid Email Validation
Write-Host "[Test 13] Register with Invalid Email (should fail)..." -ForegroundColor Yellow
try {
    $body = @{
        username = "testuser_${timestamp}_2"
        email = "invalidemail"
        password = "SecurePass123"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/api/users/register" -Method POST -ContentType "application/json" -Body $body -ErrorAction Stop
    Write-Host "FAIL: Should have returned validation error" -ForegroundColor Red
    $testsFailed++
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host "PASS: Invalid email rejected" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "FAIL: Wrong error code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
        $testsFailed++
    }
}

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Test Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Tests Passed: $testsPassed" -ForegroundColor Green
Write-Host "Tests Failed: $testsFailed" -ForegroundColor Red
$total = $testsPassed + $testsFailed
$percentage = if ($total -gt 0) { [math]::Round(($testsPassed / $total) * 100, 2) } else { 0 }
Write-Host "Success Rate: $percentage%" -ForegroundColor $(if ($percentage -ge 80) { "Green" } elseif ($percentage -ge 60) { "Yellow" } else { "Red" })

if ($testsFailed -eq 0) {
    Write-Host "`nAll tests passed! Your backend is working correctly." -ForegroundColor Green
} else {
    Write-Host "`nSome tests failed. Please review the errors above." -ForegroundColor Yellow
}
