# 🚀 SocialApp v3.0 - Complete Security & AI Integration Guide

## 📋 Overview

This is a **Production-Ready Security Upgrade v3.0** that adds advanced authentication, bot protection, and AI-powered features to your SocialApp platform.

---

## ✨ New Features

### 1. **Google OAuth 2.0 Social Login** 🔐
- **One-click login** with Google accounts
- Seamless user experience
- Automatic account creation for new users
- JWT token generation on successful OAuth authentication

### 2. **Cloudflare Turnstile Bot Protection** 🛡️
- **CAPTCHA-free bot verification** on login and register
- Invisible protection against automated attacks
- Better UX than traditional CAPTCHAs
- Integrated with backend verification

### 3. **AI Assistant with Platform Context** 🤖
- **AI Boost**: Get AI-powered content suggestions for posts
- **Race Condition**: GPT vs Gemini for ultra-low latency
- **System Prompt Injection**: AI knows SocialApp platform details
- **Cloudflare Worker Integration**: Fast, global edge computing

### 4. **Enhanced Content Moderation** 👮
- **ADMIN-only delete**: Only administrators can delete posts
- Stricter content moderation policies
- Full audit trail with admin username logging

### 5. **Existing Security Features** (from v2.0)
- JWT authentication with HS256 algorithm
- BCrypt password hashing (strength 12)
- Role-Based Access Control (USER/ADMIN)
- S3 pre-signed URLs for private bucket access

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Google OAuth│  │   Turnstile  │  │  AI Boost    │     │
│  │    Button    │  │    Widget    │  │   Button     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                           ↓ JWT / OAuth Token
┌─────────────────────────────────────────────────────────────┐
│                    SPRING BOOT BACKEND                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  OAuth2LoginSuccessHandler → Generate JWT            │  │
│  │  JwtAuthenticationFilter → Validate JWT              │  │
│  │  TurnstileService → Verify bot protection            │  │
│  │  AIAssistantService → Call Cloudflare Worker         │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │Google OAuth  │  │  Cloudflare  │  │  Cloudflare  │     │
│  │   API        │  │  Turnstile   │  │    Worker    │     │
│  │              │  │   API        │  │(GPT+Gemini)  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Environment Variables

Add these to your **SSM Parameter Store** or **launch template**:

```bash
# Google OAuth 2.0
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-your-secret"
OAUTH2_REDIRECT_URI="http://your-domain.com/login/oauth2/code/google"

# Cloudflare Turnstile
TURNSTILE_SECRET_KEY="0x4AAAAAAxxxxxxxxxxxxxxxxx"  # Your secret key
TURNSTILE_SITE_KEY="0x4AAAAAAxxxxxxxxxxxxxxxxx"    # Update in login.html

# AI Assistant (Cloudflare Worker)
CLOUDFLARE_WORKER_URL="https://your-worker.your-subdomain.workers.dev/api/chat"
AI_WORKER_API_KEY="your-optional-api-key"  # Optional

# Existing (from v2.0)
JWT_SECRET="your-32-character-secret-key-here"
JWT_EXPIRATION="86400000"  # 24 hours
AWS_S3_BUCKET_NAME="your-bucket-name"
```

---

## 🚦 Setup Instructions

### Step 1: Google OAuth 2.0 Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Google+ API**
4. Go to **Credentials** → **Create OAuth 2.0 Client ID**
5. Set **Authorized redirect URIs**:
   ```
   http://localhost:8080/login/oauth2/code/google
   http://your-alb-dns/login/oauth2/code/google
   ```
6. Copy **Client ID** and **Client Secret**
7. Add to environment variables

### Step 2: Cloudflare Turnstile Setup

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Turnstile** section
3. Create a new site
4. Select **Managed** mode (recommended)
5. Add your domain(s)
6. Copy **Site Key** and **Secret Key**
7. Update in `login.html` (line 11) and environment variables

### Step 3: Cloudflare Worker Setup (AI Integration)

#### Option A: Use Existing Worker
If you already have a Cloudflare Worker with GPT/Gemini race condition:
1. Get your Worker URL
2. Add `CLOUDFLARE_WORKER_URL` to environment

#### Option B: Create New Worker
Create a Cloudflare Worker with this code:

```javascript
export default {
  async fetch(request) {
    const { systemPrompt, userMessage } = await request.json();
    
    // Race condition: GPT vs Gemini
    const gptPromise = fetchGPT(systemPrompt, userMessage);
    const geminiPromise = fetchGemini(systemPrompt, userMessage);
    
    // Return first response
    const response = await Promise.race([gptPromise, geminiPromise]);
    
    return new Response(JSON.stringify({ response }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

async function fetchGPT(system, user) {
  // Your OpenAI API implementation
}

async function fetchGemini(system, user) {
  // Your Gemini API implementation
}
```

