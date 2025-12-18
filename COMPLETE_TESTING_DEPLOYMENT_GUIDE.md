# 🚀 完整测试和部署指南 (Complete Testing & Deployment Guide)

## 📋 目录 (Table of Contents)

1. [新增功能概览](#新增功能概览)
2. [本地测试命令](#本地测试命令)
3. [所有API端点测试](#所有api端点测试)
4. [AWS部署步骤](#aws部署步骤)
5. [故障排除](#故障排除)

---

## ✨ 新增功能概览

### 🔗 1. 分享功能 (Share Feature)
- **功能描述**: 为每个帖子生成独特的分享链接
- **实现方式**: 
  - 每个帖子创建时自动生成 UUID 作为 `shareToken`
  - 通过分享链接访问帖子不需要认证
  - 记录分享次数 (`shareCount`)
- **新增API端点**:
  - `POST /api/posts/{id}/share` - 生成分享链接
  - `GET /api/posts/shared/{shareToken}` - 通过分享链接访问帖子

### 📄 2. 分页功能 (Pagination)
- **功能描述**: 支持大数据量时的分页查询
- **参数**:
  - `page`: 页码（从0开始）
  - `size`: 每页数量（1-100）
  - `paginated`: 是否启用分页（true/false）
- **响应包含**: 当前页、总页数、总元素数、是否有下一页/上一页

### ⚙️ 3. 性能优化
- ✅ 禁用 `open-in-view` - 避免数据库连接池耗尽
- ✅ 配置 Hikari 连接池 - 优化数据库连接管理
- ✅ 优雅关闭 (Graceful Shutdown) - 确保请求正常完成
- ✅ 泄漏检测阈值提升至 60 秒 - 减少误报

---

## 🖥️ 本地测试命令

### 1. 停止所有Java进程
```powershell
Get-Process java -ErrorAction SilentlyContinue | Stop-Process -Force
```

### 2. 重新构建项目
```powershell
cd "xxx"
.\socialApp\mvnw.cmd clean package -DskipTests
```

**预期输出**: `BUILD SUCCESS`

### 3. 启动应用 (两种方式)

#### 方式 A: 使用启动脚本（推荐）
```powershell
.\start-app.ps1
```

#### 方式 B: 直接运行 JAR
```powershell
java "-Dspring.profiles.active=dev" -jar "target\social-forum.jar"
```

**等待看到**: `Started Application in X seconds`

### 4. 验证应用启动成功
在**新的 PowerShell 窗口**中运行：
```powershell
Invoke-RestMethod -Uri "http://localhost:8080/health"
```

**预期输出**:
```
message                status
-------                ------
Application is running UP
```

---

## 🧪 所有API端点测试

### ✅ 测试 1: 健康检查 (Health Check)
```powershell
Invoke-RestMethod -Uri "http://localhost:8080/health"
```

**预期**: 返回 `status: UP`

---

### ✅ 测试 2: 注册用户 (Register User)
```powershell
$body = @{
    username = "john_doe"
    email = "john@example.com"
    password = "SecurePass123"
} | ConvertTo-Json

$user = Invoke-RestMethod -Uri "http://localhost:8080/api/users/register" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body

# 保存用户ID供后续测试使用
$global:userId = $user.id

# 显示结果
Write-Host "User registered: ID = $($user.id), Username = $($user.username)" -ForegroundColor Green

# 验证密码不在响应中
if ($user.password) {
    Write-Host "❌ SECURITY ISSUE: Password is exposed!" -ForegroundColor Red
} else {
    Write-Host "✅ SECURE: Password is NOT in response" -ForegroundColor Green
}
```

**预期**: 
- 返回用户对象，包含 `id`, `username`, `email`, `createdAt`
- **不包含** `password` 字段 ✅

---

### ✅ 测试 3: 登录用户 (Login User)
```powershell
$body = @{
    username = "john_doe"
    password = "SecurePass123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8080/api/users/login" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

**预期**: 返回 `Login successful` 消息

---

### ✅ 测试 4: 创建帖子 (Create Post)
```powershell
$body = @{
    content = "这是我的第一篇帖子！Testing the social forum backend with share feature."
    imageUrl = "https://example.com/image.jpg"
    userId = $global:userId
} | ConvertTo-Json

$post = Invoke-RestMethod -Uri "http://localhost:8080/api/posts" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body

# 保存帖子ID
$global:postId = $post.id

Write-Host "Post created: ID = $($post.id), ShareToken = $($post.shareToken)" -ForegroundColor Green
```

**预期**: 
- 返回帖子对象
- 包含自动生成的 `shareToken` (UUID格式)
- `shareCount` 初始值为 0

---

### ✅ 测试 5: 获取所有帖子 (Get All Posts - 无分页)
```powershell
$posts = Invoke-RestMethod -Uri "http://localhost:8080/api/posts"

Write-Host "Total posts: $($posts.Count)" -ForegroundColor Cyan
$posts | Format-Table id, content, shareToken, shareCount -AutoSize
```

**预期**: 返回所有帖子数组，按创建时间倒序

---

### ✅ 测试 6: 获取分页帖子 (Get Posts with Pagination)
```powershell
# 第一页，每页10条
$response = Invoke-RestMethod -Uri "http://localhost:8080/api/posts?page=0&size=10&paginated=true"

Write-Host "Current Page: $($response.currentPage)" -ForegroundColor Cyan
Write-Host "Total Pages: $($response.totalPages)" -ForegroundColor Cyan
Write-Host "Total Elements: $($response.totalElements)" -ForegroundColor Cyan
Write-Host "Has Next: $($response.hasNext)" -ForegroundColor Cyan

$response.posts | Format-Table id, content, shareCount -AutoSize
```

**预期**: 返回分页信息和帖子数组

---

### ✅ 测试 7: 生成分享链接 (Generate Share Link) ⭐ 新功能
```powershell
$shareResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/posts/$($global:postId)/share" `
    -Method POST

Write-Host "`n🔗 Share Link Generated!" -ForegroundColor Green
Write-Host "Post ID: $($shareResponse.postId)" -ForegroundColor Cyan
Write-Host "Share Token: $($shareResponse.shareToken)" -ForegroundColor Yellow
Write-Host "Share URL: $($shareResponse.shareUrl)" -ForegroundColor Magenta
Write-Host "Share Count: $($shareResponse.shareCount)" -ForegroundColor Cyan
Write-Host "Message: $($shareResponse.message)`n" -ForegroundColor Green

# 保存分享token
$global:shareToken = $shareResponse.shareToken
```

**预期**: 
- 返回分享链接，格式: `http://localhost:8080/api/posts/shared/{UUID}`
- `shareCount` 增加 1
- 每次调用都会递增分享次数

---

### ✅ 测试 8: 通过分享链接访问帖子 (Access Post via Share Link) ⭐ 新功能
```powershell
$sharedPost = Invoke-RestMethod -Uri "http://localhost:8080/api/posts/shared/$($global:shareToken)"

Write-Host "`n📖 Post Retrieved via Share Link!" -ForegroundColor Green
Write-Host "Post ID: $($sharedPost.post.id)" -ForegroundColor Cyan
Write-Host "Content: $($sharedPost.post.content)" -ForegroundColor White
Write-Host "Author: $($sharedPost.post.user.username)" -ForegroundColor Yellow
Write-Host "Share Count: $($sharedPost.shareCount)" -ForegroundColor Cyan
Write-Host "Message: $($sharedPost.message)`n" -ForegroundColor Green
```

**预期**: 
- 通过 `shareToken` 访问到完整的帖子信息
- 包含作者信息和评论
- 显示当前分享次数

---

### ✅ 测试 9: 获取单个帖子 (Get Single Post)
```powershell
$post = Invoke-RestMethod -Uri "http://localhost:8080/api/posts/$($global:postId)"

$post | Format-List
```

**预期**: 返回指定ID的帖子详情

---

### ✅ 测试 10: 创建评论 (Create Comment)
```powershell
$body = @{
    content = "Great post! 这是一个测试评论。"
    postId = $global:postId
    userId = $global:userId
} | ConvertTo-Json

$comment = Invoke-RestMethod -Uri "http://localhost:8080/api/comments" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body

Write-Host "Comment created: ID = $($comment.id)" -ForegroundColor Green
```

**预期**: 返回评论对象

---

### ✅ 测试 11: 输入验证测试 - 空内容 (Validation Test)
```powershell
try {
    $body = @{
        content = ""
        userId = $global:userId
    } | ConvertTo-Json

    Invoke-RestMethod -Uri "http://localhost:8080/api/posts" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body
} catch {
    Write-Host "✅ Validation working: Empty content rejected" -ForegroundColor Green
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Yellow
}
```

**预期**: 返回 400 Bad Request 错误

---

### ✅ 测试 12: 输入验证测试 - 无效邮箱 (Invalid Email)
```powershell
try {
    $body = @{
        username = "testuser2"
        email = "invalidemail"
        password = "SecurePass123"
    } | ConvertTo-Json

    Invoke-RestMethod -Uri "http://localhost:8080/api/users/register" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body
} catch {
    Write-Host "✅ Validation working: Invalid email rejected" -ForegroundColor Green
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Yellow
}
```

**预期**: 返回 400 Bad Request 验证错误

---

### ✅ 测试 13: 删除帖子 (Delete Post)
```powershell
Invoke-RestMethod -Uri "http://localhost:8080/api/posts/$($global:postId)" -Method DELETE
```

**预期**: 返回 `Post deleted successfully` 消息

---

### 🤖 完整自动化测试脚本

直接运行完整测试脚本（13个测试用例）：

```powershell
.\test-api.ps1
```

**注意**: 确保应用正在运行！

---

## 📊 新功能演示场景

### 场景 1: 用户分享帖子给朋友

```powershell
# 1. 用户创建帖子
$body = @{
    content = "Check out this amazing sunset! 🌅"
    imageUrl = "https://example.com/sunset.jpg"
    userId = 1
} | ConvertTo-Json

$post = Invoke-RestMethod -Uri "http://localhost:8080/api/posts" `
    -Method POST -ContentType "application/json" -Body $body

# 2. 用户生成分享链接
$share = Invoke-RestMethod -Uri "http://localhost:8080/api/posts/$($post.id)/share" -Method POST

Write-Host "`nShare this link with your friends:" -ForegroundColor Green
Write-Host $share.shareUrl -ForegroundColor Cyan

# 3. 朋友通过分享链接访问（无需登录）
$sharedPost = Invoke-RestMethod -Uri $share.shareUrl

Write-Host "`nYour friend can see:" -ForegroundColor Yellow
Write-Host "Content: $($sharedPost.post.content)"
Write-Host "Author: $($sharedPost.post.user.username)"
Write-Host "This post has been shared $($sharedPost.shareCount) times!" -ForegroundColor Magenta
```

### 场景 2: 查看分页帖子列表

```powershell
# 获取第一页（最新的10条）
$page1 = Invoke-RestMethod -Uri "http://localhost:8080/api/posts?page=0&size=10&paginated=true"

Write-Host "Showing $($page1.posts.Count) of $($page1.totalElements) total posts"
Write-Host "Page $($page1.currentPage + 1) of $($page1.totalPages)"

# 如果有下一页，获取第二页
if ($page1.hasNext) {
    $page2 = Invoke-RestMethod -Uri "http://localhost:8080/api/posts?page=1&size=10&paginated=true"
    Write-Host "Next page loaded successfully!"
}
```

---

## ☁️ AWS部署步骤

### 前置准备

#### 1. 确保本地测试通过
```powershell
# 运行所有测试
.\test-api.ps1

# 确保没有错误
```

#### 2. 修改 application-dev.yml（如果还没改）

确认以下配置已应用：
- ✅ `spring.jpa.open-in-view: false`
- ✅ `server.shutdown: graceful`
- ✅ Hikari 连接池配置

---

### 步骤 1: 创建 RDS 数据库

#### 1.1 登录 AWS Console → RDS → Create Database

**配置参数**:
```yaml
Engine: MySQL 8.0 (或 PostgreSQL 15)
Templates: Free tier
DB instance identifier: social-forum-db
Master username: admin123
Master password: YourSecurePassword123!  # （pxTUxZPBBmgk3XD)
DB instance class: db.t3.micro
Storage: 20 GB (General Purpose SSD)
Public access: Yes (测试阶段)
VPC security group: Create new → social-forum-db-sg
Initial database name: socialforum
```

#### 1.2 配置安全组

在 RDS 安全组中添加入站规则：
- Type: MySQL/Aurora (3306)
- Source: EC2 安全组 ID（稍后创建）

#### 1.3 记录 RDS Endpoint
等待数据库创建完成（5-10分钟），然后复制 Endpoint：
```
示例: social-forum-db.xxxxx.ap-southeast-1.rds.amazonaws.com
```

---

### 步骤 2: 创建 EC2 实例

#### 2.1 Launch Instance

**配置参数**:
```yaml
Name: social-forum-backend
AMI: Amazon Linux 2023
Instance type: t2.micro (免费套餐)
Key pair: 创建新的密钥对 → social-forum-key.pem （下载并保存）
Network: Default VPC
Security Group: 创建新的 → social-forum-sg
```

**安全组规则**:
```
Inbound Rules:
1. SSH (22) - Source: My IP (13.210.199.85)
2. Custom TCP (8080) - Source: 0.0.0.0/0 (或者只允许特定IP)
3. Custom TCP (8080) - Source: ::/0 (IPv6)
```

#### 2.2 配置 User Data (可选 - 自动安装Java)

在 "Advanced details" → "User data" 中添加：
```bash
#!/bin/bash
sudo yum update -y
sudo yum install java-17-amazon-corretto -y
```

---

### 步骤 3: 部署应用到 EC2

#### 3.1 连接到 EC2

在本地 PowerShell 中：
```powershell
# 方式 A: 使用 OpenSSH (Windows 10+)
ssh -i "path\to\social-forum-key.pem" ec2-user@your-ec2-public-ip

# 方式 B: 使用 PuTTY (需要先转换 .pem 到 .ppk)
```

#### 3.2 在 EC2 上安装 Java（如果没用 User Data）
```bash
sudo yum install java-17-amazon-corretto -y
java -version  # 验证安装
```

#### 3.3 上传 JAR 文件到 EC2

在本地 PowerShell 中：
```powershell
# 使用 SCP 上传
scp -i "path\to\social-forum-key.pem" `
    "C:\Users\User\Desktop\CS Y2S2\cloud\cloudComputing\target\social-forum.jar" `
    ec2-user@your-ec2-public-ip:~/
```

#### 3.4 在 EC2 上创建 systemd 服务

SSH 连接到 EC2 后：(ssh -i "C:\Users\User\Desktop\aws_keypair_ssh.pem" ec2-user@13.210.199.85)
```bash
# 创建服务配置文件
sudo tee /etc/systemd/system/social-forum.service > /dev/null <<EOF
[Unit]
Description=Social Forum Backend
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/home/ec2-user
Environment="DB_URL=jdbc:postgresql://social-forum-dbcbii4gykc5p0ap-southeast-2.rds.amazonaws.com:5432/socialforum"
Environment="DB_USER=admin123"
Environment="DB_PASSWORD=pxTUxZPBBmgk3XD"
Environment="SPRING_PROFILES_ACTIVE=prod"
Environment="DDL_AUTO=update"
Environment="SHOW_SQL=false"
ExecStart=/usr/bin/java -jar /home/ec2-user/social-forum.jar
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# 重新加载 systemd
sudo systemctl daemon-reload

# 启动服务
sudo systemctl start social-forum

# 设置开机自启动
sudo systemctl enable social-forum

# 查看服务状态
sudo systemctl status social-forum

# 查看日志
sudo journalctl -u social-forum -f
```

**替换以下内容**:
- `your-rds-endpoint`: RDS 的 Endpoint
- `YourSecurePassword123!`: 你的 RDS 密码

---

### 步骤 4: 验证部署

#### 4.1 检查服务状态
```bash
sudo systemctl status social-forum
```

**预期输出**:
```
● social-forum.service - Social Forum Backend
   Active: active (running)
```

#### 4.2 测试 API

在本地 PowerShell 中（替换 EC2 IP）：
```powershell
$ec2Ip = "your-ec2-public-ip"

# 测试健康检查
Invoke-RestMethod -Uri "http://${ec2Ip}:8080/health"

# 测试注册用户
$body = @{
    username = "testuser"
    email = "test@example.com"
    password = "SecurePass123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://${ec2Ip}:8080/api/users/register" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body

# 测试获取帖子
Invoke-RestMethod -Uri "http://${ec2Ip}:8080/api/posts"
```

---

### 步骤 5: 查看日志

#### 实时查看日志
```bash
sudo journalctl -u social-forum -f
```

#### 查看最近的日志
```bash
sudo journalctl -u social-forum -n 100
```

#### 查看错误日志
```bash
sudo journalctl -u social-forum -p err
```

---

## 🔧 故障排除

### 问题 1: 应用无法启动

**检查步骤**:
```bash
# 1. 查看服务状态
sudo systemctl status social-forum

# 2. 查看详细日志
sudo journalctl -u social-forum -n 50

# 3. 检查 Java 是否安装
java -version

# 4. 检查 JAR 文件是否存在
ls -lh /home/ec2-user/social-forum.jar
```

**常见原因**:
- ❌ RDS Endpoint 错误
- ❌ 数据库密码错误
- ❌ 安全组未允许 EC2 访问 RDS
- ❌ JAR 文件路径错误

---

### 问题 2: 无法连接到 RDS

**测试 RDS 连接**:
```bash
# 安装 MySQL 客户端
sudo yum install mysql -y

# 测试连接
mysql -h your-rds-endpoint -u admin -p
# 输入密码后应该能连接
```

**如果连接失败**:
1. 检查 RDS 安全组是否允许 EC2 安全组访问
2. 检查 RDS 是否设置为 Public accessible
3. 验证用户名和密码

---

### 问题 3: 本地测试通过，EC2 部署后失败

**检查环境变量**:
```bash
# 查看服务配置
sudo cat /etc/systemd/system/social-forum.service

# 确认环境变量设置正确
```

**重启服务**:
```bash
sudo systemctl restart social-forum
sudo journalctl -u social-forum -f
```

---

### 问题 4: 端口 8080 无法访问

**检查步骤**:
1. 验证应用正在运行：
```bash
sudo systemctl status social-forum
sudo netstat -tlnp | grep 8080
```

2. 检查 EC2 安全组是否开放 8080 端口

3. 在 EC2 内部测试：
```bash
curl http://localhost:8080/health
```

如果内部可以访问但外部不行，则是安全组配置问题。

---

### 问题 5: 数据库表未创建

**检查 DDL 配置**:
```bash
# 确认 DDL_AUTO 设置为 update
grep DDL_AUTO /etc/systemd/system/social-forum.service
```

**手动创建表**（如果需要）:
```bash
mysql -h your-rds-endpoint -u admin -p socialforum < schema.sql
```

---

## 📝 完整测试清单 (Checklist)

### 本地测试 ✅
- [ ] 应用成功启动
- [ ] Health check 返回 UP
- [ ] 用户注册成功（密码不在响应中）
- [ ] 用户登录成功
- [ ] 创建帖子成功（包含 shareToken）
- [ ] 生成分享链接成功
- [ ] 通过分享链接访问帖子
- [ ] 分页功能正常
- [ ] 输入验证工作正常（空内容被拒绝）
- [ ] 所有测试脚本通过

### AWS 部署 ✅
- [ ] RDS 数据库创建成功
- [ ] EC2 实例创建成功
- [ ] 安全组配置正确
- [ ] JAR 文件上传成功
- [ ] systemd 服务配置正确
- [ ] 应用在 EC2 上启动成功
- [ ] 可以从外部访问 API
- [ ] 数据库连接成功
- [ ] 表自动创建成功
- [ ] 所有 API 功能正常

---

## 🎓 总结

### 已实现的功能
1. ✅ 完整的用户系统（注册、登录）
2. ✅ 帖子管理（创建、查询、删除）
3. ✅ 评论系统
4. ✅ **分享功能** - 独特的分享链接和计数
5. ✅ **分页功能** - 支持大数据量查询
6. ✅ 输入验证和安全性
7. ✅ 全局异常处理
8. ✅ 事务管理和日志记录
9. ✅ 性能优化（连接池、优雅关闭）

### 技术栈
- **后端**: Spring Boot 3.2.0, Java 17
- **数据库**: H2 (开发), MySQL/PostgreSQL (生产)
- **安全**: Spring Security, BCrypt 密码加密
- **验证**: Jakarta Bean Validation
- **部署**: AWS EC2 + RDS

### 下一步建议
1. 🔐 实现 JWT 认证（可选）
2. 📊 添加 Swagger API 文档（可选）
3. 🧪 编写单元测试（推荐）
4. 🚀 配置 CI/CD 自动部署（高级）
5. 🔒 配置 HTTPS (Let's Encrypt)
6. 📈 添加监控和告警 (CloudWatch)

---

## 📞 常用命令速查表

### 本地开发
```powershell
# 停止所有 Java 进程
Get-Process java | Stop-Process -Force

# 重新构建
.\socialApp\mvnw.cmd clean package -DskipTests

# 启动应用
.\start-app.ps1

# 运行测试
.\test-api.ps1

# 测试健康检查
Invoke-RestMethod http://localhost:8080/health
```

### AWS 部署
```bash
# 连接到 EC2
ssh -i "key.pem" ec2-user@ec2-ip

# 查看服务状态
sudo systemctl status social-forum

# 查看日志
sudo journalctl -u social-forum -f

# 重启服务
sudo systemctl restart social-forum

# 停止服务
sudo systemctl stop social-forum

# 启动服务
sudo systemctl start social-forum
```

---

**最后更新**: 2025年12月16日  
**项目版本**: 1.0.0  
**状态**: ✅ 生产就绪
