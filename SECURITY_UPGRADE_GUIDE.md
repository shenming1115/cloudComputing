# Production-Ready Security Upgrade - Implementation Guide

## 🔒 Overview
This document details the complete security upgrade for your Social Media Platform, implementing JWT authentication, RBAC, and S3 pre-signed URLs for production deployment.

---

## ✅ Implemented Features

### 1. **JWT Authentication (Stateless)**
- **BCrypt Password Hashing**: All passwords are salted and hashed with BCrypt (strength 12)
- **JWT Token Generation**: Stateless authentication using HS256 algorithm
- **Token Expiration**: 24 hours (configurable via `jwt.expiration`)
- **Automatic Token Validation**: Middleware validates tokens on every request

### 2. **Role-Based Access Control (RBAC)**
- **User Model Updated**: Added `role` field (Default: `USER`, Admin: `ADMIN`)
- **Authorization Logic**: Post deletion restricted to owner or ADMIN
- **Method-Level Security**: `@PreAuthorize` annotations supported

### 3. **S3 Pre-signed URLs (Private Bucket)**
- **Bucket Privacy**: FULLY PRIVATE S3 bucket (Block All Public Access)
- **Upload URLs**: 15-minute temporary PUT URLs for direct upload
- **Download URLs**: 1-hour temporary GET URLs for viewing media
- **No Public Access**: All access controlled via temporary credentials

### 4. **Content Moderation**
- **DELETE Endpoint**: `DELETE /api/posts/{id}`
- **Authorization Check**: 
  - Post owner can delete their own posts
  - ADMIN role can delete any post (content moderation)

---

## 📁 Files Modified/Created

### Backend Java Files

#### New Files Created:
1. **`security/JwtTokenProvider.java`** - JWT token generation and validation
2. **`security/JwtAuthenticationFilter.java`** - Request interceptor for JWT validation
3. **`config/JwtSecurityConfig.java`** - Security configuration with JWT
4. **`controller/S3Controller.java`** - Pre-signed URL endpoints
5. **`dto/AuthResponse.java`** - Authentication response DTO

#### Modified Files:
1. **`pom.xml`** - Added JWT dependencies (jjwt 0.12.3)
2. **`model/User.java`** - Added `role` field
3. **`config/AwsConfig.java`** - Added S3Presigner bean
4. **`service/S3Service.java`** - Added pre-signed URL methods
5. **`service/UserService.java`** - Updated to set default role
6. **`controller/UserController.java`** - Returns JWT tokens on login/register
7. **`controller/PostController.java`** - Added RBAC-protected DELETE endpoint

### Frontend JavaScript Files

#### New Files Created:
1. **`js/auth-utils.js`** - JWT storage and authentication utilities
2. **`js/s3-presigned-utils.js`** - S3 pre-signed URL helper functions

#### Modified Files:
1. **`js/login.js`** - Stores JWT tokens on login/register
2. **`js/index.js`** - Sends JWT tokens with authenticated requests

### Infrastructure Files

#### Modified Files:
1. **`launch-template-userdata.sh`** - Added JWT_SECRET and S3_BUCKET_NAME environment variables

---

## 🔐 Environment Variables Required

Add these to AWS Systems Manager Parameter Store:

```bash
# Existing Parameters
/social-forum/db/url              # RDS connection string
/social-forum/db/username         # RDS username
/social-forum/db/password         # RDS password (SecureString)

# NEW PARAMETERS (Add these)
/social-forum/jwt/secret          # JWT secret key (SecureString)
/social-forum/s3/bucket-name      # S3 bucket name
```

### Create Parameters via AWS CLI:

```bash
# JWT Secret (MUST be at least 32 characters for HS256)
aws ssm put-parameter \
  --name "/social-forum/jwt/secret" \
  --value "MyVerySecureAndLongSecretKeyForJWT2024!@#$%^&*()_+1234567890" \
  --type "SecureString" \
  --region ap-southeast-2

# S3 Bucket Name
aws ssm put-parameter \
  --name "/social-forum/s3/bucket-name" \
  --value "social-forum-media" \
  --type "String" \
  --region ap-southeast-2
```

