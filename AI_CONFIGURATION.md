# AI Chat Configuration Guide

## Overview
The SocialApp AI Assistant uses Cloudflare Workers AI to provide multilingual chat support in **English, Chinese, Malay, and Spanish**. The AI automatically detects the user's language and responds accordingly.

---

## Current Status
❌ **Not Configured** - AI endpoints return 401 Unauthorized

The application code is ready, but external Cloudflare Worker configuration is required.

---

## Features

### Multilingual Support
The AI Assistant supports:
- ✅ **English** - Native support
- ✅ **中文 (Chinese)** - Full conversation support
- ✅ **Bahasa Melayu (Malay)** - Full conversation support  
- ✅ **Español (Spanish)** - Full conversation support
- ✅ **Auto-detection** - Responds in the same language as the user

### AI Capabilities
1. **Content Boost** (`/api/ai/boost`)
   - Generate post content suggestions
   - Topic-based content generation
   - Engagement optimization tips

2. **Chat Assistant** (`/api/ai/chat`)
   - Platform help and guidance
   - Feature explanations
   - Best practices suggestions
   - Privacy and security Q&A

3. **Content Analysis** (`/api/ai/analyze`)
   - Sentiment analysis
   - Moderation recommendations
   - Engagement prediction

4. **Platform Help** (`/api/ai/help`)
   - User onboarding assistance
   - Troubleshooting guidance
   - Feature discovery

---

## Configuration Steps

### 1. Deploy Cloudflare Worker

Create a Cloudflare Worker with GPT/Gemini race logic:

```javascript
// worker.js
export default {
  async fetch(request, env) {
    // Race condition between GPT-4 and Gemini Pro
    const { systemPrompt, userMessage, context } = await request.json();
    
    // Implement race logic here
    const [gptResponse, geminiResponse] = await Promise.race([
      callOpenAI(systemPrompt, userMessage, env.OPENAI_KEY),
      callGemini(systemPrompt, userMessage, env.GEMINI_KEY)
    ]);
    
    return new Response(JSON.stringify({
      response: gptResponse || geminiResponse,
      provider: gptResponse ? "openai" : "gemini"
    }), {
      headers: { "Content-Type": "application/json" }
    });
  }
};

async function callOpenAI(system, user, apiKey) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user }
      ]
    })
  });
  
  const data = await response.json();
  return data.choices[0].message.content;
}

async function callGemini(system, user, apiKey) {
  // Similar implementation for Gemini
  // ...
}
```

### 2. Set Environment Variables

#### Local Development (.env)
```bash
AI_WORKER_URL=https://your-worker.your-subdomain.workers.dev/
AI_SECRET_KEY=your-custom-secret-key-for-auth
```

#### AWS EC2 (Launch Template User Data)
```bash
#!/bin/bash
AI_WORKER_URL=$(aws ssm get-parameter --name "/social-forum/ai/worker-url" --region ap-southeast-2 --query 'Parameter.Value' --output text)
AI_SECRET_KEY=$(aws ssm get-parameter --name "/social-forum/ai/secret-key" --with-decryption --region ap-southeast-2 --query 'Parameter.Value' --output text)

cat >> /etc/systemd/system/social-forum.service << EOF
Environment="AI_WORKER_URL=${AI_WORKER_URL}"
Environment="AI_SECRET_KEY=${AI_SECRET_KEY}"
EOF
```

#### AWS Systems Manager Parameter Store
```bash
# Store Worker URL
aws ssm put-parameter \
  --name "/social-forum/ai/worker-url" \
  --value "https://social-forum-ai.your-subdomain.workers.dev/" \
  --type "String" \
  --region ap-southeast-2

# Store Secret Key
aws ssm put-parameter \
  --name "/social-forum/ai/secret-key" \
  --value "your-256-bit-secret-key" \
  --type "SecureString" \
  --region ap-southeast-2
```

### 3. Update Application Configuration

The application automatically reads environment variables on startup:

```java
// AIAssistantService.java (already implemented)
public AIAssistantService() {
    this.workerUrl = System.getenv().getOrDefault("AI_WORKER_URL", 
        "https://social-forum-a1.shenming0387.workers.dev/");
    this.apiKey = System.getenv("AI_SECRET_KEY");
}
```

### 4. Verify Configuration

Test AI endpoints after deployment:

```bash
# Test AI Boost (Content Suggestions)
curl -X POST http://localhost:8080/api/ai/boost \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"topic": "cloud computing benefits"}'

# Test AI Chat - English
curl -X POST http://localhost:8080/api/ai/chat \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello! Can you help me?"}'

# Test AI Chat - Chinese
curl -X POST http://localhost:8080/api/ai/chat \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "你好！你能帮我吗？"}'

# Test AI Chat - Spanish
curl -X POST http://localhost:8080/api/ai/chat \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "¡Hola! ¿Puedes ayudarme?"}'
```

---

## System Prompt

The AI is pre-configured with platform context:

```text
You are "SocialApp Assistant", an expert AI helper for this specific social media platform.

Language Capabilities:
- You are fluent in English, Chinese (华文), and Malay (Bahasa Melayu).
- Always reply in the same language as the user's message unless requested otherwise.
- If the user asks to switch languages, do so immediately.

Platform Identity: SocialApp - A secure, cloud-native social media platform built on AWS.

Platform Features:
- Users can share text posts, images, and videos
- All media content is securely stored in private AWS S3 buckets
- Users can interact through likes, comments, and shares
- Advanced search functionality with filters
- Real-time content moderation by administrators

Privacy Promise:
- All user media (images/videos) is stored in fully private AWS S3 buckets
- Access to media files requires temporary pre-signed URLs
- No public access to any user data without proper authentication
- JWT-based authentication ensures stateless security

Security Features:
- BCrypt password hashing with salt (strength 12)
- JWT tokens with HS256 algorithm (24-hour expiration)
- Role-Based Access Control (USER/ADMIN roles)
- S3 pre-signed URLs for private bucket access
```

