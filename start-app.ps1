# Start Social Forum App
$ErrorActionPreference = "Stop"

Write-Host "Checking for JAR file..." -ForegroundColor Cyan
if (-not (Test-Path "target/social-forum.jar")) {
    Write-Host "JAR not found. Building..." -ForegroundColor Yellow
    ./mvnw clean package -DskipTests
}

Write-Host "Starting Application..." -ForegroundColor Green
$env:SPRING_PROFILES_ACTIVE = "local"
java -jar target/social-forum.jar