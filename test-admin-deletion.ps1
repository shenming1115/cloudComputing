# Admin Deletion Test Script
# Tests the enhanced admin deletion functionality (RDS + S3)

$BASE_URL = "http://localhost:8080"

Write-Host "=== Admin Deletion Test ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Login as admin
Write-Host "Step 1: Logging in as admin..." -ForegroundColor Yellow
$loginResponse = Invoke-RestMethod -Uri "$BASE_URL/api/users/login" `
    -Method POST `
    -ContentType "application/json" `
    -Body '{"username":"admin","password":"Admin@123"}'

if ($loginResponse.token) {
    Write-Host "✓ Admin login successful" -ForegroundColor Green
    $token = $loginResponse.token
} else {
    Write-Host "✗ Admin login failed" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 2: Get all users
Write-Host "Step 2: Fetching all users..." -ForegroundColor Yellow
try {
    $users = Invoke-RestMethod -Uri "$BASE_URL/api/admin/users" `
        -Method GET `
        -Headers @{ "Authorization" = "Bearer $token" }
    
    Write-Host "✓ Found $($users.Count) users" -ForegroundColor Green
    
    if ($users.Count -gt 1) {
        # Find a non-admin user to test deletion
        $testUser = $users | Where-Object { $_.role -ne "ADMIN" } | Select-Object -First 1
        
        if ($testUser) {
            Write-Host "  Test user: $($testUser.username) (ID: $($testUser.id))" -ForegroundColor Cyan
        }
    }
} catch {
    Write-Host "✗ Failed to fetch users: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Step 3: Get all posts
Write-Host "Step 3: Fetching all posts..." -ForegroundColor Yellow
try {
    $posts = Invoke-RestMethod -Uri "$BASE_URL/api/admin/posts" `
        -Method GET `
        -Headers @{ "Authorization" = "Bearer $token" }
    
    Write-Host "✓ Found $($posts.Count) posts" -ForegroundColor Green
    
    if ($posts.Count -gt 0) {
        $testPost = $posts | Select-Object -First 1
        Write-Host "  Test post: ID $($testPost.id) by user $($testPost.user.username)" -ForegroundColor Cyan
        if ($testPost.imageUrl) {
            Write-Host "  Has image: $($testPost.imageUrl)" -ForegroundColor Cyan
        }
    }
} catch {
    Write-Host "✗ Failed to fetch posts: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Step 4: Get system stats
Write-Host "Step 4: Fetching system stats..." -ForegroundColor Yellow
try {
    $stats = Invoke-RestMethod -Uri "$BASE_URL/api/admin/stats" `
        -Method GET `
        -Headers @{ "Authorization" = "Bearer $token" }
    
    Write-Host "✓ System stats retrieved" -ForegroundColor Green
    Write-Host "  Total Users: $($stats.totalUsers)" -ForegroundColor Cyan
    Write-Host "  Total Posts: $($stats.totalPosts)" -ForegroundColor Cyan
    Write-Host "  Total Comments: $($stats.totalComments)" -ForegroundColor Cyan
    Write-Host "  CPU Usage: $([math]::Round($stats.systemCpu * 100, 2))%" -ForegroundColor Cyan
    Write-Host "  JVM Memory: $([math]::Round($stats.jvmMemory / 1MB, 2)) MB" -ForegroundColor Cyan
    Write-Host "  AWS Instance: $($stats.awsMetadata.instanceId)" -ForegroundColor Cyan
    Write-Host "  AWS Region: $($stats.awsMetadata.region)" -ForegroundColor Cyan
} catch {
    Write-Host "✗ Failed to fetch stats: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Step 5: Test deletion (optional - commented out for safety)
Write-Host "Step 5: Deletion test (DISABLED for safety)" -ForegroundColor Yellow
Write-Host "  To test deletion, uncomment the code in this script" -ForegroundColor Gray
Write-Host "  WARNING: This will permanently delete data from RDS and S3!" -ForegroundColor Red

<#
# UNCOMMENT TO TEST DELETION (USE WITH CAUTION!)
if ($testPost) {
    Write-Host "  Testing post deletion..." -ForegroundColor Yellow
    try {
        $deleteResponse = Invoke-RestMethod -Uri "$BASE_URL/api/admin/posts/$($testPost.id)" `
            -Method DELETE `
            -Headers @{ "Authorization" = "Bearer $token" }
        
        Write-Host "  ✓ Post deleted: $($deleteResponse.message)" -ForegroundColor Green
    } catch {
        Write-Host "  ✗ Failed to delete post: $($_.Exception.Message)" -ForegroundColor Red
    }
}
#>

Write-Host ""
Write-Host "=== Test Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Admin Dashboard URL: $BASE_URL/html/admin-dashboard.html" -ForegroundColor Green
Write-Host ""
