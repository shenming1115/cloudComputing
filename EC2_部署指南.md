# 🚀 EC2 快速部署指南

## 📋 前提条件

- ✅ EC2 实例正在运行（54.252.23.73）
- ✅ SSH 密钥文件（.pem）
- ✅ 本地已配置好 Spring Boot 项目
- ✅ 安全组已开放端口 8080 和 22

---

## 🎯 快速部署（3 步完成）

### 步骤 1️⃣：上传项目到 EC2

在**本地 PowerShell** 执行：

```powershell
# 替换为你的密钥文件路径
.\upload-to-ec2.ps1 -KeyPath "C:\path\to\your-key.pem"
```

**这个脚本会自动：**
- ✅ 上传 socialApp 项目代码
- ✅ 上传部署脚本 deploy_socialApp.sh
- ✅ 设置脚本执行权限

---

### 步骤 2️⃣：SSH 登录到 EC2

```bash
ssh -i your-key.pem ec2-user@54.252.23.73
```

---

### 步骤 3️⃣：运行部署脚本

```bash
./deploy_socialApp.sh
```

**这个脚本会自动：**
- ✅ 安装 JDK 17 和 Maven
- ✅ 配置 MySQL RDS 连接
- ✅ 构建 Spring Boot 应用
- ✅ 启动应用服务
- ✅ 检查 RDS 连接状态
- ✅ 验证应用健康状态

---

## 🔍 部署后验证

### 1. 查看应用日志

```bash
tail -f /home/ec2-user/socialApp.log
```

**成功启动的标志：**
```
✅ Started SocialAppApplication in X seconds
✅ HikariPool-1 - Starting...
✅ Tomcat started on port 8080
```

---

### 2. 测试应用健康状态

```bash
# 在 EC2 上测试
curl http://localhost:8080/actuator/health

# 从本地浏览器访问（需要开放 8080 端口）
# http://54.252.23.73:8080
```

---

### 3. 检查 MySQL RDS 连接

部署脚本会自动测试 RDS 连接：

```bash
# 手动测试 RDS 端口
nc -zv social-forum-db-mysql.cbii4gykc5p0.ap-southeast-2.rds.amazonaws.com 3306
```

**成功输出：**
```
Connection to social-forum-db-mysql...succeeded!
✅ RDS 端口 3306 可访问
```

---

## 🛠️ 常用管理命令

### 查看应用状态

```bash
# 查看进程
ps aux | grep socialApp

# 查看端口
netstat -tlnp | grep 8080
```

### 停止应用

```bash
# 优雅停止
kill $(pgrep -f 'socialApp.*\.jar')
```

### 重启应用

```bash
# 重新运行部署脚本
./deploy_socialApp.sh
```

### 查看实时日志

```bash
# 实时查看日志
tail -f /home/ec2-user/socialApp.log

# 查看最后 50 行
tail -n 50 /home/ec2-user/socialApp.log

# 搜索错误
grep -i error /home/ec2-user/socialApp.log
```

---

## 🔧 故障排查

### 问题 1：应用启动失败

**检查日志：**
```bash
tail -n 100 /home/ec2-user/socialApp.log
```

**常见原因：**
- ❌ MySQL RDS 连接失败 → 检查 Security Group
- ❌ 端口 8080 被占用 → `netstat -tlnp | grep 8080`
- ❌ 内存不足 → `free -h`

---

### 问题 2：无法连接 MySQL RDS

**检查 RDS Security Group：**
1. 登录 AWS Console
2. 进入 RDS → Databases → social-forum-db-mysql
3. 查看 Security Groups
4. 确保入站规则允许 EC2 安全组访问 3306 端口

**测试连接：**
```bash
# 测试端口
nc -zv social-forum-db-mysql.cbii4gykc5p0.ap-southeast-2.rds.amazonaws.com 3306

# 使用 MySQL 客户端（可选）
sudo dnf install -y mysql
mysql -h social-forum-db-mysql.cbii4gykc5p0.ap-southeast-2.rds.amazonaws.com -u admin123 -p
```

---

### 问题 3：从浏览器无法访问应用

**检查 EC2 Security Group：**
1. 登录 AWS Console
2. 进入 EC2 → Instances → 选择实例
3. 查看 Security Groups
4. 确保入站规则包含：
   - 端口 22（SSH）
   - 端口 8080（HTTP）

**添加规则：**
- Type: Custom TCP
- Port: 8080
- Source: 0.0.0.0/0（或你的 IP）

---

## 📊 部署架构

```
┌─────────────────┐
│   你的电脑       │
│  (Windows)      │
└────────┬────────┘
         │ SSH/SCP
         ↓
┌─────────────────┐
│   EC2 实例      │
│  54.252.23.73   │ ──→ Port 8080 (Spring Boot)
│  172.31.9.15    │
└────────┬────────┘
         │ JDBC:3306
         ↓
┌─────────────────┐
│   MySQL RDS     │
│  social_forum   │
│  ap-southeast-2 │
└─────────────────┘
```

---

## ✅ 部署检查清单

部署前：
- [ ] SSH 密钥文件准备好
- [ ] 本地项目代码已更新
- [ ] EC2 实例正在运行
- [ ] Security Group 端口已开放

部署中：
- [ ] 上传脚本执行成功
- [ ] 部署脚本无错误
- [ ] 应用启动成功

部署后：
- [ ] 日志显示 "Started SocialAppApplication"
- [ ] RDS 连接测试成功
- [ ] 端口 8080 已监听
- [ ] 健康检查返回 200

---

## 🎉 成功标志

当你看到以下输出时，部署成功！

```bash
==> 应用启动成功 ✅
==> RDS 端口 3306 可访问 ✅
==> Tomcat 8080 端口已监听 ✅
==> 部署完成 🎉
```

---

## 📚 相关文件

| 文件 | 用途 |
|------|------|
| [upload-to-ec2.ps1](upload-to-ec2.ps1) | 本地上传脚本（Windows） |
| [deploy_socialApp.sh](deploy_socialApp.sh) | EC2 部署脚本（Linux） |
| [MYSQL_RDS_配置说明.md](MYSQL_RDS_配置说明.md) | MySQL RDS 配置详解 |
| [PROJECT_STATUS_AND_NEXT_STEPS.md](PROJECT_STATUS_AND_NEXT_STEPS.md) | 项目整体状态 |

---

## 🆘 需要帮助？

如果遇到问题，请：
1. 查看应用日志：`tail -f /home/ec2-user/socialApp.log`
2. 检查安全组配置
3. 验证 RDS 连接
4. 确认端口未被占用

**祝部署顺利！** 🚀
