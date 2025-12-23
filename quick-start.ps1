# Quick Start - Run the compiled JAR directly

Write-Host ''
Write-Host '========================================'
Write-Host '  Starting SocialApp'
Write-Host '========================================'
Write-Host ''

# Set environment variables
$env:JWT_SECRET = 'test-secret-key-minimum-32-characters-long-for-jwt-signing'
$env:JWT_EXPIRATION = '86400000'
$env:AI_SECRET_KEY = 'SocialApp_Secret_2025'

Write-Host 'Environment variables set:' -ForegroundColor Green
Write-Host '  JWT_SECRET: configured' -ForegroundColor Gray
Write-Host '  JWT_EXPIRATION: 86400000' -ForegroundColor Gray
Write-Host '  AI_SECRET_KEY: configured' -ForegroundColor Gray
Write-Host ''

# Check if port 8080 is in use
$portInUse = Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue
if ($portInUse) {
    Write-Host 'WARNING: Port 8080 is already in use!' -ForegroundColor Red
    Write-Host 'Stopping existing process...' -ForegroundColor Yellow
    $process = Get-Process -Id $portInUse.OwningProcess -ErrorAction SilentlyContinue
    if ($process) {
        Stop-Process -Id $process.Id -Force
        Start-Sleep -Seconds 2
        Write-Host 'Process stopped.' -ForegroundColor Green
    }
}

Write-Host 'Starting application...' -ForegroundColor Yellow
Write-Host ''

# Run the JAR file
java -jar target/social-forum.jar
