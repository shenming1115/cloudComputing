# Start app and test AI with logging

Write-Host 'Stopping any running Java processes...' -ForegroundColor Yellow
Get-Process java -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

Write-Host 'Setting environment variables...' -ForegroundColor Yellow
$env:JWT_SECRET = 'test-secret-key-minimum-32-characters-long-for-jwt-signing'
$env:AI_SECRET_KEY = 'SocialApp_Secret_2025'

Write-Host "AI_SECRET_KEY = $env:AI_SECRET_KEY" -ForegroundColor Cyan
Write-Host ''

Write-Host 'Starting application in background...' -ForegroundColor Yellow
$job = Start-Job -ScriptBlock {
    Set-Location 'C:\Users\User\Desktop\CS Y2S2\cloud\cloudComputing'
    $env:JWT_SECRET = 'test-secret-key-minimum-32-characters-long-for-jwt-signing'
    $env:AI_SECRET_KEY = 'SocialApp_Secret_2025'
    java -jar target/social-forum.jar 2>&1
}

Write-Host 'Waiting 25 seconds for startup...' -ForegroundColor Yellow
Start-Sleep -Seconds 25

Write-Host ''
Write-Host 'Checking startup logs for AI Service...' -ForegroundColor Cyan
$logs = Receive-Job $job
$aiServiceLogs = $logs | Select-String -Pattern 'AI Service|API Key|Worker URL' -Context 1,1
if ($aiServiceLogs) {
    $aiServiceLogs | ForEach-Object { Write-Host $_.Line -ForegroundColor White }
} else {
    Write-Host 'No AI Service initialization logs found' -ForegroundColor Red
}

Write-Host ''
Write-Host 'Testing AI endpoint...' -ForegroundColor Cyan
$aiData = '{"message":"Test"}'
try {
    $response = Invoke-RestMethod -Uri 'http://localhost:8080/api/ai/chat' -Method POST -Body $aiData -ContentType 'application/json'
    Write-Host "Response: $($response.response)" -ForegroundColor Green
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ''
Write-Host 'Checking for X-AI-Secret header logs...' -ForegroundColor Cyan
$headerLogs = Receive-Job $job | Select-String -Pattern 'X-AI-Secret|WARNING.*AI_SECRET_KEY' -Context 0,1
if ($headerLogs) {
    $headerLogs | ForEach-Object { Write-Host $_.Line -ForegroundColor Yellow }
} else {
    Write-Host 'No header logs found' -ForegroundColor Red
}

Write-Host ''
Write-Host 'Stopping application...' -ForegroundColor Yellow
Stop-Job $job
Remove-Job $job

Write-Host 'Done!' -ForegroundColor Green
