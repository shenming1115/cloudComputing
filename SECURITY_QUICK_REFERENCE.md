# 🔐 Production Security - Quick Reference

## 🎯 What Changed?

| Component | Before | After |
|-----------|--------|-------|
| **Authentication** | Basic Auth | JWT (Stateless) |
| **Password Storage** | Plain/Basic | BCrypt (Strength 12) |
| **Authorization** | None | RBAC (USER/ADMIN) |
| **S3 Access** | Public URLs | Pre-signed URLs (Private) |
| **Session Management** | Server-side | Stateless Tokens |

---

## 📋 New API Endpoints

### Authentication
```
POST /api/users/register  → Returns JWT token
POST /api/users/login     → Returns JWT token
```

### S3 Pre-signed URLs
```
POST /api/s3/presigned-upload    → Get upload URL (15 min)
POST /api/s3/presigned-download  → Get download URL (1 hour)
POST /api/s3/convert-to-presigned → Convert S3 URL to pre-signed
```

### Content Moderation
```
DELETE /api/posts/{id}  → Delete post (Owner or ADMIN only)
```

---

## 🔑 Authentication Flow

### Frontend (Login):
```javascript
// Login
const res = await fetch('/api/users/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
});

const { token, id, username, role } = await res.json();

// Store token
localStorage.setItem('authToken', token);
localStorage.setItem('userData', JSON.stringify({ id, username, role }));
```

### Frontend (Authenticated Request):
```javascript
const token = localStorage.getItem('authToken');

const res = await fetch('/api/posts', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({ content, userId })
});
```

---

## 🪣 S3 Pre-signed URL Flow

### Upload Image:
```javascript
// 1. Get pre-signed URL
const res = await fetch('/api/s3/presigned-upload', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        folder: 'images',
        fileExtension: '.jpg',
        contentType: 'image/jpeg'
    })
});

const { uploadUrl } = await res.json();

// 2. Upload to S3 (No auth needed - URL contains credentials)
await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': 'image/jpeg' },
    body: imageFile
});

// 3. Extract S3 key from URL and save to database
const s3Key = new URL(uploadUrl).pathname.substring(1);
```

### Display Image:
```javascript
// 1. Get pre-signed download URL
const res = await fetch('/api/s3/presigned-download', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({ s3Key: 'images/uuid.jpg' })
});

const { downloadUrl } = await res.json();

// 2. Display image
document.getElementById('img').src = downloadUrl;
```

---

## 🛡️ RBAC Authorization

### Delete Post Logic:
```java
// Get current user from JWT
User currentUser = (User) authentication.getPrincipal();

// Get post
Post post = postService.getPostById(id);

// Check authorization
boolean isOwner = post.getUser().getId().equals(currentUser.getId());
boolean isAdmin = currentUser.getRole().equals("ADMIN");

if (!isOwner && !isAdmin) {
    return 403 Forbidden; // Access denied
}

// Delete post
postService.deletePost(id);
return 200 OK;
```

---

## 🔧 Environment Variables

### SSM Parameter Store:
```bash
/social-forum/db/url              # RDS endpoint
/social-forum/db/username         # RDS username
/social-forum/db/password         # RDS password (SecureString)
/social-forum/jwt/secret          # JWT secret (SecureString, 32+ chars)
/social-forum/s3/bucket-name      # S3 bucket name
```

### EC2 Environment Variables (systemd):
```bash
DB_URL=${DB_URL}
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
JWT_SECRET=${JWT_SECRET}
AWS_S3_BUCKET_NAME=${S3_BUCKET_NAME}
AWS_REGION=ap-southeast-2
JWT_EXPIRATION=86400000  # 24 hours
```

---

## 🗄️ Database Schema Change

```sql
-- Add role column
ALTER TABLE users 
ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'USER';

-- Make someone an admin
UPDATE users SET role = 'ADMIN' WHERE username = 'admin';
```

---

## 🧪 Quick Test Commands

### Register:
```bash
curl -X POST http://your-alb/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@x.com","password":"Test123!@#"}'
```

### Login:
```bash
curl -X POST http://your-alb/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"Test123!@#"}'
```

### Create Post (Authenticated):
```bash
curl -X POST http://your-alb/api/posts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":"Test post","userId":1}'
```

### Delete Post (Owner/Admin):
```bash
curl -X DELETE http://your-alb/api/posts/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## ⚠️ Common Issues

### Issue: Invalid JWT signature
**Fix:** Restart EC2 instances after updating JWT_SECRET

### Issue: 401 Unauthorized
**Fix:** Token expired (24h). Login again to get new token

### Issue: S3 Access Denied
**Fix:** Verify EC2 IAM role has s3:PutObject and s3:GetObject

### Issue: Role column doesn't exist
**Fix:** Run `database-migration-v2.sql`

---

## ✅ Deployment Checklist

- [ ] Update pom.xml dependencies
- [ ] Create SSM parameters (JWT_SECRET, S3_BUCKET_NAME)
- [ ] Run database migration SQL
- [ ] Set S3 bucket to "Block All Public Access"
- [ ] Update IAM role with S3 permissions
- [ ] Update Launch Template user data
- [ ] Build and upload new JAR to S3
- [ ] Terminate old EC2 instances
- [ ] Test authentication and authorization
- [ ] Test S3 pre-signed URLs
- [ ] Verify RBAC works correctly

---

## 📞 Security Verification

```powershell
# Run full test suite
.\test-security-upgrade.ps1 -BaseUrl "http://your-alb-dns"
```

Expected: All tests pass ✅

---

## 🎓 Key Concepts

- **JWT**: Stateless authentication token (no server-side sessions)
- **BCrypt**: Salted password hashing algorithm
- **RBAC**: Role-Based Access Control (USER/ADMIN)
- **Pre-signed URLs**: Temporary AWS credentials in URL
- **Private S3**: No public access, all via pre-signed URLs

---

**Last Updated:** December 2024  
**Version:** 2.0.0 Production-Ready  
**Status:** ✅ LIVE
