# AI助手401错误修复

## 🔍 问题原因

AI助手返回401错误的原因是：**缺少 `AI_SECRET_KEY` 环境变量**

从图片可以看到，Cloudflare Worker需要 `AI_SECRET_KEY` 来验证请求。

## ✅ 解决方案

### 1. 更新启动脚本

已更新 `start-app.ps1`，添加了 `AI_SECRET_KEY` 环境变量：

```powershell
$env:AI_SECRET_KEY="SocialApp_Secret_2025"
```

### 2. 重启应用

**停止当前应用** (在运行应用的终端按 `Ctrl+C`)

**重新启动应用：**
```powershell
.\start-app.ps1
```

### 3. 重新测试

等待应用完全启动后（看到 "Started Application" 消息），运行：

```powershell
.\test-ai.ps1
```

## 📋 预期结果

```
========================================
  AI Assistant Test
========================================

1. Register/Login Test User...
   ✓ Login successful

2. Testing AI Assistant...

Question: Hello, please introduce yourself briefly
✓ AI Response:
[AI的回复内容]

Question: What can you do?
✓ AI Response:
[AI的回复内容]

Question: What is Spring Boot?
✓ AI Response:
[AI的回复内容]

Question: Tell me a joke
✓ AI Response:
[AI的回复内容]

========================================
Success: 4 / 4
Failed: 0 / 4
========================================
```

## 🔑 环境变量说明

应用现在需要以下环境变量：

1. **JWT_SECRET** - JWT令牌签名密钥
   - 值：`test-secret-key-minimum-32-characters-long-for-jwt-signing`

2. **JWT_EXPIRATION** - JWT令牌过期时间
   - 值：`86400000` (24小时)

3. **AI_SECRET_KEY** - AI Worker验证密钥 ⭐ 新增
   - 值：`SocialApp_Secret_2025`
   - 用途：验证对Cloudflare Worker的请求

## 🎯 验证步骤

1. ✅ 停止当前应用
2. ✅ 运行 `.\start-app.ps1`（已包含AI_SECRET_KEY）
3. ✅ 等待应用启动完成
4. ✅ 运行 `.\test-ai.ps1`
5. ✅ 确认所有AI测试通过

---

**注意：** 如果仍然失败，请检查：
1. Cloudflare Worker是否在线
2. Worker URL是否正确：`https://social-forum-a1.shenming0387.workers.dev/`
3. AI_SECRET_KEY是否与Worker配置匹配
