# AI助手测试脚本

$baseUrl = "http://localhost:8080"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  AI 助手功能测试" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# 测试用户登录
Write-Host "正在登录测试用户..." -ForegroundColor Yellow
try {
    # 先尝试注册
    $registerData = @{
        username = "testuser"
        email = "testuser@example.com"
        password = "Test123456!"
    } | ConvertTo-Json
    
    try {
        Invoke-RestMethod -Uri "$baseUrl/api/users/register" -Method POST -Body $registerData -ContentType "application/json" | Out-Null
        Write-Host "✓ 用户注册成功" -ForegroundColor Green
    } catch {
        Write-Host "用户可能已存在，继续登录..." -ForegroundColor Gray
    }
    
    # 登录
    $loginData = @{
        username = "testuser"
        password = "Test123456!"
    } | ConvertTo-Json
    
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/users/login" -Method POST -Body $loginData -ContentType "application/json"
    $token = $loginResponse.token
    $headers = @{ "Authorization" = "Bearer $token" }
    Write-Host "✓ 登录成功`n" -ForegroundColor Green
    
    # 测试AI助手
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "开始测试AI助手对话..." -ForegroundColor Yellow
    Write-Host "========================================`n" -ForegroundColor Cyan
    
    $testQuestions = @(
        "你好，请简单介绍一下你自己",
        "你能做什么？",
        "请用一句话总结Spring Boot的优点",
        "什么是RESTful API？",
        "给我讲个笑话"
    )
    
    $successCount = 0
    $failCount = 0
    
    foreach ($question in $testQuestions) {
        Write-Host "问题: $question" -ForegroundColor Cyan
        
        try {
            $aiData = @{
                message = $question
            } | ConvertTo-Json
            
            $response = Invoke-RestMethod -Uri "$baseUrl/api/ai/chat" -Method POST -Body $aiData -ContentType "application/json" -Headers $headers
            
            if ($response.response) {
                Write-Host "✓ AI回复:" -ForegroundColor Green
                Write-Host "  $($response.response)`n" -ForegroundColor White
                $successCount++
            } else {
                Write-Host "✗ AI没有返回回复`n" -ForegroundColor Red
                $failCount++
            }
            
            Start-Sleep -Seconds 1
            
        } catch {
            Write-Host "✗ 请求失败: $($_.Exception.Message)`n" -ForegroundColor Red
            $failCount++
        }
    }
    
    # 总结
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "测试完成" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "成功: $successCount / $($testQuestions.Count)" -ForegroundColor Green
    Write-Host "失败: $failCount / $($testQuestions.Count)" -ForegroundColor Red
    
    if ($failCount -eq 0) {
        Write-Host "`n✓ AI助手功能正常！" -ForegroundColor Green
    } else {
        Write-Host "`n✗ AI助手存在问题，请检查:" -ForegroundColor Red
        Write-Host "1. Gemini API密钥是否配置正确" -ForegroundColor Gray
        Write-Host "2. 网络连接是否正常" -ForegroundColor Gray
        Write-Host "3. API配额是否充足" -ForegroundColor Gray
    }
    
} catch {
    Write-Host "✗ 登录失败: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "`n请确保应用正在运行 (http://localhost:8080)" -ForegroundColor Yellow
}

Write-Host "`n========================================`n" -ForegroundColor Cyan
