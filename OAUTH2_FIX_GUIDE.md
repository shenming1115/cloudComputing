# 🔧 OAuth2 Redirect URI Fix Guide

## 🎯 Problem Summary
Your application is sending the **old ALB address** to Google OAuth:
- ❌ Old (hardcoded): `http://social-forum-app-alb-1649766638.ap-southeast-2.elb.amazonaws.com`
- ✅ Current ALB: `http://social-forum-alb-2143116826.ap-southeast-2.elb.amazonaws.com`

## 🔍 Root Cause
The OAuth2 environment variables (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `OAUTH2_REDIRECT_URI`) were **missing** from the EC2 instance environment, causing the app to use default/cached values.

## ✅ Solution Applied
Updated `launch-template-userdata.sh` to fetch and inject OAuth2 credentials from AWS SSM Parameter Store.

---

## 📋 Step-by-Step Fix Instructions

### Step 1: Store OAuth2 Credentials in SSM Parameter Store

Run these commands in your AWS environment:

```bash
# Store Google Client ID
aws ssm put-parameter \
  --name "/social-forum/oauth2/google-client-id" \
  --value "YOUR_GOOGLE_CLIENT_ID" \
  --type "String" \
  --region ap-southeast-2 \
  --overwrite

# Store Google Client Secret (encrypted)
aws ssm put-parameter \
  --name "/social-forum/oauth2/google-client-secret" \
  --value "YOUR_GOOGLE_CLIENT_SECRET" \
  --type "SecureString" \
  --region ap-southeast-2 \
  --overwrite

# Store OAuth2 Redirect URI (NEW ALB)
aws ssm put-parameter \
  --name "/social-forum/oauth2/redirect-uri" \
  --value "http://social-forum-alb-2143116826.ap-southeast-2.elb.amazonaws.com/login/oauth2/code/google" \
  --type "String" \
  --region ap-southeast-2 \
  --overwrite
```

**🔑 Replace `YOUR_GOOGLE_CLIENT_ID` and `YOUR_GOOGLE_CLIENT_SECRET` with your actual Google OAuth credentials.**

---

### Step 2: Update IAM Role Permissions

Ensure your EC2 instance profile has permission to read these SSM parameters:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ssm:GetParameter",
        "ssm:GetParameters"
      ],
      "Resource": [
        "arn:aws:ssm:ap-southeast-2:*:parameter/social-forum/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "kms:Decrypt"
      ],
      "Resource": "*"
    }
  ]
}
```

---

### Step 3: Update Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Select your OAuth 2.0 Client ID
3. Under **Authorized redirect URIs**, add:
   ```
   http://social-forum-alb-2143116826.ap-southeast-2.elb.amazonaws.com/login/oauth2/code/google
   ```
4. **Remove** the old URI:
   ```
   http://social-forum-app-alb-1649766638.ap-southeast-2.elb.amazonaws.com/login/oauth2/code/google
   ```
5. Click **Save**

---

### Step 4: Deploy Updated Launch Template

```bash
# Navigate to your project directory
cd "C:\Users\User\Desktop\CS Y2S2\cloud\cloudComputing"

# Create a new launch template version
aws ec2 create-launch-template-version \
  --launch-template-name social-forum-launch-template \
  --source-version '$Latest' \
  --launch-template-data file://launch-template-config.json \
  --region ap-southeast-2

# Update Auto Scaling Group to use the new version
aws autoscaling update-auto-scaling-group \
  --auto-scaling-group-name social-forum-asg \
  --launch-template LaunchTemplateName=social-forum-launch-template,Version='$Latest' \
  --region ap-southeast-2
```

---

### Step 5: Replace EC2 Instances

**Option A: Terminate old instances (Quick)**
```bash
# Get instance IDs
aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=social-forum-instance" \
  --query "Reservations[*].Instances[*].InstanceId" \
  --output text \
  --region ap-southeast-2

# Terminate them (ASG will launch new ones with updated config)
aws ec2 terminate-instances \
  --instance-ids i-xxxxx i-yyyyy \
  --region ap-southeast-2
```

**Option B: Instance Refresh (Gradual)**
```bash
aws autoscaling start-instance-refresh \
  --auto-scaling-group-name social-forum-asg \
  --preferences MinHealthyPercentage=50,InstanceWarmup=300 \
  --region ap-southeast-2
```

---

### Step 6: Verify the Fix

1. **Check SSM Parameters:**
   ```bash
   aws ssm get-parameter --name "/social-forum/oauth2/redirect-uri" --query "Parameter.Value" --output text --region ap-southeast-2
   ```
   Should output: `http://social-forum-alb-2143116826.ap-southeast-2.elb.amazonaws.com/login/oauth2/code/google`

2. **Check EC2 Instance Logs:**
   ```bash
   # SSH into the new instance
   sudo journalctl -u social-forum -f
   ```
   Look for log entries showing the OAuth2 configuration being loaded.

3. **Test OAuth Login:**
   - Open: `http://social-forum-alb-2143116826.ap-southeast-2.elb.amazonaws.com/html/login.html`
   - Click **"Continue with Google"**
   - Should redirect to Google WITHOUT the `redirect_uri_mismatch` error

---

## 🔍 How the Fix Works

### Before (Broken)
```
EC2 Instance → Missing OAUTH2_REDIRECT_URI env var
            → OAuth2Config.java uses default: "http://localhost:8080/..."
            → OR cached old value: "http://...1649766638..."
            → Google rejects with redirect_uri_mismatch
```

### After (Fixed)
```
EC2 Instance → Fetches from SSM: "/social-forum/oauth2/redirect-uri"
            → Sets environment variable: OAUTH2_REDIRECT_URI
            → OAuth2Config.java reads: System.getenv("OAUTH2_REDIRECT_URI")
            → Returns correct ALB: "http://...2143116826..."
            → Google accepts and redirects successfully ✅
```

---

## 🧪 Testing Checklist

- [ ] SSM parameters created and verified
- [ ] IAM role has SSM read permissions
- [ ] Google Console updated with new redirect URI
- [ ] Launch template updated with new user data script
- [ ] EC2 instances replaced/refreshed
- [ ] Application logs show correct OAuth2 configuration
- [ ] OAuth login flow completes without errors
- [ ] Users can log in with Google successfully

---

## 🚨 Common Issues

### Issue: "Parameter not found"
**Cause:** SSM parameter doesn't exist or wrong region  
**Fix:** Double-check parameter names and ensure region is `ap-southeast-2`

### Issue: Still getting old redirect URI
**Cause:** Old EC2 instances still running  
**Fix:** Terminate all old instances to force new ones with updated config

### Issue: "Access Denied" when fetching SSM parameters
**Cause:** EC2 instance role missing SSM permissions  
**Fix:** Update IAM role with SSM read policy (see Step 2)

---

## 📞 Need Help?

If the issue persists after following all steps:
1. Check CloudWatch Logs for the application
2. Verify environment variables on the running EC2 instance:
   ```bash
   sudo systemctl show social-forum | grep Environment
   ```
3. Test parameter retrieval manually:
   ```bash
   aws ssm get-parameter --name "/social-forum/oauth2/redirect-uri" --region ap-southeast-2
   ```
