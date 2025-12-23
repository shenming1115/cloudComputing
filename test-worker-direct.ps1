# Test Cloudflare Worker directly

Write-Host ''
Write-Host '========================================'
Write-Host '  Testing Cloudflare Worker Directly'
Write-Host '========================================'
Write-Host ''

$workerUrl = 'https://social-forum-a1.shenming0387.workers.dev/'
$secret = 'SocialApp_Secret_2025'

Write-Host "Worker URL: $workerUrl" -ForegroundColor Cyan
Write-Host "Secret: $secret" -ForegroundColor Gray
Write-Host ''

# Test 1: Without secret (should get 403)
Write-Host '1. Testing without secret (should fail)...' -ForegroundColor Yellow
try {
    $body = @{
        systemPrompt = 'You are a helpful assistant'
        userMessage = 'Hello'
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri $workerUrl -Method POST -Body $body -ContentType 'application/json'
    Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Red
    Write-Host "   Response: $($response.Content)" -ForegroundColor Red
}
catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "   Status: $statusCode" -ForegroundColor $(if ($statusCode -eq 403) { 'Green' } else { 'Red' })
    if ($statusCode -eq 403) {
        Write-Host '   OK - Got expected 403 Forbidden' -ForegroundColor Green
    }
}

Write-Host ''

# Test 2: With secret
Write-Host '2. Testing with secret...' -ForegroundColor Yellow
try {
    $body = @{
        systemPrompt = 'You are a helpful assistant'
        userMessage = 'Say hello in one sentence'
    } | ConvertTo-Json
    
    $headers = @{
        'X-AI-Secret' = $secret
    }
    
    $response = Invoke-WebRequest -Uri $workerUrl -Method POST -Body $body -ContentType 'application/json' -Headers $headers
    Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "   Response:" -ForegroundColor Green
    $json = $response.Content | ConvertFrom-Json
    Write-Host "   $($json.response)" -ForegroundColor White
}
catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "   Status: $statusCode" -ForegroundColor Red
    
    try {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $errorBody = $reader.ReadToEnd()
        Write-Host "   Error Response: $errorBody" -ForegroundColor Red
    }
    catch {
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ''
Write-Host '========================================'
Write-Host ''

Write-Host 'Possible issues if test failed:' -ForegroundColor Yellow
Write-Host '1. Worker code not updated yet' -ForegroundColor Gray
Write-Host '2. Environment variables not set in Worker:' -ForegroundColor Gray
Write-Host '   - AI_SECRET_KEY' -ForegroundColor Gray
Write-Host '   - OPENAI_API_KEY' -ForegroundColor Gray
Write-Host '   - GEMINI_API_KEY' -ForegroundColor Gray
Write-Host '3. API keys invalid or no quota' -ForegroundColor Gray
Write-Host ''
