# Start Spring Boot Application
$env:JWT_SECRET="test-secret-key-minimum-32-characters-long-for-jwt-signing"
$env:JWT_EXPIRATION="86400000"
$env:AI_SECRET_KEY="SocialApp_Secret_2025"

Write-Host "`nStarting SocialApp..." -ForegroundColor Cyan
Write-Host "=====================`n" -ForegroundColor Cyan

Write-Host "Setting environment variables..." -ForegroundColor Yellow
Write-Host "  JWT_SECRET: configured" -ForegroundColor Gray
Write-Host "  JWT_EXPIRATION: 86400000 (24 hours)" -ForegroundColor Gray
Write-Host "  AI_SECRET_KEY: configured`n" -ForegroundColor Gray

Write-Host "Starting Spring Boot application..." -ForegroundColor Yellow
Write-Host "This will take about 30-60 seconds...`n" -ForegroundColor Gray

.\mvnw spring-boot:run
