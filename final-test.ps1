# Final comprehensive test

Write-Host ''
Write-Host '========================================' -ForegroundColor Cyan
Write-Host '  Final AI Test' -ForegroundColor Cyan
Write-Host '========================================' -ForegroundColor Cyan
Write-Host ''

# Stop any running processes
Write-Host '1. Stopping existing processes...' -ForegroundColor Yellow
Get-Process java -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# Set environment variables
Write-Host '2. Setting environment variables...' -ForegroundColor Yellow
$env:JWT_SECRET = 'test-secret-key-minimum-32-characters-long-for-jwt-signing'
$env:JWT_EXPIRATION = '86400000'
$env:AI_SECRET_KEY = 'SocialApp_Secret_2025'

Write-Host "   JWT_SECRET: configured" -ForegroundColor Gray
Write-Host "   JWT_EXPIRATION: $env:JWT_EXPIRATION" -ForegroundColor Gray
Write-Host "   AI_SECRET_KEY: $env:AI_SECRET_KEY" -ForegroundColor Gray
Write-Host ''

# Start application
Write-Host '3. Starting application...' -ForegroundColor Yellow
Write-Host '   Please wait 30-40 seconds...' -ForegroundColor Gray

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; `$env:JWT_SECRET='test-secret-key-minimum-32-characters-long-for-jwt-signing'; `$env:JWT_EXPIRATION='86400000'; `$env:AI_SECRET_KEY='SocialApp_Secret_2025'; java -jar target/social-forum.jar" -WindowStyle Minimized

Start-Sleep -Seconds 35

# Test health
Write-Host ''
Write-Host '4. Testing application health...' -ForegroundColor Yellow
try {
    Invoke-RestMethod -Uri 'http://localhost:8080/health' -Method GET | Out-Null
    Write-Host '   OK - Application is running' -ForegroundColor Green
} catch {
    Write-Host '   ERROR - Application not responding' -ForegroundColor Red
    Write-Host '   Please check the minimized window for errors' -ForegroundColor Yellow
    exit
}

# Test AI
Write-Host ''
Write-Host '5. Testing AI endpoint...' -ForegroundColor Yellow
$aiData = '{"message":"Hello"}'
try {
    $response = Invoke-RestMethod -Uri 'http://localhost:8080/api/ai/chat' -Method POST -Body $aiData -ContentType 'application/json'
    Write-Host '   Response:' -ForegroundColor Green
    Write-Host "   $($response.response)" -ForegroundColor White
} catch {
    Write-Host "   ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ''
Write-Host '========================================' -ForegroundColor Cyan
Write-Host '  Test Complete' -ForegroundColor Cyan
Write-Host '========================================' -ForegroundColor Cyan
Write-Host ''
Write-Host 'Application is running in minimized window' -ForegroundColor Yellow
Write-Host 'To stop: Get-Process java | Stop-Process -Force' -ForegroundColor Gray
Write-Host ''
