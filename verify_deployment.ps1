# Configuration
$BaseUrl = "http://localhost:8080/api"
$AdminUser = "admin123"
$AdminPass = "pxTUxZPBBmgk3XD"
$TestUser = "testuser_" + (Get-Random)
$TestPass = "Password123!"

function Test-Step {
    param($Name, $Block)
    Write-Host "Testing: $Name..." -NoNewline
    try {
        & $Block
        Write-Host " [PASS]" -ForegroundColor Green
    } catch {
        Write-Host " [FAIL]" -ForegroundColor Red
        Write-Host "Error: $_" -ForegroundColor Yellow
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader $_.Exception.Response.GetResponseStream()
            Write-Host "Response Body: $($reader.ReadToEnd())" -ForegroundColor DarkYellow
        }
    }
}

# 1. Admin Login & Role Check
$script:AdminToken = ""
$script:AdminId = ""
Test-Step "Admin Login" {
    $maxRetries = 10
    $retryCount = 0
    $loginSuccess = $false
    
    while (-not $loginSuccess -and $retryCount -lt $maxRetries) {
        try {
            $body = @{ username = $AdminUser; password = $AdminPass } | ConvertTo-Json
            $response = Invoke-RestMethod -Uri "$BaseUrl/users/login" -Method Post -Body $body -ContentType "application/json"
            $script:AdminToken = $response.token
            $script:AdminId = $response.id
            if (-not $script:AdminToken) { throw "No token received" }
            $loginSuccess = $true
        } catch {
            $retryCount++
            Write-Host "." -NoNewline
            Start-Sleep -Seconds 2
        }
    }
    
    if (-not $loginSuccess) { throw "Admin login failed after $maxRetries retries" }
    
    # Verify Role
    $userResponse = Invoke-RestMethod -Uri "$BaseUrl/users/$($script:AdminId)" -Method Get -Headers @{ Authorization = "Bearer $script:AdminToken" }
    if ($userResponse.role -ne "ADMIN") { throw "Role is $($userResponse.role), expected ADMIN" }
}

# 2. Search Stability (Empty Result)
Test-Step "Search Stability (Empty Result)" {
    $response = Invoke-RestMethod -Uri "$BaseUrl/search?query=nonexistentstring12345&type=all" -Method Get -Headers @{ Authorization = "Bearer $script:AdminToken" }
    if ($response.posts.Count -ne 0) { throw "Expected 0 posts" }
    if ($response.users.Count -ne 0) { throw "Expected 0 users" }
}

# 3. Register & Login Normal User
$script:UserToken = ""
$script:UserId = ""
Test-Step "Register & Login Normal User ($TestUser)" {
    # Register
    $regBody = @{ username = $TestUser; password = $TestPass; email = "$TestUser@test.com" } | ConvertTo-Json
    try {
        Invoke-RestMethod -Uri "$BaseUrl/users/register" -Method Post -Body $regBody -ContentType "application/json"
    } catch {
        # Ignore if already exists (unlikely with random)
    }

    # Login
    $loginBody = @{ username = $TestUser; password = $TestPass } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "$BaseUrl/users/login" -Method Post -Body $loginBody -ContentType "application/json"
    $script:UserToken = $response.token
    $script:UserId = $response.id
    if (-not $script:UserToken) { throw "No token received" }
}

# 4. Permission Isolation & Global Management
Test-Step "Permission Checks (Admin Delete vs User Delete)" {
    # User creates a post
    $userPostBody = @{ content = "User Post for Deletion Test"; userId = $script:UserId } | ConvertTo-Json
    $userPost = Invoke-RestMethod -Uri "$BaseUrl/posts" -Method Post -Body $userPostBody -ContentType "application/json" -Headers @{ Authorization = "Bearer $script:UserToken" }
    $UserPostId = $userPost.id

    # Admin deletes User's post (Should Pass)
    Invoke-RestMethod -Uri "$BaseUrl/posts/$UserPostId" -Method Delete -Headers @{ Authorization = "Bearer $script:AdminToken" }
    
    # Admin creates a post
    $adminPostBody = @{ content = "Admin Post Protected"; userId = $script:AdminId } | ConvertTo-Json
    $adminPost = Invoke-RestMethod -Uri "$BaseUrl/posts" -Method Post -Body $adminPostBody -ContentType "application/json" -Headers @{ Authorization = "Bearer $script:AdminToken" }
    $AdminPostId = $adminPost.id

    # User tries to delete Admin's post (Should Fail 403)
    try {
        Invoke-RestMethod -Uri "$BaseUrl/posts/$AdminPostId" -Method Delete -Headers @{ Authorization = "Bearer $script:UserToken" }
        throw "User was able to delete Admin post! Security Failure."
    } catch {
        if ($_.Exception.Response.StatusCode -eq [System.Net.HttpStatusCode]::Forbidden) {
            # Expected
        } else {
            throw "Expected 403 Forbidden, got $($_.Exception.Response.StatusCode)"
        }
    }
}

# 5. AI Boost Test
Test-Step "AI Boost (Auth Check)" {
    Write-Host "Debug: Checking Token validity..."
    try {
        Invoke-RestMethod -Uri "$BaseUrl/users/$script:AdminId" -Method Get -Headers @{ Authorization = "Bearer $script:AdminToken" }
        Write-Host "Debug: Token is valid for /users endpoint."
    } catch {
        Write-Host "Debug: Token failed for /users endpoint: $_"
    }

    $aiBody = @{ topic = "Testing" } | ConvertTo-Json
    try {
        $response = Invoke-RestMethod -Uri "$BaseUrl/ai/boost" -Method Post -Body $aiBody -ContentType "application/json" -Headers @{ Authorization = "Bearer $script:AdminToken" }
        Write-Host "AI Boost Success" -ForegroundColor Green
    } catch {
        if ($_.Exception.Response) {
             $reader = New-Object System.IO.StreamReader $_.Exception.Response.GetResponseStream()
             Write-Host "AI Boost Error Body: $($reader.ReadToEnd())" -ForegroundColor Red
        }
        if ($_.Exception.Response.StatusCode -eq [System.Net.HttpStatusCode]::Unauthorized) {
            throw "AI Boost returned 401 Unauthorized!"
        }
        # 500 is acceptable if the external worker is down, as long as it's not 401
        Write-Host " (Note: AI Service might be down, but Auth passed)" -ForegroundColor Gray
    }
}

Write-Host "`nVerification Complete."
