# SocialApp - Production-Ready Social Forum Platform

> **Version**: 3.0  
> **Platform**: Spring Boot 3.2.0 + Java 17  
> **Cloud**: AWS (EC2, RDS MySQL, S3, CloudFront, ALB)  
> **Security**: JWT, BCrypt, Google OAuth 2.0, Cloudflare Turnstile  
> **AI**: Cloudflare Workers AI Integration

---

## 📑 Table of Contents

1. [Overview](#-overview)
2. [Architecture](#-architecture)
3. [Features](#-features)
4. [Technology Stack](#-technology-stack)
5. [Prerequisites](#-prerequisites)
6. [Configuration](#-configuration)
7. [Local Development](#-local-development)
8. [Testing](#-testing)
9. [Deployment](#-deployment)
10. [API Documentation](#-api-documentation)
11. [Security](#-security)
12. [Troubleshooting](#-troubleshooting)

---

## 🎯 Overview

SocialApp is an enterprise-grade social forum platform designed for cloud-native deployment on AWS. It provides secure authentication, real-time interactions, AI-powered content suggestions, and media management capabilities.

### Key Highlights
- **Zero-trust Security**: JWT-based stateless authentication with BCrypt password hashing (strength 12)
- **OAuth Integration**: Seamless Google social login with automatic user provisioning
- **Bot Protection**: Cloudflare Turnstile integration on all authentication endpoints
- **AI Assistant**: Cloudflare Workers AI for content suggestions and analysis
- **Media Management**: S3 pre-signed URLs with CloudFront CDN acceleration
- **RBAC**: Role-based access control with USER and ADMIN permissions
- **High Availability**: Auto Scaling Groups, Application Load Balancer, Multi-AZ RDS

---

## 🏗 Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Internet Users                           │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────────────┐
        │   Application Load Balancer (ALB)      │
        │   - Health Checks                      │
        │   - SSL/TLS Termination                │
        └────────────┬───────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
         ▼                       ▼
┌──────────────────┐    ┌──────────────────┐
│  EC2 Instance 1  │    │  EC2 Instance 2  │
│  Auto Scaling    │    │  Auto Scaling    │
│  - Spring Boot   │    │  - Spring Boot   │
│  - Java 17       │    │  - Java 17       │
│  - Systemd       │    │  - Systemd       │
└────────┬─────────┘    └────────┬─────────┘
         │                       │
         └───────────┬───────────┘
                     │
         ┌───────────┴───────────────────────────────┐
         │                                           │
         ▼                                           ▼
┌──────────────────────┐                  ┌──────────────────┐
│   RDS MySQL          │                  │   AWS S3         │
│   Multi-AZ           │                  │   Media Storage  │
│   - Users            │                  │   + CloudFront   │
│   - Posts            │                  └──────────────────┘
│   - Comments         │
│   - Likes            │
└──────────────────────┘

External Integrations:
├─ Google OAuth 2.0 (accounts.google.com)
├─ Cloudflare Turnstile (bot protection)
└─ Cloudflare Workers AI (content assistance)
```

### Component Communication Flow

1. **User Request** → ALB (Port 80/443)
2. **ALB** → EC2 Instances (Port 8080, Health Check: /actuator/health)
3. **EC2** → RDS MySQL (Port 3306, connection pool)
4. **EC2** → S3 (Pre-signed URLs for media upload/download)
5. **CloudFront** → S3 (CDN for media delivery)
6. **EC2** → Cloudflare Workers (AI API calls with custom header auth)
7. **Browser** → Google OAuth (social login flow)
8. **Browser** → Cloudflare Turnstile (bot verification)

---

## ✨ Features

### Core Features
- ✅ **User Authentication**
  - Email/Username + Password (BCrypt hashed)
  - Google OAuth 2.0 social login
  - JWT token-based sessions (24-hour expiration)
  - Cloudflare Turnstile bot protection

- ✅ **Post Management**
  - Create, read, update, delete (CRUD) operations
  - Rich text content support
  - Image and video uploads via S3
  - Share functionality with unique tokens
  - Like/Unlike with real-time counter

- ✅ **Comment System**
  - Nested comments on posts
  - Real-time comment count
  - User attribution with avatars

- ✅ **AI Integration**
  - Content boost suggestions
  - Post analysis
  - Interactive chat assistance
  - Context-aware recommendations

- ✅ **Admin Panel**
  - Role-based delete permissions
  - User management capabilities
  - Content moderation tools

- ✅ **Media Management**
  - S3 pre-signed upload URLs
  - CloudFront CDN distribution
  - Automatic thumbnail generation
  - Secure temporary access

### Security Features
- 🔐 BCrypt password hashing (strength 12, auto-salted)
- 🔑 JWT authentication (HS256, 64-character secret)
- 🛡️ RBAC with USER/ADMIN roles
- 🤖 Cloudflare Turnstile on login/register
- 🔒 CORS configuration
- 🚫 CSRF protection
- 📝 Request logging and audit trails

---

## 🛠 Technology Stack

### Backend
- **Framework**: Spring Boot 3.2.0
- **Language**: Java 17 (Amazon Corretto)
- **Database**: MySQL 8.0 (AWS RDS Multi-AZ)
- **ORM**: Hibernate 6.3.1 with JPA
- **Connection Pool**: HikariCP
- **Build Tool**: Maven 3.9.x
- **Server**: Embedded Tomcat 10.1.16

### Security & Authentication
- **Spring Security**: 6.2.0
- **JWT**: jjwt 0.12.3
- **OAuth2**: Google OAuth 2.0 Client
- **Password**: BCrypt (strength 12)
- **Bot Protection**: Cloudflare Turnstile

### Cloud Services (AWS)
- **Compute**: EC2 t2.micro (Auto Scaling)
- **Database**: RDS MySQL Multi-AZ
- **Storage**: S3 (media + artifacts)
- **CDN**: CloudFront
- **Load Balancer**: Application Load Balancer
- **Secrets**: Systems Manager Parameter Store
- **IAM**: Role-based access control

### External Integrations
- **AI**: Cloudflare Workers AI
- **OAuth**: Google Identity Platform
- **Bot Protection**: Cloudflare Turnstile
- **CDN**: CloudFront

### Frontend
- **HTML5**: Semantic markup
- **CSS3**: Custom styling with global design system
- **JavaScript**: Vanilla ES6+
- **No Framework**: Pure JavaScript for simplicity

---

## 📋 Prerequisites

### Development Environment
- **Java**: OpenJDK 17+ or Amazon Corretto 17
- **Maven**: 3.8+ (or use included Maven Wrapper)
- **IDE**: IntelliJ IDEA, Eclipse, or VS Code
- **Database**: MySQL 8.0+ or H2 (for testing)

### AWS Requirements
- **AWS CLI**: Configured with appropriate credentials
- **AWS Account**: With EC2, RDS, S3 permissions
- **Key Pair**: For EC2 SSH access
- **VPC**: Default or custom with public/private subnets

### External Services
- **Google Cloud Console**: OAuth 2.0 credentials
- **Cloudflare Account**: Turnstile site key and secret
- **Cloudflare Workers**: AI worker deployed

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file or set these system environment variables:

```bash
# Database Configuration
SPRING_DATASOURCE_URL=jdbc:mysql://localhost:3306/social_forum
SPRING_DATASOURCE_USERNAME=your_db_user
SPRING_DATASOURCE_PASSWORD=your_db_password

# JWT Configuration
JWT_SECRET=your-super-secure-64-character-secret-key-for-production-use
JWT_EXPIRATION=86400000

# Google OAuth 2.0
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
OAUTH2_REDIRECT_URI=http://localhost:8080/login/oauth2/code/google

# Cloudflare Turnstile
TURNSTILE_SECRET_KEY=your-turnstile-secret-key

# AI Worker
AI_WORKER_URL=https://your-worker.your-subdomain.workers.dev/
AI_SECRET_KEY=your-custom-ai-secret

# AWS S3
AWS_S3_BUCKET_NAME=your-s3-bucket-name
AWS_REGION=ap-southeast-2
CLOUDFRONT_DOMAIN=your-cloudfront-domain.cloudfront.net

# Application
SPRING_PROFILES_ACTIVE=dev
SERVER_PORT=8080
```

### Application Profiles

#### `application.yml` (Default)
```yaml
spring:
  application:
    name: social-forum
  profiles:
    active: ${SPRING_PROFILES_ACTIVE:dev}
```

#### `application-dev.yml` (Development)
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/social_forum
    username: root
    password: password
  jpa:
    show-sql: true
    hibernate:
      ddl-auto: update
```

#### `application-test.yml` (Testing)
```yaml
spring:
  datasource:
    url: jdbc:h2:mem:testdb;MODE=MySQL
    driver-class-name: org.h2.Driver
  jpa:
    hibernate:
      ddl-auto: create-drop
  h2:
    console:
      enabled: true
```

#### `application-prod.yml` (Production)
```yaml
spring:
  datasource:
    url: ${SPRING_DATASOURCE_URL}
    username: ${SPRING_DATASOURCE_USERNAME}
    password: ${SPRING_DATASOURCE_PASSWORD}
  jpa:
    show-sql: false
    hibernate:
      ddl-auto: validate
```

### AWS SSM Parameter Store Setup

Store sensitive configuration in AWS Systems Manager:

```bash
# JWT Secret
aws ssm put-parameter \
  --name "/social-forum/jwt/secret" \
  --value "your-64-character-secret-key" \
  --type "SecureString" \
  --region ap-southeast-2

# Google OAuth
aws ssm put-parameter \
  --name "/social-forum/google/client-id" \
  --value "your-client-id.apps.googleusercontent.com" \
  --type "String" \
  --region ap-southeast-2

aws ssm put-parameter \
  --name "/social-forum/google/client-secret" \
  --value "your-client-secret" \
  --type "SecureString" \
  --region ap-southeast-2

# Cloudflare Turnstile
aws ssm put-parameter \
  --name "/social-forum/turnstile/secret" \
  --value "your-turnstile-secret" \
  --type "SecureString" \
  --region ap-southeast-2

# AI Worker
aws ssm put-parameter \
  --name "/social-forum/ai/worker-url" \
  --value "https://your-worker.workers.dev/" \
  --type "String" \
  --region ap-southeast-2

aws ssm put-parameter \
  --name "/social-forum/ai/secret-key" \
  --value "your-ai-secret" \
  --type "SecureString" \
  --region ap-southeast-2

# S3 Configuration
aws ssm put-parameter \
  --name "/social-forum/s3/bucket-name" \
  --value "your-bucket-name" \
  --type "String" \
  --region ap-southeast-2

aws ssm put-parameter \
  --name "/social-forum/cloudfront/domain" \
  --value "your-distribution.cloudfront.net" \
  --type "String" \
  --region ap-southeast-2
```

---

## 💻 Local Development

### 1. Clone Repository
```bash
git clone <repository-url>
cd cloudComputing
```

### 2. Configure Database
```bash
# Start MySQL (local or Docker)
docker run --name mysql-dev \
  -e MYSQL_ROOT_PASSWORD=password \
  -e MYSQL_DATABASE=social_forum \
  -p 3306:3306 \
  -d mysql:8.0

# Or use H2 in-memory database (set SPRING_PROFILES_ACTIVE=test)
```

### 3. Set Environment Variables
```bash
# Windows PowerShell
$env:SPRING_PROFILES_ACTIVE="dev"
$env:JWT_SECRET="your-secret-key-minimum-32-characters"
$env:GOOGLE_CLIENT_ID="your-client-id"
$env:GOOGLE_CLIENT_SECRET="your-client-secret"

# Linux/Mac
export SPRING_PROFILES_ACTIVE=dev
export JWT_SECRET=your-secret-key-minimum-32-characters
export GOOGLE_CLIENT_ID=your-client-id
export GOOGLE_CLIENT_SECRET=your-client-secret
```

### 4. Build Application
```bash
# Using Maven Wrapper (recommended)
./mvnw clean package -DskipTests

# Using installed Maven
mvn clean package -DskipTests
```

### 5. Run Application
```bash
# Using Maven
./mvnw spring-boot:run

# Using JAR
java -jar target/social-forum.jar

# With specific profile
java -jar target/social-forum.jar --spring.profiles.active=dev
```

### 6. Access Application
- **Main Page**: http://localhost:8080/html/login.html
- **Health Check**: http://localhost:8080/actuator/health
- **H2 Console** (test profile): http://localhost:8080/h2-console

---

## 🧪 Testing

### Manual API Testing

#### 1. Register New User
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "Test@1234"
  }'

# Response:
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "role": "USER"
  }
}
```

#### 2. Login
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "Test@1234"
  }'
```

#### 3. Create Post (Requires JWT)
```bash
curl -X POST http://localhost:8080/api/posts \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "My first post! #CloudComputing"
  }'
```

#### 4. Get All Posts
```bash
curl -X GET http://localhost:8080/api/posts \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 5. AI Content Boost
```bash
curl -X POST http://localhost:8080/api/ai/boost \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "technology",
    "context": "Write about cloud computing benefits"
  }'
```

### Browser Testing

1. **Open**: http://localhost:8080/html/login.html
2. **Register**: Create a new account
3. **Google OAuth**: Click "Continue with Google"
4. **Create Post**: Write and publish content
5. **AI Boost**: Click "✨ AI Boost" button
6. **Admin Functions**: Login as admin to see delete buttons

### Health Check
```bash
# Check application health
curl http://localhost:8080/actuator/health

# Expected response:
{
  "status": "UP",
  "components": {
    "db": {"status": "UP"}
  }
}
```

---

## 🚀 Deployment

### AWS Infrastructure Setup

#### 1. Create S3 Bucket
```bash
# Create artifacts bucket
aws s3 mb s3://social-forum-artifacts --region ap-southeast-2

# Create media bucket
aws s3 mb s3://social-forum-media --region ap-southeast-2

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket social-forum-artifacts \
  --versioning-configuration Status=Enabled
```

#### 2. Upload JAR to S3
```bash
# Build application
./mvnw clean package -DskipTests

# Upload to S3
aws s3 cp target/social-forum.jar \
  s3://social-forum-artifacts/social-forum.jar \
  --region ap-southeast-2
```

#### 3. Create IAM Role for EC2
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject"
      ],
      "Resource": "arn:aws:s3:::social-forum-artifacts/*"
    },
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
        "ssm:GetParameter",
        "ssm:GetParameters"
      ],
      "Resource": "arn:aws:ssm:ap-southeast-2:*:parameter/social-forum/*"
    }
  ]
}
```

#### 4. Create RDS MySQL Instance
```bash
aws rds create-db-instance \
  --db-instance-identifier social-forum-db \
  --db-instance-class db.t3.micro \
  --engine mysql \
  --engine-version 8.0 \
  --master-username admin \
  --master-user-password YourSecurePassword \
  --allocated-storage 20 \
  --multi-az \
  --publicly-accessible false \
  --vpc-security-group-ids sg-xxxxxxxx \
  --db-subnet-group-name your-db-subnet-group \
  --region ap-southeast-2
```

#### 5. Create Launch Template

**User Data Script** (`launch-template-userdata.sh`):

```bash
#!/bin/bash
set -e

exec > >(tee /var/log/social-forum-setup.log) 2>&1

yum update -y
yum install -y java-17-amazon-corretto-headless awscli jq

mkdir -p /opt/social-forum
cd /opt/social-forum

aws s3 cp s3://social-forum-artifacts/social-forum.jar /opt/social-forum/app.jar --region ap-southeast-2

if [ ! -f "/opt/social-forum/app.jar" ]; then
    exit 1
fi

JWT_SECRET=$(aws ssm get-parameter --name "/social-forum/jwt/secret" --with-decryption --region ap-southeast-2 --query 'Parameter.Value' --output text 2>/dev/null || echo "default-secret")
JWT_EXPIRATION="86400000"

DB_URL="jdbc:mysql://your-rds-endpoint:3306/social_forum"
DB_USERNAME="admin"
DB_PASSWORD="YourSecurePassword"

GOOGLE_CLIENT_ID=$(aws ssm get-parameter --name "/social-forum/google/client-id" --region ap-southeast-2 --query 'Parameter.Value' --output text 2>/dev/null || echo "default-client-id")
GOOGLE_CLIENT_SECRET=$(aws ssm get-parameter --name "/social-forum/google/client-secret" --with-decryption --region ap-southeast-2 --query 'Parameter.Value' --output text 2>/dev/null || echo "default-secret")
OAUTH2_REDIRECT_URI="http://your-alb-url/login/oauth2/code/google"

TURNSTILE_SECRET=$(aws ssm get-parameter --name "/social-forum/turnstile/secret" --with-decryption --region ap-southeast-2 --query 'Parameter.Value' --output text 2>/dev/null || echo "default-turnstile")

AI_WORKER_URL=$(aws ssm get-parameter --name "/social-forum/ai/worker-url" --region ap-southeast-2 --query 'Parameter.Value' --output text 2>/dev/null || echo "https://default-worker.workers.dev/")
AI_SECRET_KEY=$(aws ssm get-parameter --name "/social-forum/ai/secret-key" --with-decryption --region ap-southeast-2 --query 'Parameter.Value' --output text 2>/dev/null || echo "default-ai-secret")

S3_BUCKET_NAME=$(aws ssm get-parameter --name "/social-forum/s3/bucket-name" --region ap-southeast-2 --query 'Parameter.Value' --output text 2>/dev/null || echo "social-forum-media")
AWS_REGION="ap-southeast-2"

CLOUDFRONT_DOMAIN=$(aws ssm get-parameter --name "/social-forum/cloudfront/domain" --region ap-southeast-2 --query 'Parameter.Value' --output text 2>/dev/null || echo "default.cloudfront.net")

cat > /etc/systemd/system/social-forum.service << EOF
[Unit]
Description=Social Forum Application v3.0
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/opt/social-forum

Environment="SPRING_PROFILES_ACTIVE=prod"
Environment="SERVER_PORT=8080"

Environment="SPRING_DATASOURCE_URL=${DB_URL}"
Environment="SPRING_DATASOURCE_USERNAME=${DB_USERNAME}"
Environment="SPRING_DATASOURCE_PASSWORD=${DB_PASSWORD}"
Environment="SPRING_DATASOURCE_DRIVER_CLASS_NAME=com.mysql.cj.jdbc.Driver"
Environment="SPRING_JPA_HIBERNATE_DDL_AUTO=update"
Environment="SPRING_JPA_SHOW_SQL=false"
Environment="SPRING_JPA_PROPERTIES_HIBERNATE_DIALECT=org.hibernate.dialect.MySQLDialect"

Environment="JWT_SECRET=${JWT_SECRET}"
Environment="JWT_EXPIRATION=${JWT_EXPIRATION}"

Environment="GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}"
Environment="GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}"
Environment="OAUTH2_REDIRECT_URI=${OAUTH2_REDIRECT_URI}"

Environment="TURNSTILE_SECRET_KEY=${TURNSTILE_SECRET}"

Environment="AI_WORKER_URL=${AI_WORKER_URL}"
Environment="AI_SECRET_KEY=${AI_SECRET_KEY}"

Environment="AWS_S3_BUCKET_NAME=${S3_BUCKET_NAME}"
Environment="AWS_REGION=${AWS_REGION}"
Environment="CLOUDFRONT_DOMAIN=${CLOUDFRONT_DOMAIN}"

Environment="MANAGEMENT_ENDPOINTS_WEB_EXPOSURE_INCLUDE=health,info"
Environment="MANAGEMENT_ENDPOINT_HEALTH_SHOW_DETAILS=when-authorized"
Environment="MANAGEMENT_ENDPOINTS_WEB_BASE_PATH=/actuator"

ExecStart=/usr/bin/java \
    -Xms512m \
    -Xmx1024m \
    -XX:+UseG1GC \
    -XX:MaxGCPauseMillis=200 \
    -Djava.security.egd=file:/dev/./urandom \
    -jar /opt/social-forum/app.jar

Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
EOF

chown -R ec2-user:ec2-user /opt/social-forum
chmod 644 /etc/systemd/system/social-forum.service

systemctl daemon-reload
systemctl enable social-forum
systemctl start social-forum

MAX_WAIT=180
WAIT_COUNT=0
HEALTH_URL="http://localhost:8080/actuator/health"

while [ $WAIT_COUNT -lt $MAX_WAIT ]; do
    if ! systemctl is-active --quiet social-forum; then
        systemctl status social-forum
        journalctl -u social-forum -n 50
        exit 1
    fi
    
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL 2>/dev/null || echo "000")
    
    if [ "$HTTP_CODE" = "200" ]; then
        HEALTH_STATUS=$(curl -s $HEALTH_URL 2>/dev/null || echo "")
        
        if echo "$HEALTH_STATUS" | grep -q '"status":"UP"'; then
            exit 0
        fi
    fi
    
    sleep 3
    WAIT_COUNT=$((WAIT_COUNT + 3))
done

systemctl status social-forum --no-pager
journalctl -u social-forum -n 100 --no-pager

exit 1
```

#### 6. Create Application Load Balancer

```bash
# Create ALB
aws elbv2 create-load-balancer \
  --name social-forum-alb \
  --subnets subnet-xxxxx subnet-yyyyy \
  --security-groups sg-xxxxxxxx \
  --scheme internet-facing \
  --type application \
  --region ap-southeast-2

# Create Target Group
aws elbv2 create-target-group \
  --name social-forum-tg \
  --protocol HTTP \
  --port 8080 \
  --vpc-id vpc-xxxxxxxx \
  --health-check-enabled \
  --health-check-path /actuator/health \
  --health-check-interval-seconds 30 \
  --health-check-timeout-seconds 5 \
  --healthy-threshold-count 2 \
  --unhealthy-threshold-count 3 \
  --region ap-southeast-2

# Create Listener
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:... \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:...
```

#### 7. Create Auto Scaling Group

```bash
# Create Launch Template
aws ec2 create-launch-template \
  --launch-template-name social-forum-lt \
  --version-description "v3.0" \
  --launch-template-data '{
    "ImageId": "ami-xxxxxxxx",
    "InstanceType": "t2.micro",
    "IamInstanceProfile": {"Name": "social-forum-ec2-role"},
    "SecurityGroupIds": ["sg-xxxxxxxx"],
    "UserData": "'$(base64 -w 0 launch-template-userdata.sh)'"
  }' \
  --region ap-southeast-2

# Create Auto Scaling Group
aws autoscaling create-auto-scaling-group \
  --auto-scaling-group-name social-forum-asg \
  --launch-template LaunchTemplateName=social-forum-lt,Version='$Latest' \
  --min-size 1 \
  --max-size 3 \
  --desired-capacity 2 \
  --target-group-arns arn:aws:elasticloadbalancing:... \
  --health-check-type ELB \
  --health-check-grace-period 300 \
  --vpc-zone-identifier "subnet-xxxxx,subnet-yyyyy" \
  --region ap-southeast-2
```

### Deployment Checklist

- [ ] Build JAR file (`./mvnw clean package -DskipTests`)
- [ ] Upload JAR to S3 artifacts bucket
- [ ] Create/Update SSM parameters with secrets
- [ ] Verify RDS database is running and accessible
- [ ] Update OAuth redirect URI in Google Console
- [ ] Update Turnstile site key in frontend HTML
- [ ] Create Launch Template with User Data script
- [ ] Configure Auto Scaling Group with target capacity
- [ ] Configure ALB health checks
- [ ] Update security group rules
- [ ] Test application health endpoint
- [ ] Verify database connectivity
- [ ] Test Google OAuth flow
- [ ] Test AI Worker integration
- [ ] Monitor CloudWatch logs

---

## 📚 API Documentation

### Authentication Endpoints

#### POST `/api/auth/register`
Register a new user account.

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePass@123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "role": "USER",
    "createdAt": "2025-12-22T10:30:00"
  }
}
```

#### POST `/api/auth/login`
Login with username/email and password.

**Request Body:**
```json
{
  "username": "john_doe",
  "password": "SecurePass@123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "user": { ... }
}
```

#### GET `/oauth2/authorization/google`
Redirect to Google OAuth login page.

**Flow:**
1. Redirects to Google consent screen
2. User authorizes application
3. Google redirects to `/login/oauth2/code/google?code=...`
4. Backend generates JWT and redirects to `/html/index.html?token=...`

### Post Endpoints

#### GET `/api/posts`
Retrieve all posts (requires authentication).

**Headers:**
```
Authorization: Bearer {jwt_token}
```

**Response:**
```json
[
  {
    "id": 1,
    "content": "My first post!",
    "imageUrl": "https://cloudfront.net/image.jpg",
    "mediaType": "IMAGE",
    "userId": 1,
    "username": "john_doe",
    "likeCount": 5,
    "commentCount": 3,
    "shareCount": 1,
    "createdAt": "2025-12-22T10:30:00"
  }
]
```

#### POST `/api/posts`
Create a new post.

**Headers:**
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "content": "Check out my new project! #CloudComputing",
  "imageUrl": "https://cloudfront.net/my-image.jpg",
  "mediaType": "IMAGE"
}
```

#### DELETE `/api/posts/{id}`
Delete a post (ADMIN only).

**Headers:**
```
Authorization: Bearer {admin_jwt_token}
```

**Response:**
```json
{
  "success": true,
  "message": "Post deleted successfully"
}
```

### AI Assistant Endpoints

#### POST `/api/ai/boost`
Get AI content suggestions.

**Headers:**
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "topic": "technology",
  "context": "Write about cloud computing benefits"
}
```

**Response:**
```json
{
  "suggestions": "Cloud computing offers scalability, cost-efficiency, and flexibility..."
}
```

#### POST `/api/ai/analyze`
Analyze post content with AI.

**Request Body:**
```json
{
  "content": "My post content here",
  "action": "sentiment"
}
```

### Turnstile Endpoints

#### POST `/api/turnstile/verify`
Verify Cloudflare Turnstile token.

**Request Body:**
```json
{
  "token": "turnstile-response-token"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Turnstile verification successful"
}
```

### Health Endpoints

#### GET `/actuator/health`
Application health check.

**Response:**
```json
{
  "status": "UP",
  "components": {
    "db": {"status": "UP"},
    "diskSpace": {"status": "UP"}
  }
}
```

---

## 🔐 Security

### Security Features Overview

1. **Password Security**
   - BCrypt hashing with strength 12
   - Automatic salt generation
   - No plaintext storage

2. **JWT Authentication**
   - HS256 algorithm
   - 64-character secret key
   - 24-hour token expiration
   - Stateless sessions

3. **OAuth 2.0**
   - Google social login
   - Automatic user provisioning
   - Secure token exchange

4. **Bot Protection**
   - Cloudflare Turnstile on login/register
   - Challenge-response verification
   - Rate limiting

5. **RBAC (Role-Based Access Control)**
   - USER: Standard permissions
   - ADMIN: Delete posts, manage users
   - Method-level security with `@PreAuthorize`

6. **CORS Configuration**
   - Allowed origins configured
   - Credentials support
   - Method whitelist

7. **Security Headers**
   - X-Frame-Options: DENY
   - X-Content-Type-Options: nosniff
   - X-XSS-Protection: 1; mode=block

### Security Best Practices

- ✅ Never commit secrets to Git
- ✅ Use AWS SSM Parameter Store for production secrets
- ✅ Rotate JWT secrets regularly
- ✅ Enable HTTPS/TLS in production (ALB)
- ✅ Use security groups to restrict database access
- ✅ Enable CloudWatch logging for audit trails
- ✅ Regular dependency updates
- ✅ Input validation on all endpoints

---

## 🔧 Troubleshooting

### Common Issues

#### Application Fails to Start

**Symptom:** EC2 instance marked unhealthy by ALB

**Solution:**
```bash
# SSH into EC2 instance
ssh -i your-key.pem ec2-user@ec2-ip

# Check service status
sudo systemctl status social-forum

# View logs
sudo journalctl -u social-forum -n 100 --no-pager

# Check if port 8080 is open
sudo netstat -tulpn | grep 8080

# Test health endpoint locally
curl http://localhost:8080/actuator/health
```

#### Database Connection Errors

**Symptom:** `CommunicationsException: Communications link failure`

**Solution:**
1. Verify RDS security group allows EC2 security group on port 3306
2. Check RDS endpoint is correct in User Data
3. Verify database credentials
4. Test connection from EC2:
```bash
mysql -h your-rds-endpoint -u admin -p
```

#### JWT Token Issues

**Symptom:** 401 Unauthorized on authenticated endpoints

**Solution:**
1. Verify JWT secret is correctly set
2. Check token expiration (24 hours default)
3. Ensure `Authorization: Bearer {token}` header format
4. Verify token in browser localStorage

#### Google OAuth Not Working

**Symptom:** OAuth redirect fails or shows error

**Solution:**
1. Verify Google Client ID/Secret in SSM
2. Check OAuth redirect URI matches Google Console
3. Ensure ALB URL is whitelisted in Google Console
4. Test redirect: `http://your-alb/oauth2/authorization/google`

#### S3 Upload Fails

**Symptom:** Cannot upload media files

**Solution:**
1. Verify EC2 IAM role has S3 PutObject permission
2. Check S3 bucket exists and is accessible
3. Verify CORS configuration on S3 bucket
4. Check CloudFront distribution status

#### AI Worker Timeout

**Symptom:** AI requests timeout after 15 seconds

**Solution:**
1. Verify AI Worker URL is correct
2. Check AI secret key matches worker configuration
3. Test worker directly: `curl -X POST worker-url -H "X-AI-Secret: key"`
4. Worker may be cold-starting (first request slower)

### Logging

#### Application Logs
```bash
# View real-time logs
sudo journalctl -u social-forum -f

# View last 100 lines
sudo journalctl -u social-forum -n 100

# View logs since boot
sudo journalctl -u social-forum -b

# View User Data execution log
sudo cat /var/log/social-forum-setup.log
```

#### CloudWatch Logs
- Configure CloudWatch agent on EC2
- Stream logs to `/aws/ec2/social-forum` log group
- Set up alarms for errors

---

## 📝 License

This project is licensed under the MIT License.

---

## 👥 Contributors

- **Developer**: Cloud Computing Project Team
- **Version**: 3.0 (Production Ready)
- **Last Updated**: December 22, 2025

---

## 📞 Support

For issues, questions, or contributions:
- **GitHub Issues**: [Create an issue](https://github.com/your-repo/issues)
- **Documentation**: This README
- **Architecture Diagram**: See Architecture section above

---

**🎉 Congratulations!** You now have a production-ready social forum platform deployed on AWS with enterprise-grade security and AI integration.
