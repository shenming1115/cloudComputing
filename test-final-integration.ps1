# 最终集成测试脚本
# Final Integration Test Script

$BASE_URL = "http://localhost:8080"

Write-Host "=== 最终集成测试 / Final Integration Test ===" -ForegroundColor Cyan
Write-Host ""

# 测试 1: 登录获取 Token
Write-Host "测试 1: 管理员登录..." -ForegroundColor Yellow
try {
    $loginResponse = Invoke-RestMethod -Uri "$BASE_URL/api/users/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body '{"username":"admin","password":"Admin@123"}'
    
    if ($loginResponse.token) {
        Write-Host "✓ 登录成功" -ForegroundColor Green
        $token = $loginResponse.token
    } else {
        Write-Host "✗ 登录失败" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "✗ 登录失败: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 测试 2: 获取统计数据
Write-Host "测试 2: 获取管理员统计数据..." -ForegroundColor Yellow
try {
    $stats = Invoke-RestMethod -Uri "$BASE_URL/api/admin/stats" `
        -Method GET `
        -Headers @{ "Authorization" = "Bearer $token" }
    
    Write-Host "✓ 统计数据获取成功" -ForegroundColor Green
    Write-Host ""
    Write-Host "  📊 数据详情:" -ForegroundColor Cyan
    Write-Host "  ├─ CPU Load: $($stats.cpuLoad)" -ForegroundColor White
    Write-Host "  ├─ User Count: $($stats.userCount)" -ForegroundColor White
    Write-Host "  ├─ Post Count: $($stats.postCount)" -ForegroundColor White
    Write-Host "  ├─ Total Users: $($stats.totalUsers)" -ForegroundColor White
    Write-Host "  ├─ Total Posts: $($stats.totalPosts)" -ForegroundColor White
    Write-Host "  ├─ JVM Memory: $([math]::Round($stats.jvmMemory / 1MB, 2)) MB" -ForegroundColor White
    Write-Host "  ├─ Active Threads: $($stats.activeThreads)" -ForegroundColor White
    Write-Host "  ├─ DB Connections: $($stats.dbConnections)" -ForegroundColor White
    Write-Host "  └─ AI Status: $($stats.aiStatus)" -ForegroundColor White
    
    # 验证关键字段
    if ($stats.cpuLoad -match '\d+\.\d+%') {
        Write-Host "  ✓ cpuLoad 格式正确 (字符串百分比)" -ForegroundColor Green
    } else {
        Write-Host "  ✗ cpuLoad 格式错误" -ForegroundColor Red
    }
    
    if ($stats.userCount -ne $null) {
        Write-Host "  ✓ userCount 字段存在" -ForegroundColor Green
    } else {
        Write-Host "  ✗ userCount 字段缺失" -ForegroundColor Red
    }
    
    if ($stats.postCount -ne $null) {
        Write-Host "  ✓ postCount 字段存在" -ForegroundColor Green
    } else {
        Write-Host "  ✗ postCount 字段缺失" -ForegroundColor Red
    }
    
} catch {
    Write-Host "✗ 统计数据获取失败: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# 测试 3: AI Worker (Demo Mode)
Write-Host "测试 3: AI Worker (Demo Mode)..." -ForegroundColor Yellow
try {
    $aiResponse = Invoke-RestMethod -Uri "$BASE_URL/api/ai/chat" `
        -Method POST `
        -ContentType "application/json" `
        -Headers @{ "Authorization" = "Bearer $token" } `
        -Body '{"message":"Hello, test message"}'
    
    if ($aiResponse.success) {
        Write-Host "✓ AI Worker 响应成功" -ForegroundColor Green
        Write-Host "  Response: $($aiResponse.response.Substring(0, [Math]::Min(100, $aiResponse.response.Length)))..." -ForegroundColor Cyan
    } else {
        Write-Host "✗ AI Worker 响应失败" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ AI Worker 测试失败: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "  这可能是因为 Cloudflare Worker 未部署或配置错误" -ForegroundColor Yellow
}

Write-Host ""

# 测试 4: 管理员后台访问
Write-Host "测试 4: 管理员后台页面访问..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$BASE_URL/admin-dashboard.html" -UseBasicParsing
    
    if ($response.StatusCode -eq 200) {
        Write-Host "✓ 管理员后台页面可访问" -ForegroundColor Green
        
        # 检查关键 CSS 样式
        if ($response.Content -match '#000000') {
            Write-Host "  ✓ 包含纯黑背景色 (#000000)" -ForegroundColor Green
        }
        
        if ($response.Content -match '#00FF00') {
            Write-Host "  ✓ 包含荧光绿色 (#00FF00)" -ForegroundColor Green
        }
        
        if ($response.Content -match '12rem') {
            Write-Host "  ✓ 包含巨大字体 (12rem)" -ForegroundColor Green
        }
        
        if ($response.Content -match 'setInterval.*loadStats.*5000') {
            Write-Host "  ✓ 包含5秒自动刷新" -ForegroundColor Green
        }
    }
} catch {
    Write-Host "✗ 管理员后台页面访问失败: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== 测试完成 / Test Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "📱 访问管理员后台:" -ForegroundColor Yellow
Write-Host "   $BASE_URL/admin-dashboard.html" -ForegroundColor White
Write-Host ""
Write-Host "🎨 预期效果:" -ForegroundColor Yellow
Write-Host "   ✓ 纯黑背景 (#000000)" -ForegroundColor White
Write-Host "   ✓ 荧光绿文字 (#00FF00)" -ForegroundColor White
Write-Host "   ✓ 巨大数值 (12rem = 192px)" -ForegroundColor White
Write-Host "   ✓ 每5秒自动刷新" -ForegroundColor White
Write-Host "   ✓ 霓虹发光效果" -ForegroundColor White
Write-Host ""
