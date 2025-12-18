Write-Host "Starting Social Forum Backend..." -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the application`n" -ForegroundColor Yellow

java "-Dspring.profiles.active=dev" -jar "target\social-forum.jar"
