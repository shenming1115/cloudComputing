# Social Forum - 完整部署与测试指南

本指南提供完整的本地测试（H2）和 EC2 部署（RDS）说明。

---

## 📋 目录
1. [本地开发环境（H2 数据库）](#本地开发环境)
2. [API 测试示例](#api-测试示例)
3. [EC2 部署说明](#ec2-部署说明)
4. [前端配置检查](#前端配置检查)
5. [故障排查](#故障排查)

---

## 🏠 本地开发环境

### 1. 打包应用

```powershell
# 进入项目目录
cd "C:\Users\User\Desktop\CS Y2S2\cloud\cloudComputing"

# 使用 Maven Wrapper 打包
cd socialApp
.\mvnw.cmd -f ..\pom.xml clean package -DskipTests
cd ..
```

生成文件：`target/social-forum.jar`

### 2. 启动应用（H2 内存数据库）

```powershell
java "-Dspring.profiles.active=local" -jar target\social-forum.jar
```

**注意**：必须使用引号包裹 `-Dspring.profiles.active=local`

### 3. 访问应用

- **API 地址**: `http://localhost:8080`
- **健康检查**: `http://localhost:8080/actuator/health`
- **H2 控制台**: `http://localhost:8080/h2-console`
  - JDBC URL: `jdbc:h2:mem:testdb`
  - 用户名: `sa`
  - 密码: （留空）

### 4. 运行完整测试

```powershell
.\test-api.ps1
```

预期输出：
```
Tests Passed: 13
Tests Failed: 0
Success Rate: 100%
```

---

## 🧪 API 测试示例

### 1. 健康检查

```powershell
Invoke-RestMethod -Uri "http://localhost:8080/actuator/health"
```

### 2. 获取所有帖子

```powershell
Invoke-RestMethod -Uri "http://localhost:8080/api/posts"
```

### 3. 注册用户

```powershell
$body = @{
    username = "testuser"
    password = "Test123!@#"
    email = "test@example.com"
    bio = "这是一个测试用户"
} | ConvertTo-Json

$user = Invoke-RestMethod -Uri "http://localhost:8080/api/users/register" `
    -Method POST `
    -Body $body `
    -ContentType "application/json"

# 记录返回的用户 ID
Write-Host "用户ID: $($user.id)"
```

### 4. 用户登录

```powershell
$loginBody = @{
    username = "testuser"
    password = "Test123!@#"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:8080/api/users/login" `
    -Method POST `
    -Body $loginBody `
    -ContentType "application/json"
```

### 5. 创建帖子

```powershell
$postBody = @{
    content = "这是我的第一个测试帖子！"
    imageUrl = $null
    userId = 1  # 使用注册返回的用户 ID
} | ConvertTo-Json

$post = Invoke-RestMethod -Uri "http://localhost:8080/api/posts" `
    -Method POST `
    -Body $postBody `
    -ContentType "application/json"

Write-Host "帖子ID: $($post.id)"
```

### 6. 创建评论

```powershell
$commentBody = @{
    content = "这是一条评论"
    postId = 1  # 使用帖子 ID
    userId = 1  # 使用用户 ID
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8080/api/comments" `
    -Method POST `
    -Body $commentBody `
    -ContentType "application/json"
```

### 7. 分页查询帖子

```powershell
# 第一页，每页 10 条
Invoke-RestMethod -Uri "http://localhost:8080/api/posts?page=0&size=10"
```

### 8. 生成分享链接

```powershell
$shareBody = @{
    postId = 1
} | ConvertTo-Json

$shareLink = Invoke-RestMethod -Uri "http://localhost:8080/api/posts/generate-share-link" `
    -Method POST `
    -Body $shareBody `
    -ContentType "application/json"

Write-Host "分享链接: $($shareLink.url)"
```

---

## ☁️ EC2 部署说明

### 1. 上传 JAR 到 EC2

```powershell
# 使用 SCP 上传（假设你有 .pem 文件）
scp -i "your-key.pem" target/social-forum.jar ec2-user@your-ec2-ip:/home/ec2-user/
```

或使用 WinSCP 等工具上传。

### 2. EC2 上启动应用

```bash
# SSH 登录 EC2
ssh -i "your-key.pem" ec2-user@your-ec2-ip

# 启动应用（不需要指定 profile，自动使用默认配置连接 RDS）
nohup java -jar social-forum.jar > app.log 2>&1 &

# 查看日志
tail -f app.log

# 检查应用状态
curl http://localhost:8080/actuator/health
```

### 3. 配置说明

**默认配置（application.yml）**：
- 自动连接 RDS MySQL
- 数据库地址：`social-forum-db-mysql.cbii4gykc5p0.ap-southeast-2.rds.amazonaws.com:3306`
- 数据库名：`social_forum`
- 用户名：`admin123`
- `data.sql` 会自动执行初始化数据

**重要**：
- RDS 在 VPC 私有子网中，只能从 EC2 内部访问
- 本地无法直接连接 RDS（所以本地使用 H2）
- EC2 必须在同一 VPC 内才能访问 RDS

### 4. ALB 配置

确保 ALB 配置：
- 监听端口 80/443
- 目标组指向 EC2:8080
- 健康检查路径：`/actuator/health`

---

## 🎨 前端配置检查

### 1. 检查 HTML 文件

文件位置：`src/main/resources/static/html/`

检查要点：
- `index.html`：API 请求地址是否正确
- `login.html`：登录 API 路径
- `post-details.html`：帖子详情 API

### 2. 检查 JavaScript 文件

文件位置：`src/main/resources/static/js/`

**示例检查（index.js）**：
```javascript
// 确认 API 地址
fetch('/api/posts')  // ✓ 相对路径，自动适配
// 或
fetch('http://localhost:8080/api/posts')  // ✗ 硬编码，需要改为相对路径
```

**推荐做法**：
```javascript
// 使用相对路径
const API_BASE = '/api';

// 获取帖子
fetch(`${API_BASE}/posts`)
    .then(response => response.json())
    .then(data => console.log(data));
```

### 3. 确认静态资源路径

```html
<!-- CSS -->
<link rel="stylesheet" href="/css/global.css">

<!-- JavaScript -->
<script src="/js/utils.js"></script>

<!-- ✓ 使用 / 开头的绝对路径 -->
<!-- ✗ 避免使用 ../css/... 相对路径 -->
```

---

## 🔧 故障排查

### 问题 1：400 Bad Request

**原因**：DTO 验证失败

**解决**：
```powershell
# ✗ 错误写法
@{ content = "Hello"; userId = 1 } | ConvertTo-Json

# ✓ 正确写法（包含所有字段）
@{ content = "Hello"; imageUrl = $null; userId = 1 } | ConvertTo-Json
```

### 问题 2：本地无法连接 RDS

**原因**：RDS 在 VPC 私有子网，本地网络无法访问

**解决**：
- 本地开发使用 H2：`-Dspring.profiles.active=local`
- 只在 EC2 上连接 RDS

### 问题 3：data.sql 未执行

**检查配置**：
```yaml
spring:
  sql:
    init:
      mode: always  # 确保设置为 always
```

**查看日志**：
```
Executing SQL script [data.sql]
```

### 问题 4：应用启动失败

**检查端口占用**：
```powershell
# Windows
netstat -ano | findstr 8080

# 杀掉占用端口的进程
taskkill /PID <进程ID> /F
```

**检查 Java 版本**：
```powershell
java -version
# 需要 Java 17 或更高版本
```

---

## 📝 配置文件说明

### application.yml（默认 - 用于 EC2/RDS）
```yaml
spring:
  datasource:
    url: jdbc:mysql://social-forum-db-mysql...
    username: admin123
    password: pxTUxZPBBmgk3XD
  sql:
    init:
      mode: always  # 执行 data.sql
```

### application-local.yml（本地 H2）
```yaml
spring:
  datasource:
    url: jdbc:h2:mem:testdb
    username: sa
    password: 
  h2:
    console:
      enabled: true
```

### 使用方式

```powershell
# 本地开发
java "-Dspring.profiles.active=local" -jar target\social-forum.jar

# EC2 部署（使用默认配置）
java -jar social-forum.jar
```

---

## ✅ 部署检查清单

- [ ] 清理旧文件（.ps1, 临时 .md）
- [ ] 打包 JAR：`mvn clean package -DskipTests`
- [ ] 本地测试（H2）：`.\test-api.ps1`
- [ ] 检查前端文件（HTML/JS 中的 API 路径）
- [ ] 上传 JAR 到 EC2
- [ ] EC2 启动应用
- [ ] 通过 ALB 访问测试
- [ ] 检查 RDS 数据
- [ ] 提交代码到 GitHub

---

## 📚 相关文档

- `test-api.ps1`：自动化 API 测试脚本
- `data.sql`：数据库初始化脚本
- `pom.xml`：Maven 项目配置

---

**最后更新**：2025-12-19

**作者**：Cloud Computing Project Team