---

## Frontend Integration

### AI Chat Widget
The floating AI chat button is already integrated in [index.html](../html/index.html):

```html
<!-- AI Chat Widget loaded via ai-chat.js -->
<script src="../js/ai-chat.js"></script>
```

### Usage Flow
1. User clicks 🤖 button in bottom-right corner
2. Chat window opens with welcome message
3. User types message in any language
4. AI responds in the same language
5. Conversation history maintained in session

### AI Boost Feature
- Available in "Create Post" modal
- Click "✨ AI Boost" button
- Enter topic/idea
- Get AI-generated content suggestions
- Click "Use This" to insert into post

---

## Cost Optimization

### Cloudflare Worker Race Strategy
The worker uses a **race condition** between OpenAI GPT-4 and Google Gemini Pro:

**Benefits:**
- ⚡ **Lower latency** - First response wins
- 💰 **Cost efficient** - Only pay for winning response
- 🛡️ **Fallback** - If one fails, use the other
- 🌍 **Global edge** - Cloudflare's worldwide network

**Implementation:**
```javascript
const responses = await Promise.race([
  callGPT4(prompt),     // ~2-3s avg
  callGemini(prompt)    // ~1-2s avg
]);

// Gemini typically wins due to speed
// GPT-4 provides higher quality when Gemini is slow
```

---

## Troubleshooting

### Error: 401 Unauthorized
**Cause:** AI_WORKER_URL or AI_SECRET_KEY not set
**Solution:** Configure environment variables and restart application

### Error: 500 Internal Server Error
**Cause:** Cloudflare Worker not responding or returned error
**Solution:** Check worker logs in Cloudflare dashboard

### AI responds in wrong language
**Cause:** System prompt not properly injected
**Solution:** Verify worker receives `systemPrompt` parameter

### Slow response time (>5s)
**Cause:** Both GPT and Gemini are slow, or worker timeout
**Solution:** 
- Increase worker timeout to 30s
- Optimize system prompt (shorter = faster)
- Use Cloudflare caching for common queries

---

## Example Conversations

### English
```
User: "How do I delete a post?"
AI: "To delete a post:
1. Click the ... menu on your post
2. Select 'Delete'
3. Confirm deletion
Note: Only ADMIN users can delete any post. Regular users can only delete their own posts."
```

### Chinese
```
User: "我如何删除帖子？"
AI: "删除帖子的步骤：
1. 点击帖子上的 ... 菜单
2. 选择"删除"
3. 确认删除
注意：只有管理员可以删除任何帖子。普通用户只能删除自己的帖子。"
```

### Spanish
```
User: "¿Cómo elimino una publicación?"
AI: "Para eliminar una publicación:
1. Haz clic en el menú ... de tu publicación
2. Selecciona 'Eliminar'
3. Confirma la eliminación
Nota: Solo los usuarios ADMIN pueden eliminar cualquier publicación. Los usuarios regulares solo pueden eliminar sus propias publicaciones."
```

---

## Security Considerations

1. **Authentication Required**
   - All `/api/ai/**` endpoints require valid JWT token
   - Prevents unauthorized API usage and abuse

2. **Rate Limiting** (Recommended)
   - Implement in Cloudflare Worker
   - Limit: 20 requests per minute per user
   - Prevents spam and cost overruns

3. **Input Validation**
   - Max message length: 1000 characters
   - Content filtering for offensive language
   - SQL injection prevention (already handled by Spring)

4. **API Key Protection**
   - Store in AWS SSM Parameter Store (SecureString)
   - Never commit to Git
   - Rotate every 90 days

---

## Deployment Checklist

Before deploying to production:

- [ ] Deploy Cloudflare Worker with race logic
- [ ] Test worker with curl/Postman
- [ ] Store AI_WORKER_URL in AWS SSM
- [ ] Store AI_SECRET_KEY in AWS SSM (encrypted)
- [ ] Update Launch Template with environment variables
- [ ] Rebuild JAR with updated configuration
- [ ] Upload JAR to S3
- [ ] Trigger Auto Scaling Group refresh
- [ ] Test all 4 languages (EN, ZH, MS, ES)
- [ ] Verify authentication works
- [ ] Monitor Cloudflare worker logs
- [ ] Set up cost alerts ($10/month threshold)

---

## Cost Estimates

**Cloudflare Workers:**
- Free tier: 100,000 requests/day
- Paid: $5/10M requests

**OpenAI GPT-4:**
- $0.03 per 1K input tokens
- $0.06 per 1K output tokens
- Avg cost per request: $0.002-0.005

**Google Gemini Pro:**
- Free tier: 60 requests/minute
- Paid: $0.00025 per 1K characters

**Expected Monthly Cost (1000 users):**
- Cloudflare: $0 (within free tier)
- AI API: $10-30 (depending on usage)
- **Total: ~$15/month**

---

## References

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- [Google AI Studio](https://ai.google.dev/)
- [AWS Systems Manager Parameter Store](https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-parameter-store.html)

---

**Last Updated:** December 23, 2025  
**Status:** Configuration Pending  
**Priority:** Medium (Feature Enhancement)
