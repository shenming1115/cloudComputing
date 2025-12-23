# Debug Worker - Get detailed error information

Write-Host ''
Write-Host '========================================' -ForegroundColor Cyan
Write-Host '  Worker Debug Test' -ForegroundColor Cyan
Write-Host '========================================' -ForegroundColor Cyan
Write-Host ''

$workerUrl = 'https://social-forum-a1.shenming0387.workers.dev/'
$secret = 'SocialApp_Secret_2025'

Write-Host 'Testing Worker with detailed error capture...' -ForegroundColor Yellow
Write-Host ''

$body = @{
    systemPrompt = 'You are a helpful assistant'
    userMessage = 'Say hello'
} | ConvertTo-Json

$headers = @{
    'X-AI-Secret' = $secret
    'Content-Type' = 'application/json'
}

Write-Host "Request Body:" -ForegroundColor Cyan
Write-Host $body -ForegroundColor Gray
Write-Host ''

try {
    $response = Invoke-WebRequest -Uri $workerUrl -Method POST -Body $body -Headers $headers
    
    Write-Host "SUCCESS!" -ForegroundColor Green
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host ''
    Write-Host "Response:" -ForegroundColor Cyan
    $json = $response.Content | ConvertFrom-Json
    Write-Host ($json | ConvertTo-Json -Depth 10) -ForegroundColor White
    
} catch {
    Write-Host "FAILED!" -ForegroundColor Red
    Write-Host "Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    Write-Host ''
    
    try {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $errorBody = $reader.ReadToEnd()
        $reader.Close()
        
        Write-Host "Error Response:" -ForegroundColor Yellow
        try {
            $errorJson = $errorBody | ConvertFrom-Json
            Write-Host ($errorJson | ConvertTo-Json -Depth 10) -ForegroundColor White
        } catch {
            Write-Host $errorBody -ForegroundColor White
        }
    } catch {
        Write-Host "Could not read error response" -ForegroundColor Red
    }
}

Write-Host ''
Write-Host '========================================' -ForegroundColor Cyan
Write-Host ''

Write-Host 'Next steps:' -ForegroundColor Yellow
Write-Host '1. Check Cloudflare Worker logs in Dashboard' -ForegroundColor Gray
Write-Host '2. Look for console.log messages' -ForegroundColor Gray
Write-Host '3. Check if GEMINI_API_KEY is valid' -ForegroundColor Gray
Write-Host '4. Try the simplified worker code (cloudflare-worker-simple.js)' -ForegroundColor Gray
Write-Host ''
