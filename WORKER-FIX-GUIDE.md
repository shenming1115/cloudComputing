# 🔧 Cloudflare Worker 修复指南

## 🔍 问题原因

你的Worker代码和Java后端的请求/响应格式不匹配：

### 问题1：请求格式不匹配
**Worker期望：**
```javascript
{ "prompt": "..." }
```

**Java发送：**
```javascript
{
  "systemPrompt": "You are SocialApp Assistant...",
  "userMessage": "Hello",
  "context": { "username": "testuser" }
}
```

### 问题2：响应格式不匹配
**Worker返回：**
```javascript
{ "result": "AI response here" }
```

**Java期望：**
```javascript
{ "response": "AI response here" }
```

---

## ✅ 解决方案

### 方案1：修改Worker代码（推荐）

将你的Worker代码替换为 `cloudflare-worker-fixed.js` 中的代码。

**主要改动：**

1. **请求解析** - 从 `prompt` 改为 `systemPrompt` 和 `userMessage`：
```javascript
// 之前
const { prompt } = await request.json();

// 现在
const { systemPrompt, userMessage, context } = await request.json();
const fullPrompt = systemPrompt 
  ? `${systemPrompt}\n\nUser: ${userMessage}` 
  : userMessage;
```

2. **响应格式** - 从 `result` 改为 `response`：
```javascript
// 之前
return new Response(JSON.stringify({ result }), {...});

// 现在
return new Response(JSON.stringify({ response: result }), {...});
```

---

## 🚀 部署步骤

### 1. 登录Cloudflare Dashboard
访问：https://dash.cloudflare.com/

### 2. 进入Workers & Pages
点击左侧菜单的 "Workers & Pages"

### 3. 找到你的Worker
找到 `social-forum-a1` worker

### 4. 编辑代码
点击 "Edit Code" 或 "Quick Edit"

### 5. 替换代码
将整个代码替换为 `cloudflare-worker-fixed.js` 的内容

### 6. 保存并部署
点击 "Save and Deploy"

---

## 🧪 测试

部署后，重新运行测试：

```powershell
.\test-ai.ps1
```

**预期结果：**
```
========================================
  AI Assistant Test
========================================

1. Register/Login Test User...
   ✓ Login successful

2. Testing AI Assistant...

Question: Hello, please introduce yourself briefly
✓ AI Response:
Hello! I'm SocialApp Assistant, your friendly AI helper...

Question: What can you do?
✓ AI Response:
I can help you with various features of SocialApp...

Question: What is Spring Boot?
✓ AI Response:
Spring Boot is a Java framework that simplifies...

Question: Tell me a joke
✓ AI Response:
Why do programmers prefer dark mode? Because light attracts bugs!

========================================
Success: 4 / 4
Failed: 0 / 4
========================================
```

---

## 📋 完整的修改对比

### 修改1：请求解析
```javascript
// ❌ 旧代码
const { prompt } = await request.json();

// ✅ 新代码
const { systemPrompt, userMessage, context } = await request.json();
const fullPrompt = systemPrompt 
  ? `${systemPrompt}\n\nUser: ${userMessage}` 
  : userMessage;
```

### 修改2：使用fullPrompt
```javascript
// ❌ 旧代码
body: JSON.stringify({ 
  model: "gpt-4o-mini", 
  messages: [{ role: "user", content: prompt }]  // 使用 prompt
})

// ✅ 新代码
body: JSON.stringify({ 
  model: "gpt-4o-mini", 
  messages: [{ role: "user", content: fullPrompt }]  // 使用 fullPrompt
})
```

### 修改3：响应格式
```javascript
// ❌ 旧代码
return new Response(JSON.stringify({ result }), {
  headers: { "Content-Type": "application/json" }
});

// ✅ 新代码
return new Response(JSON.stringify({ response: result }), {
  headers: { "Content-Type": "application/json" }
});
```

---

## 🔑 环境变量检查

确保Worker中配置了以下环境变量：

1. **AI_SECRET_KEY** = `SocialApp_Secret_2025`
2. **OPENAI_API_KEY** = 你的OpenAI API密钥
3. **GEMINI_API_KEY** = 你的Gemini API密钥

在Cloudflare Dashboard中：
1. 进入你的Worker
2. 点击 "Settings" → "Variables"
3. 添加/检查这些环境变量

---

## ✅ 验证清单

部署后验证：

- [ ] Worker代码已更新
- [ ] 环境变量已配置
- [ ] Worker已保存并部署
- [ ] 运行 `.\test-ai.ps1` 测试通过
- [ ] AI返回真实的回复（不是 "temporarily unavailable"）

---

## 🐛 故障排除

### 如果还是返回 "temporarily unavailable"

1. **检查Worker日志**
   - 在Cloudflare Dashboard中查看Worker的实时日志
   - 看是否有错误信息

2. **检查API密钥**
   - 确保OPENAI_API_KEY和GEMINI_API_KEY有效
   - 确保API有配额

3. **测试Worker直接访问**
   ```powershell
   # 在浏览器或Postman中测试
   POST https://social-forum-a1.shenming0387.workers.dev/
   Headers: X-AI-Secret: SocialApp_Secret_2025
   Body: {
     "systemPrompt": "You are a helpful assistant",
     "userMessage": "Hello"
   }
   ```

---

**总结：** 修改Worker代码后，AI助手应该可以正常工作了！
