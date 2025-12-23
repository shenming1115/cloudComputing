# Quick Deployment Guide - Refactored Version 4.0

## Pre-Deployment Checklist

- [x] All code issues fixed
- [x] Application builds successfully (70.65 MB JAR)
- [x] Admin user initializer added
- [x] JWT environment variable handling fixed
- [x] Null user filtering implemented
- [x] Frontend role badges added

## Deploy to AWS (Option 1: Manual)

### 1. Upload JAR to S3
```powershell
aws s3 cp target/social-forum.jar s3://social-forum-artifacts/social-forum.jar --region ap-southeast-2
```

### 2. Update Launch Template User Data

Ensure these environment variables are correctly set:
```bash
# JWT Configuration (CRITICAL - must match across all instances)
JWT_SECRET=$(aws ssm get-parameter --name "/social-forum/jwt/secret" --with-decryption --region ap-southeast-2 --query 'Parameter.Value' --output text)
JWT_EXPIRATION="86400000"

# Database (verify username is "admin" not "admin123")
DB_URL="jdbc:mysql://social-forum-db-mysql.cbii4gykc5p0.ap-southeast-2.rds.amazonaws.com:3306/social_forum"
DB_USERNAME="admin"
DB_PASSWORD=$(aws ssm get-parameter --name "/social-forum/db/password" --with-decryption --region ap-southeast-2 --query 'Parameter.Value' --output text)
```

### 3. Create New Launch Template Version
```bash
aws ec2 create-launch-template-version \
  --launch-template-name social-forum-lt \
  --version-description "v4.0-refactored-with-fixes" \
  --source-version 1 \
  --region ap-southeast-2
```

### 4. Update Auto Scaling Group
```bash
aws autoscaling update-auto-scaling-group \
  --auto-scaling-group-name social-forum-asg \
  --launch-template LaunchTemplateName=social-forum-lt,Version='$Latest' \
  --region ap-southeast-2
```

### 5. Trigger Instance Refresh
```bash
aws autoscaling start-instance-refresh \
  --auto-scaling-group-name social-forum-asg \
  --preferences MinHealthyPercentage=50 \
  --region ap-southeast-2
```

## Deploy to AWS (Option 2: Quick Replace)

### If you just want to replace instances quickly:

```bash
# Terminate existing instances (ASG will create new ones)
aws autoscaling set-desired-capacity \
  --auto-scaling-group-name social-forum-asg \
  --desired-capacity 0 \
  --region ap-southeast-2

# Wait 30 seconds
Start-Sleep -Seconds 30

# Scale back up
aws autoscaling set-desired-capacity \
  --auto-scaling-group-name social-forum-asg \
  --desired-capacity 2 \
  --region ap-southeast-2
```

## Post-Deployment Verification

### 1. Check ALB Health
```bash
aws elbv2 describe-target-health \
  --target-group-arn arn:aws:elasticloadbalancing:ap-southeast-2:YOUR_ACCOUNT:targetgroup/social-forum-tg/XXX \
  --region ap-southeast-2
```

Expected: All targets showing `"State": "healthy"`

### 2. Test Health Endpoint
```powershell
$ALB_URL = "social-forum-alb-2143116826.ap-southeast-2.elb.amazonaws.com"
Invoke-RestMethod -Uri "http://$ALB_URL/actuator/health"
```

Expected: `{"status":"UP","components":{"db":{"status":"UP"}}}`

### 3. Test Admin Login
```powershell
$response = Invoke-RestMethod -Uri "http://$ALB_URL/api/users/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"username":"admin123","password":"pxTUxZPBBmgk3XD"}'

$response | ConvertTo-Json
```

Expected output should include:
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "user": {
    "username": "admin123",
    "role": "ADMIN"
  }
}
```

### 4. Test Posts Endpoint
```powershell
Invoke-RestMethod -Uri "http://$ALB_URL/api/posts"
```

Expected: Array of posts (no 500 errors)

### 5. Test Search Endpoint
```powershell
Invoke-RestMethod -Uri "http://$ALB_URL/api/search?query=test&type=all"
```

Expected: Search results with user roles (no 500 errors)

### 6. Check Application Logs
```bash
# SSH into EC2 instance
ssh -i your-key.pem ec2-user@<instance-ip>

# View startup logs
sudo journalctl -u social-forum -n 100 --no-pager | grep -A 5 "ADMIN USER"
```

Expected output:
```
========================================
ADMIN USER CREATED SUCCESSFULLY
Username: admin123
Password: pxTUxZPBBmgk3XD
Role: ADMIN
========================================
```

## Rollback Plan

If deployment fails:

### 1. Check what went wrong
```bash
# SSH into instance
ssh -i your-key.pem ec2-user@<instance-ip>

# Check service status
sudo systemctl status social-forum

# View last 100 logs
sudo journalctl -u social-forum -n 100 --no-pager
```

### 2. Revert Launch Template
```bash
# List versions
aws ec2 describe-launch-template-versions \
  --launch-template-name social-forum-lt \
  --region ap-southeast-2