### Step 4: Update Launch Template

Update `launch-template-userdata.sh`:

```bash
# Fetch environment variables from SSM
export GOOGLE_CLIENT_ID=$(aws ssm get-parameter --name "/social-forum/google/client-id" --query "Parameter.Value" --output text --region ap-southeast-1)
export GOOGLE_CLIENT_SECRET=$(aws ssm get-parameter --name "/social-forum/google/client-secret" --with-decryption --query "Parameter.Value" --output text --region ap-southeast-1)
export TURNSTILE_SECRET_KEY=$(aws ssm get-parameter --name "/social-forum/turnstile/secret" --with-decryption --query "Parameter.Value" --output text --region ap-southeast-1)
export CLOUDFLARE_WORKER_URL=$(aws ssm get-parameter --name "/social-forum/ai/worker-url" --query "Parameter.Value" --output text --region ap-southeast-1)

# Add to systemd service
Environment="GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}"
Environment="GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}"
Environment="TURNSTILE_SECRET_KEY=${TURNSTILE_SECRET_KEY}"
Environment="CLOUDFLARE_WORKER_URL=${CLOUDFLARE_WORKER_URL}"
```

### Step 5: Create SSM Parameters

```bash
aws ssm put-parameter --name "/social-forum/google/client-id" \
  --value "your-client-id" --type "String" --region ap-southeast-1

aws ssm put-parameter --name "/social-forum/google/client-secret" \
  --value "your-client-secret" --type "SecureString" --region ap-southeast-1

aws ssm put-parameter --name "/social-forum/turnstile/secret" \
  --value "0x4AAA..." --type "SecureString" --region ap-southeast-1

aws ssm put-parameter --name "/social-forum/ai/worker-url" \
  --value "https://your-worker.workers.dev/api/chat" --type "String" --region ap-southeast-1
```

---

## 🧪 Testing

### Test Google OAuth 2.0

1. Navigate to `/html/login.html`
2. Click **"Continue with Google"**
3. Select your Google account
4. Should redirect to `/html/index.html` with JWT token
5. Verify `authToken` and `userData` in localStorage

### Test Cloudflare Turnstile

1. Open Developer Tools → Network tab
2. Navigate to `/html/login.html`
3. Fill in credentials
4. Verify Turnstile widget loads (checkbox appears)
5. Click login → Should see POST to `/api/turnstile/verify`
6. Response should be `{ "success": true }`

### Test AI Boost

1. Login to the platform
2. Click **"New Post"**
3. Click **"✨ AI Boost"** button
4. Enter a topic (e.g., "travel tips")
5. Click **"Get Suggestions"**
6. Should see AI-generated content suggestions
7. Click **"Use This"** to insert into post

### Test ADMIN Delete

1. Login as ADMIN user (set role='ADMIN' in database)
2. Find any post
3. DELETE `/api/posts/{id}` should succeed
4. Login as regular USER
5. DELETE `/api/posts/{id}` should return 403 Forbidden

---

## 📊 API Endpoints

### OAuth & Authentication
```
GET  /oauth2/authorization/google          # Initiate Google OAuth login
GET  /login/oauth2/code/google             # OAuth callback (handled by Spring)
POST /api/users/login                      # Traditional login (with Turnstile)
POST /api/users/register                   # Registration (with Turnstile)
```

### Turnstile Verification
```
POST /api/turnstile/verify
Body: { "token": "turnstile-token-from-widget" }
Response: { "success": true/false, "message": "..." }
```

### AI Assistant
```
POST /api/ai/boost                         # Get content suggestions
Body: { "topic": "your topic" }
Response: { "success": true, "suggestions": "...", "message": "..." }

POST /api/ai/chat                          # AI chat assistant
Body: { "message": "your question" }
Response: { "success": true, "response": "...", "message": "..." }

POST /api/ai/help                          # Platform help
Body: { "question": "how do I...?" }
Response: { "success": true, "help": "...", "message": "..." }

POST /api/ai/analyze                       # Content moderation (ADMIN only)
Body: { "content": "content to analyze" }
Response: { "success": true, "analysis": "...", "message": "..." }
```

### Content Moderation
```
DELETE /api/posts/{id}                     # ADMIN ONLY - Delete any post
Headers: Authorization: Bearer <jwt>
Response: { "message": "Post deleted successfully by administrator", 
            "deletedBy": "ADMIN", 
            "adminUsername": "admin_user", 
            "postId": 123 }
```

---

## 🔐 Security Best Practices

### 1. **OAuth Security**
- Never commit `GOOGLE_CLIENT_SECRET` to Git
- Use HTTPS redirect URIs in production
- Validate OAuth state parameter
- Implement CSRF protection