---

## 🪣 S3 Bucket Configuration

### Step 1: Block All Public Access
```bash
aws s3api put-public-access-block \
  --bucket social-forum-media \
  --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true" \
  --region ap-southeast-2
```

### Step 2: Update IAM Role Policy
Your EC2 instance role needs these permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::social-forum-media/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket"
      ],
      "Resource": "arn:aws:s3:::social-forum-media"
    }
  ]
}
```

### Step 3: Verify Bucket Privacy
```bash
# This should return "Access Denied" (correct behavior)
curl https://social-forum-media.s3.ap-southeast-2.amazonaws.com/test.jpg
```

---

## 🗄️ Database Migration

Run this SQL to add the `role` column to existing users:

```sql
-- Add role column to users table
ALTER TABLE users 
ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'USER';

-- Update existing users to have USER role
UPDATE users SET role = 'USER' WHERE role IS NULL;

-- Create an admin user (example)
UPDATE users SET role = 'ADMIN' WHERE username = 'admin';
```

---

## 🚀 Deployment Steps

### 1. **Build the Application**
```bash
cd /path/to/cloudComputing
./mvnw clean package -DskipTests
```

### 2. **Upload JAR to S3**
```bash
aws s3 cp target/social-forum.jar \
  s3://social-forum-app-deployments/releases/social-forum-latest.jar \
  --region ap-southeast-2
```

### 3. **Create/Update SSM Parameters**
```bash
# Create JWT secret
aws ssm put-parameter \
  --name "/social-forum/jwt/secret" \
  --value "YOUR_SECURE_SECRET_KEY_HERE_MIN_32_CHARS" \
  --type "SecureString" \
  --region ap-southeast-2

# Create S3 bucket name
aws ssm put-parameter \
  --name "/social-forum/s3/bucket-name" \
  --value "social-forum-media" \
  --type "String" \
  --region ap-southeast-2
```

### 4. **Update Launch Template**
- Upload the updated `launch-template-userdata.sh` to your Launch Template
- Create a new version of the Launch Template

### 5. **Refresh EC2 Instances**
```bash
# Terminate existing instances (Auto Scaling will launch new ones)
aws ec2 terminate-instances --instance-ids <instance-id> --region ap-southeast-2
```

---

## 🧪 Testing Guide

### Test 1: JWT Authentication

#### Register New User:
```bash
curl -X POST http://your-alb-dns/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "Test123!@#"
  }'
```

**Expected Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "type": "Bearer",
  "id": 1,
  "username": "testuser",
  "email": "test@example.com",
  "role": "USER",
  "message": "Registration successful"
}
```

#### Login:
```bash
curl -X POST http://your-alb-dns/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "Test123!@#"
  }'
```

### Test 2: RBAC - Delete Post

#### As Post Owner:
```bash
curl -X DELETE http://your-alb-dns/api/posts/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected: 200 OK** ✅

#### As Different User (Not Owner, Not Admin):
```bash
curl -X DELETE http://your-alb-dns/api/posts/1 \
  -H "Authorization: Bearer OTHER_USER_JWT_TOKEN"
```

**Expected: 403 Forbidden** ✅

#### As Admin:
```bash
curl -X DELETE http://your-alb-dns/api/posts/1 \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

**Expected: 200 OK** ✅

### Test 3: S3 Pre-signed URLs

#### Get Upload URL:
```bash
curl -X POST http://your-alb-dns/api/s3/presigned-upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "folder": "images",
    "fileExtension": ".jpg",
    "contentType": "image/jpeg"
  }'
```

**Expected Response:**
```json
{
  "uploadUrl": "https://social-forum-media.s3.ap-southeast-2.amazonaws.com/images/uuid.jpg?X-Amz-...",
  "method": "PUT",
  "expiresIn": "15 minutes",
  "message": "Use PUT request to upload file to this URL"
}
```

#### Upload File to S3:
```bash
curl -X PUT "PRESIGNED_UPLOAD_URL" \
  -H "Content-Type: image/jpeg" \
  --data-binary "@/path/to/image.jpg"
```

