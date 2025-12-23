# 🔧 Worker调试完整指南

## 当前状态
- ✅ Java应用可以连接到Worker
- ✅ 认证通过（不是403）
- ❌ Worker返回500错误（内部错误）
- ❌ 没有错误消息返回

## 🎯 调试步骤

### 步骤1：使用测试Worker验证基础功能

1. **登录Cloudflare Dashboard**
   - https://dash.cloudflare.com/

2. **进入你的Worker**
   - Workers & Pages → `social-forum-a1`

3. **替换为测试代码**
   - 点击 "Edit Code"
   - 完全替换为 `cloudflare-worker-test.js` 的内容
   - 点击 "Save and Deploy"

4. **测试**
   ```powershell
   .\debug-worker.ps1
   ```

**预期结果：**
```json
{
  "response": "Test successful! Received: Say hello",
  "debug": {
    "secretReceived": true,
    "geminiKeyPresent": true,
    "openaiKeyPresent": true
  }
}
```

**如果失败：**
- 检查环境变量是否设置
- 查看Worker实时日志

---

### 步骤2：检查环境变量

在Cloudflare Dashboard中：

1. **进入Worker设置**
   - Workers & Pages → `social-forum-a1` → Settings → Variables

2. **确认以下变量存在：**
   - ✅ AI_SECRET_KEY = `SocialApp_Secret_2025`
   - ✅ GEMINI_API_KEY = (你的Gemini密钥)
   - ✅ OPENAI_API_KEY = (你的OpenAI密钥)

3. **如果缺少任何变量：**
   - 点击 "Add variable"
   - 输入名称和值
   - 点击 "Save"

---

### 步骤3：验证API密钥

#### 测试Gemini API密钥

在浏览器或Postman中测试：

```
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=YOUR_GEMINI_KEY

Body:
{
  "contents": [{
    "parts": [{"text": "Say hello"}]
  }]
}
```

**如果返回错误：**
- API密钥无效
- API配额用完
- 需要启用Gemini API

#### 测试OpenAI API密钥

```
POST https://api.openai.com/v1/chat/completions

Headers:
Authorization: Bearer YOUR_OPENAI_KEY

Body:
{
  "model": "gpt-4o-mini",
  "messages": [{"role": "user", "content": "Say hello"}]
}
```

---

### 步骤4：使用简化Worker（只用Gemini）

如果测试Worker成功，使用简化版本：

1. **替换为 `cloudflare-worker-simple.js`**
   - 这个版本只使用Gemini（不用OpenAI）
   - 有详细的日志输出

2. **保存并部署**

3. **测试**
   ```powershell
   .\debug-worker.ps1
   ```

4. **查看Worker日志**
   - 在Cloudflare Dashboard中
   - Workers & Pages → `social-forum-a1` → Logs
   - 查看console.log输出

---

### 步骤5：使用完整Worker

如果简化版本成功，使用完整版本：

1. **替换为 `cloudflare-worker-fixed.js`**

2. **保存并部署**

3. **测试**
   ```powershell
   .\test-ai.ps1
   ```

---

## 🐛 常见问题

### 问题1：Worker返回500，无错误消息

**原因：**
- Worker代码有语法错误
- 环境变量未设置
- API调用失败但没有被catch

**解决：**
1. 使用测试Worker验证基础功能
2. 查看Worker实时日志
3. 逐步添加功能

### 问题2：Gemini API返回错误

**可能的错误：**
- `API key not valid` - 密钥无效
- `Quota exceeded` - 配额用完
- `API not enabled` - 需要启用API

**解决：**
1. 访问 https://makersuite.google.com/app/apikey
2. 创建新的API密钥
3. 确保启用了Gemini API
4. 更新Worker环境变量

### 问题3：OpenAI API返回错误

**可能的错误：**
- `Incorrect API key` - 密钥无效
- `You exceeded your current quota` - 配额用完
- `Rate limit exceeded` - 请求太频繁

**解决：**
1. 访问 https://platform.openai.com/api-keys
2. 检查API密钥
3. 检查账户余额
4. 更新Worker环境变量

---

## 📊 调试检查清单

- [ ] Worker测试代码可以运行
- [ ] 环境变量都已设置
- [ ] AI_SECRET_KEY匹配
- [ ] Gemini API密钥有效
- [ ] OpenAI API密钥有效（可选）
- [ ] Worker日志没有错误
- [ ] 简化Worker可以工作
- [ ] 完整Worker可以工作

---

## 🎯 推荐的调试顺序

1. **先用测试Worker** (`cloudflare-worker-test.js`)
   - 验证基础功能
   - 确认环境变量

2. **再用简化Worker** (`cloudflare-worker-simple.js`)
   - 只用Gemini
   - 有详细日志

3. **最后用完整Worker** (`cloudflare-worker-fixed.js`)
   - 同时用GPT和Gemini
   - Race机制

---

## 💡 快速修复建议

如果你只想快速让AI工作，最简单的方法：

1. **只用Gemini**（不用OpenAI）
2. **使用简化Worker代码**
3. **确保Gemini API密钥有效**

这样可以避免复杂的Race逻辑和多个API的问题。

---

**现在请按照步骤1开始调试！** 🚀