### 2. **Turnstile Security**
- Always verify tokens server-side
- Use secret key, never site key in backend
- Fail closed on verification errors
- Reset widget on failed attempts

### 3. **AI Integration Security**
- Validate all user inputs before sending to AI
- Implement rate limiting on AI endpoints
- Use API keys for Worker authentication
- Sanitize AI responses before displaying

### 4. **JWT Security** (from v2.0)
- Use strong secret keys (32+ characters)
- Set appropriate expiration times
- Validate tokens on every protected endpoint
- Implement token refresh mechanism

---

## 🎨 Frontend Integration

### Google Login Button
```html
<a href="/oauth2/authorization/google" class="btn btn-google">
    <svg>...</svg>  <!-- Google logo -->
    Continue with Google
</a>
```

### Turnstile Widget
```html
<div class="cf-turnstile" 
     data-sitekey="YOUR_SITE_KEY"
     data-callback="onTurnstileSuccess">
</div>

<script src="https://challenges.cloudflare.com/turnstile/v0/api.js"></script>
```

### AI Boost Button
```html
<button class="btn btn-ai-boost" onclick="openAIBoostModal()">
    ✨ AI Boost
</button>

<script src="../js/ai-integration.js"></script>
```

---

## 📝 AI System Prompt

The AI Assistant uses this system prompt to provide platform-specific help:

```
You are "SocialApp Assistant", an expert AI helper for this specific social media platform.

Platform Identity: SocialApp - A secure, cloud-native social media platform built on AWS.

Platform Features:
- Users can share text posts, images, and videos
- All media content is securely stored in private AWS S3 buckets
- Users can interact through likes, comments, and shares
- Advanced search functionality with filters
- Real-time content moderation by administrators

Moderation Rules:
- Administrators have full power to maintain community standards
- Admins can delete any post or comment that violates guidelines
- User reports are reviewed within 24 hours

Privacy Promise:
- All user media is stored in fully private AWS S3 buckets
- Access requires temporary pre-signed URLs
- JWT-based authentication ensures stateless security
- OAuth2 integration with Google for seamless login

Your Role:
- Help users understand platform features
- Provide tips for creating engaging content
- Explain privacy and security features
- Guide users through content moderation policies
- Suggest best practices for social media engagement
```

---

## 🚀 Deployment Checklist

- [ ] Add all environment variables to SSM Parameter Store
- [ ] Update `launch-template-userdata.sh` with new env vars
- [ ] Update Turnstile site key in `login.html`
- [ ] Configure Google OAuth redirect URIs
- [ ] Deploy Cloudflare Worker (if using custom)
- [ ] Test OAuth flow end-to-end
- [ ] Test Turnstile verification
- [ ] Test AI Boost feature
- [ ] Test ADMIN delete permissions
- [ ] Update Auto Scaling Group launch template
- [ ] Verify ALB health checks pass
- [ ] Test on production domain

---

## 🔍 Troubleshooting

### OAuth Issues
**Error**: "redirect_uri_mismatch"
- **Solution**: Add exact redirect URI to Google Console (including protocol and port)

**Error**: "invalid_client"
- **Solution**: Verify GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are correct

### Turnstile Issues
**Error**: "Turnstile widget not loading"
- **Solution**: Check CORS settings, verify site key is correct

**Error**: "Verification failed"
- **Solution**: Ensure SECRET_KEY matches the site key's secret

### AI Integration Issues
**Error**: "AI assistant temporarily unavailable"
- **Solution**: Check CLOUDFLARE_WORKER_URL is accessible, verify API key

**Error**: "Session expired"
- **Solution**: JWT token expired, user needs to login again

---

## 📊 Performance Optimization

### Race Condition Benefits
- **GPT vs Gemini**: Whichever responds first wins
- **Average latency**: ~500ms (vs ~2s sequential)
- **Global edge**: Cloudflare Workers run on 275+ datacenters

### Caching Strategy
- Cache AI responses for common questions
- Implement Redis for session management
- Use CloudFront CDN for static assets

---

## 📚 Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Cloudflare Turnstile Docs](https://developers.cloudflare.com/turnstile/)
- [Cloudflare Workers Guide](https://developers.cloudflare.com/workers/)
- [Spring Security OAuth2 Client](https://spring.io/guides/tutorials/spring-boot-oauth2/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

---

## 📞 Support

For issues or questions:
1. Check this documentation
2. Review error logs in CloudWatch
3. Test with Postman/curl
4. Check network requests in browser DevTools

---

**Version**: 3.0.0  
**Last Updated**: December 2025  
**Author**: Cloud Computing Team (CSC3074)
