$ErrorActionPreference = 'Continue'
$baseUrl = 'http://localhost:8080'

Write-Host ''
Write-Host '========================================'
Write-Host '  AI Assistant Test'
Write-Host '========================================'
Write-Host ''

# Register test user
$userData = @{
    username = 'testuser'
    email = 'testuser@example.com'
    password = 'Test123456!'
}

Write-Host '1. Register/Login Test User...'
try {
    $regJson = $userData | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/api/users/register" -Method POST -Body $regJson -ContentType 'application/json' | Out-Null
    Write-Host '   User registered' -ForegroundColor Green
}
catch {
    Write-Host '   User exists, continuing...' -ForegroundColor Gray
}

# Login
$loginData = @{
    username = $userData.username
    password = $userData.password
}

try {
    $loginJson = $loginData | ConvertTo-Json
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/users/login" -Method POST -Body $loginJson -ContentType 'application/json'
    $token = $loginResponse.token
    Write-Host '   Login successful' -ForegroundColor Green
}
catch {
    Write-Host '   ERROR - Login failed' -ForegroundColor Red
    exit
}

$headers = @{ 'Authorization' = "Bearer $token" }

Write-Host ''
Write-Host '2. Testing AI Assistant...'
Write-Host ''

$questions = @(
    'Hello, please introduce yourself briefly',
    'What can you do?',
    'What is Spring Boot?',
    'Tell me a joke'
)

$success = 0
$failed = 0

foreach ($q in $questions) {
    Write-Host "Question: $q" -ForegroundColor Cyan
    
    try {
        $aiData = @{ message = $q } | ConvertTo-Json
        $response = Invoke-RestMethod -Uri "$baseUrl/api/ai/chat" -Method POST -Body $aiData -ContentType 'application/json' -Headers $headers
        
        if ($response.response) {
            Write-Host 'AI Response:' -ForegroundColor Green
            Write-Host $response.response -ForegroundColor White
            $success++
        }
        else {
            Write-Host 'ERROR - No response' -ForegroundColor Red
            $failed++
        }
    }
    catch {
        Write-Host "ERROR - $($_.Exception.Message)" -ForegroundColor Red
        $failed++
    }
    
    Write-Host ''
    Start-Sleep -Seconds 1
}

Write-Host '========================================'
Write-Host "Success: $success / $($questions.Count)" -ForegroundColor Green
Write-Host "Failed: $failed / $($questions.Count)" -ForegroundColor Red
Write-Host '========================================'
Write-Host ''