# Set back to previous version (e.g., version 1)
aws autoscaling update-auto-scaling-group \
  --auto-scaling-group-name social-forum-asg \
  --launch-template LaunchTemplateName=social-forum-lt,Version='1' \
  --region ap-southeast-2

# Trigger instance refresh
aws autoscaling start-instance-refresh \
  --auto-scaling-group-name social-forum-asg \
  --region ap-southeast-2
```

### 3. Restore previous JAR
```bash
# Upload old JAR back to S3
aws s3 cp target/social-forum.jar.backup s3://social-forum-artifacts/social-forum.jar --region ap-southeast-2
```

## Common Issues & Solutions

### Issue 1: Instances still unhealthy after 5 minutes

**Check:**
```bash
ssh -i your-key.pem ec2-user@<instance-ip>
sudo journalctl -u social-forum -f
```

**Common causes:**
- Database connection error → Check DB_USERNAME is "admin" not "admin123"
- JWT_SECRET not set → Check SSM parameter exists
- Port 8080 not listening → Check Java process with `sudo netstat -tulpn | grep 8080`

### Issue 2: Still getting 401 errors

**Check:**
```bash
# Verify JWT_SECRET is same across all instances
curl -H "Authorization: Bearer <token>" http://localhost:8080/api/posts
```

**Solution:** Ensure all instances read from same SSM parameter

### Issue 3: Posts still returning 500

**Check database:**
```sql
-- Count orphaned posts
SELECT COUNT(*) FROM posts p 
LEFT JOIN app_users u ON p.user_id = u.id 
WHERE u.id IS NULL;
```

**Solution:** Clean orphaned posts:
```sql
DELETE FROM posts WHERE user_id NOT IN (SELECT id FROM app_users);
```

### Issue 4: Admin user not created

**Check logs:**
```bash
sudo journalctl -u social-forum -n 200 | grep -i admin
```

**Manual creation:**
```sql
INSERT INTO app_users (username, email, password, role, bio, created_at)
VALUES (
  'admin123',
  'admin@socialforum.com',
  '$2a$12$HASHED_PASSWORD', -- BCrypt hash of pxTUxZPBBmgk3XD
  'ADMIN',
  'System Administrator',
  NOW()
);
```

## Success Verification

Run all these commands and verify outputs:

```powershell
# 1. Health check
curl http://social-forum-alb-2143116826.ap-southeast-2.elb.amazonaws.com/actuator/health

# 2. Login test
curl -X POST http://social-forum-alb-2143116826.ap-southeast-2.elb.amazonaws.com/api/users/login `
  -H "Content-Type: application/json" `
  -d '{"username":"admin123","password":"pxTUxZPBBmgk3XD"}'

# 3. Posts test
curl http://social-forum-alb-2143116826.ap-southeast-2.elb.amazonaws.com/api/posts

# 4. Search test
curl "http://social-forum-alb-2143116826.ap-southeast-2.elb.amazonaws.com/api/search?query=test"
```

**If all return 200 OK with valid JSON → DEPLOYMENT SUCCESSFUL ✅**

## Database Cleanup (Recommended)

Before deployment, clean orphaned data:

```sql
-- 1. Find orphaned posts
SELECT p.id, p.content, p.user_id, p.created_at
FROM posts p
LEFT JOIN app_users u ON p.user_id = u.id
WHERE u.id IS NULL;

-- 2. Delete orphaned posts (BE CAREFUL!)
DELETE FROM posts 
WHERE user_id NOT IN (SELECT id FROM app_users);

-- 3. Verify no orphaned posts remain
SELECT COUNT(*) as orphaned_count
FROM posts p
LEFT JOIN app_users u ON p.user_id = u.id
WHERE u.id IS NULL;
-- Should return 0
```

## Environment Variables Reference

These MUST be set in EC2 environment:

```bash
# Required
SPRING_PROFILES_ACTIVE=prod
SERVER_PORT=8080

# Database
SPRING_DATASOURCE_URL=jdbc:mysql://your-rds-endpoint:3306/social_forum
SPRING_DATASOURCE_USERNAME=admin
SPRING_DATASOURCE_PASSWORD=<from SSM>
SPRING_DATASOURCE_DRIVER_CLASS_NAME=com.mysql.cj.jdbc.Driver

# JWT (CRITICAL)
JWT_SECRET=<from SSM - must be same across all instances>
JWT_EXPIRATION=86400000

# AWS
AWS_S3_BUCKET_NAME=social-forum-media
AWS_REGION=ap-southeast-2
CLOUDFRONT_DOMAIN=<your-cloudfront-domain>

# AI Worker (if using)
AI_WORKER_URL=<your-worker-url>
AI_SECRET_KEY=<from SSM>
```

## Final Notes

- **Build Version:** 4.0
- **JAR Size:** 70.65 MB
- **Build Date:** December 23, 2025 12:12:18
- **Java Version:** 17
- **Spring Boot:** 3.2.0
- **Changes:** 38 source files compiled (1 new file: AdminUserInitializer.java)

**Status: READY FOR PRODUCTION DEPLOYMENT** 🚀