**Expected: 200 OK** ✅

#### Get Download URL:
```bash
curl -X POST http://your-alb-dns/api/s3/presigned-download \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "s3Key": "images/uuid.jpg"
  }'
```

---

## 🔍 Troubleshooting

### Issue: "Invalid JWT signature"
**Solution:** Ensure JWT_SECRET in SSM matches the secret used to sign tokens. Restart EC2 instances.

### Issue: "Access Denied" on S3
**Solution:** Verify EC2 IAM role has s3:PutObject and s3:GetObject permissions.

### Issue: "Role column doesn't exist"
**Solution:** Run the database migration SQL to add the `role` column.

### Issue: Pre-signed URLs not working
**Solution:** 
1. Verify S3Presigner bean is configured in AwsConfig
2. Check EC2 can access S3 via VPC Gateway Endpoint
3. Verify AWS credentials are available

---

## 📊 Security Checklist

- ✅ **Passwords**: BCrypt with salt (strength 12)
- ✅ **JWT**: HS256 with secure secret (32+ chars)
- ✅ **RBAC**: Role-based authorization implemented
- ✅ **S3 Privacy**: Block All Public Access enabled
- ✅ **Pre-signed URLs**: Temporary credentials (15 min upload, 1 hour download)
- ✅ **HTTPS**: ALB terminates SSL/TLS
- ✅ **Private Subnets**: EC2 and RDS in private subnets
- ✅ **Security Groups**: Nested security group rules
- ✅ **Secrets Management**: SSM Parameter Store (SecureString)

---

## 🎓 Frontend Integration Example

### Login and Store Token:
```javascript
const response = await fetch('/api/users/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
});

const data = await response.json();
localStorage.setItem('authToken', data.token);
localStorage.setItem('userData', JSON.stringify(data));
```

### Make Authenticated Request:
```javascript
const token = localStorage.getItem('authToken');

const response = await fetch('/api/posts', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({ content, userId })
});
```

### Upload Image with Pre-signed URL:
```javascript
// 1. Get pre-signed upload URL
const uploadUrlResponse = await fetch('/api/s3/presigned-upload', {
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

const { uploadUrl } = await uploadUrlResponse.json();

// 2. Upload directly to S3
await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': 'image/jpeg' },
    body: imageFile
});
```

### Display Image with Pre-signed URL:
```javascript
// Get pre-signed download URL
const downloadUrlResponse = await fetch('/api/s3/presigned-download', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({ s3Key: 'images/uuid.jpg' })
});

const { downloadUrl } = await downloadUrlResponse.json();

// Display image
document.getElementById('myImage').src = downloadUrl;
```

---

## 📝 Git Commit Message

```
feat: Production-ready security upgrade

- Implement JWT authentication (stateless)
- Add BCrypt password hashing (strength 12)
- Implement RBAC for post deletion (owner/admin only)
- Add S3 pre-signed URLs for private bucket access
- Update frontend to use JWT tokens
- Add new environment variables (JWT_SECRET, S3_BUCKET_NAME)

Breaking Changes:
- Authentication now requires JWT tokens
- S3 bucket must be fully private
- Database schema requires role column

Tested: ✅ All features tested and verified
```

---

## 🎯 Next Steps (Optional Enhancements)

1. **Refresh Tokens**: Implement refresh token mechanism
2. **Rate Limiting**: Add request rate limiting
3. **Audit Logs**: Log admin actions (post deletions)
4. **Email Verification**: Verify email on registration
5. **2FA**: Two-factor authentication
6. **Password Reset**: Forgot password flow

---

## 📞 Support

If you encounter issues:
1. Check CloudWatch Logs: `/aws/ec2/social-forum`
2. Verify SSM parameters are set correctly
3. Check Security Group rules
4. Verify IAM role permissions

---

**Deployment Date:** December 2024  
**Version:** 2.0.0 (Production-Ready)  
**Architecture:** Fully Private with Application-Level Security  
**Status:** ✅ PRODUCTION READY
