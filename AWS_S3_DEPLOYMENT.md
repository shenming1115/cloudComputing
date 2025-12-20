# AWS S3 部署完整指南

本指南详细说明如何将 Spring Boot 应用打包、上传到 S3，并在 EC2 上自动部署。

---

## 📋 目录
1. [打包 JAR 文件](#1️⃣-打包-jar-文件)
2. [上传 JAR 到 S3](#2️⃣-上传-jar-到-s3)
3. [Launch Template User Data 脚本](#3️⃣-launch-template-user-data-脚本)
4. [健康检查配置](#4️⃣-健康检查配置)
5. [完整部署流程](#5️⃣-完整部署流程)
6. [故障排查](#6️⃣-故障排查)

---

## 1️⃣ 打包 JAR 文件

### 使用 Maven Wrapper

```bash
# Windows
.\mvnw.cmd clean package -DskipTests

# Linux/Mac
./mvnw clean package -DskipTests
```

### 验证打包结果

```bash
# 查看生成的 JAR 文件
ls target/*.jar

# 应该看到：
# target/social-forum.jar (约 57MB)
```

### 本地测试（可选）

```bash
# 使用 H2 数据库测试
java -Dspring.profiles.active=local -jar target/social-forum.jar

# 在另一个终端测试健康检查
curl http://localhost:8080/actuator/health
```

---

## 2️⃣ 上传 JAR 到 S3

### S3 Bucket 信息
- **Bucket 名称**: `social-forum-artifacts`
- **部署路径**: `s3://social-forum-artifacts/social-forum.jar`
- **Region**: `ap-southeast-2` (Sydney)

### 方法一：使用 AWS CLI（推荐）

```bash
# 上传 JAR 到 S3
aws s3 cp target/social-forum.jar s3://social-forum-artifacts/social-forum.jar --region ap-southeast-2

# 验证上传成功
aws s3 ls s3://social-forum-artifacts/
```

### 方法二：使用 AWS Console

1. 打开 AWS S3 Console
2. 进入 `social-forum-artifacts` bucket
3. 点击 **Upload**
4. 选择 `target/social-forum.jar` 文件
5. 点击 **Upload**

### 验证文件上传

```bash
# 检查文件大小
aws s3api head-object \
  --bucket social-forum-artifacts \
  --key social-forum.jar \
  --query 'ContentLength' \
  --output text
```

---

## 3️⃣ Launch Template User Data 脚本

### 完整 User Data 脚本

```bash
#!/bin/bash

# 日志输出
exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1
echo "Starting deployment at $(date)"

# 更新系统
yum update -y

# 安装 Java 17
yum install -y java-17-amazon-corretto-headless

# 验证 Java 安装
java -version

# 创建应用目录
mkdir -p /opt/social-forum
cd /opt/social-forum

# 从 S3 下载 JAR 文件
echo "Downloading JAR from S3..."
aws s3 cp s3://social-forum-artifacts/social-forum.jar /opt/social-forum/app.jar --region ap-southeast-2

# 验证下载
if [ ! -f "/opt/social-forum/app.jar" ]; then
    echo "ERROR: Failed to download JAR from S3"
    exit 1
fi

echo "JAR downloaded successfully: $(ls -lh /opt/social-forum/app.jar)"

# 创建 systemd 服务
cat > /etc/systemd/system/social-forum.service << 'EOF'
[Unit]
Description=Social Forum Application
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/social-forum
ExecStart=/usr/bin/java -jar /opt/social-forum/app.jar \
  --spring.profiles.active=prod \
  --spring.datasource.url=jdbc:mysql://social-forum-db-mysql.cbii4gykc5p0.ap-southeast-2.rds.amazonaws.com:3306/social_forum \
  --spring.datasource.username=admin123 \
  --spring.datasource.password=pxTUxZPBBmgk3XD \
  --server.port=8080
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=social-forum

[Install]
WantedBy=multi-user.target
EOF

# 重新加载 systemd 并启动服务
systemctl daemon-reload
systemctl enable social-forum
systemctl start social-forum

# 等待应用启动
echo "Waiting for application to start..."
for i in {1..30}; do
    if curl -f http://localhost:8080/actuator/health > /dev/null 2>&1; then
        echo "Application started successfully!"
        break
    fi
    echo "Waiting... ($i/30)"
    sleep 2
done

# 验证服务状态
systemctl status social-forum
echo "Deployment completed at $(date)"
```

### User Data 脚本说明

#### 关键配置点
1. **S3 路径**: `s3://social-forum-artifacts/social-forum.jar`
2. **数据库配置**: 直接通过 Spring Boot 参数传递
3. **端口**: `8080`（ALB 目标组应配置 8080）
4. **健康检查**: `/actuator/health`

#### 数据库连接参数
```bash
--spring.datasource.url=jdbc:mysql://social-forum-db-mysql.cbii4gykc5p0.ap-southeast-2.rds.amazonaws.com:3306/social_forum
--spring.datasource.username=admin123
--spring.datasource.password=pxTUxZPBBmgk3XD
```

---

## 4️⃣ 健康检查配置

### Spring Boot Actuator 配置

在 `application.yml` 中已配置：

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health
  endpoint:
    health:
      show-details: always
```

### 健康检查行为

#### ✅ 健康状态（HTTP 200）
当应用满足以下条件时返回 `UP`：
- 应用完全启动
- 数据库连接成功
- 所有 health indicators 通过

**示例响应：**
```json
{
  "status": "UP",
  "components": {
    "db": {
      "status": "UP",
      "details": {
        "database": "MySQL",
        "validationQuery": "isValid()"
      }
    },
    "diskSpace": {
      "status": "UP"
    },
    "ping": {
      "status": "UP"
    }
  }
}
```

#### ❌ 不健康状态（HTTP 503）
当应用出现以下情况时返回 `DOWN`：
- 数据库连接失败
- 磁盘空间不足
- 任何 health indicator 失败

**示例响应：**
```json
{
  "status": "DOWN",
  "components": {
    "db": {
      "status": "DOWN",
      "details": {
        "error": "Cannot connect to database"
      }
    }
  }
}
```

### ALB 健康检查配置

#### Target Group 设置
```
健康检查协议: HTTP
健康检查路径: /actuator/health
健康检查端口: 8080
健康检查间隔: 30 秒
超时: 5 秒
健康阈值: 2
不健康阈值: 3
成功代码: 200
```

#### 重要说明
- **ALB 只认为 HTTP 200 是健康的**
- 数据库连接失败会导致 503，实例会被标记为不健康
- ASG 会自动替换不健康的实例

---

## 5️⃣ 完整部署流程

### 步骤 1：打包并上传

```bash
# 1. 打包 JAR
.\mvnw.cmd clean package -DskipTests

# 2. 上传到 S3
aws s3 cp target/social-forum.jar s3://social-forum-artifacts/social-forum.jar --region ap-southeast-2

# 3. 验证上传
aws s3 ls s3://social-forum-artifacts/social-forum.jar
```

### 步骤 2：更新 Launch Template

1. 打开 EC2 Console → Launch Templates
2. 选择 `social-forum-launch-template`
3. 点击 **Actions** → **Modify template (Create new version)**
4. 在 **User data** 中粘贴上面的脚本
5. 点击 **Create template version**
6. 设置新版本为 **Default**

### 步骤 3：刷新 Auto Scaling Group

```bash
# 方法一：使用 AWS CLI
aws autoscaling start-instance-refresh \
  --auto-scaling-group-name social-forum-asg \
  --preferences MinHealthyPercentage=50,InstanceWarmup=300 \
  --region ap-southeast-2

# 方法二：使用 AWS Console
# 1. 打开 EC2 Console → Auto Scaling Groups
# 2. 选择 social-forum-asg
# 3. 点击 Instance refresh → Start instance refresh
# 4. 设置 Minimum healthy percentage: 50%
# 5. 设置 Instance warmup: 300 seconds
```

### 步骤 4：监控部署

#### 查看 Instance Refresh 状态
```bash
aws autoscaling describe-instance-refreshes \
  --auto-scaling-group-name social-forum-asg \
  --region ap-southeast-2
```

#### 查看应用日志
```bash
# SSH 到 EC2 实例
ssh -i your-key.pem ec2-user@<instance-ip>

# 查看应用日志
sudo journalctl -u social-forum -f

# 查看 User Data 日志
sudo cat /var/log/user-data.log

# 检查服务状态
sudo systemctl status social-forum

# 测试健康检查
curl http://localhost:8080/actuator/health
```

---

## 6️⃣ 故障排查

### 问题 1：JAR 下载失败

**症状**：
```
ERROR: Failed to download JAR from S3
```

**解决方案**：
```bash
# 1. 验证 S3 文件存在
aws s3 ls s3://social-forum-artifacts/social-forum.jar

# 2. 检查 EC2 IAM Role 权限
# 确保 Role 有 s3:GetObject 权限

# 3. 手动测试下载
aws s3 cp s3://social-forum-artifacts/social-forum.jar /tmp/test.jar
```

### 问题 2：数据库连接失败

**症状**：
```json
{
  "status": "DOWN",
  "components": {
    "db": {
      "status": "DOWN",
      "details": {
        "error": "Communications link failure"
      }
    }
  }
}
```

**解决方案**：
```bash
# 1. 检查 Security Group
# EC2 Security Group 是否允许出站流量到 RDS (3306)?
# RDS Security Group 是否允许来自 EC2 的入站流量?

# 2. 测试网络连接
telnet social-forum-db-mysql.cbii4gykc5p0.ap-southeast-2.rds.amazonaws.com 3306

# 3. 验证数据库凭据
mysql -h social-forum-db-mysql.cbii4gykc5p0.ap-southeast-2.rds.amazonaws.com \
  -u admin123 \
  -ppxTUxZPBBmgk3XD \
  social_forum
```

### 问题 3：健康检查失败

**症状**：
- ALB 目标组显示 `unhealthy`
- ASG 不断终止实例

**解决方案**：
```bash
# 1. 检查应用端口
sudo netstat -tlnp | grep 8080

# 2. 手动测试健康检查
curl -v http://localhost:8080/actuator/health

# 3. 查看应用日志
sudo journalctl -u social-forum -n 100

# 4. 验证 ALB 配置
# - 健康检查路径: /actuator/health
# - 健康检查端口: 8080
# - 成功代码: 200
```

### 问题 4：应用启动失败

**症状**：
```
systemctl status social-forum
● social-forum.service - Social Forum Application
   Loaded: loaded
   Active: failed
```

**解决方案**：
```bash
# 1. 查看完整错误日志
sudo journalctl -u social-forum -xe

# 2. 检查 Java 版本
java -version
# 应该是 Java 17

# 3. 手动启动测试
cd /opt/social-forum
java -jar app.jar

# 4. 验证 JAR 文件完整性
ls -lh /opt/social-forum/app.jar
# 应该约 57MB
```

### 问题 5：Instance Refresh 卡住

**症状**：
- Instance Refresh 状态一直是 `InProgress`
- 新实例一直标记为 `Unhealthy`

**解决方案**：
```bash
# 1. 取消当前的 Instance Refresh
aws autoscaling cancel-instance-refresh \
  --auto-scaling-group-name social-forum-asg \
  --region ap-southeast-2

# 2. 检查 Launch Template User Data
# 确保脚本没有语法错误

# 3. 手动启动一个测试实例
# 使用 Launch Template 启动一个 EC2
# SSH 进去检查 /var/log/user-data.log

# 4. 确认健康检查配置
# Target Group 健康检查路径: /actuator/health
# Target Group 端口: 8080
# 成功代码: 200
```

---

## 📝 快速参考

### S3 信息
```
Bucket: social-forum-artifacts
Path: s3://social-forum-artifacts/social-forum.jar
Region: ap-southeast-2
```

### 数据库连接
```
Host: social-forum-db-mysql.cbii4gykc5p0.ap-southeast-2.rds.amazonaws.com
Port: 3306
Database: social_forum
Username: admin123
Password: pxTUxZPBBmgk3XD
```

### 应用配置
```
端口: 8080
健康检查: /actuator/health
Profile: prod
Java 版本: 17
```

### 常用命令
```bash
# 打包
.\mvnw.cmd clean package -DskipTests

# 上传
aws s3 cp target/social-forum.jar s3://social-forum-artifacts/social-forum.jar

# 刷新 ASG
aws autoscaling start-instance-refresh --auto-scaling-group-name social-forum-asg

# 查看日志
sudo journalctl -u social-forum -f

# 测试健康检查
curl http://localhost:8080/actuator/health
```

---

## ✅ 部署检查清单

部署前确认：
- [ ] JAR 文件已打包（约 57MB）
- [ ] JAR 已上传到 S3（`s3://social-forum-artifacts/social-forum.jar`）
- [ ] Launch Template User Data 已更新
- [ ] EC2 IAM Role 有 S3 读取权限
- [ ] RDS 数据库可访问（Security Group 配置正确）
- [ ] ALB 健康检查配置正确（路径: `/actuator/health`, 端口: `8080`, 成功代码: `200`）

部署后验证：
- [ ] 新实例成功从 S3 下载 JAR
- [ ] 应用服务成功启动（`systemctl status social-forum`）
- [ ] 健康检查返回 200（`curl http://localhost:8080/actuator/health`）
- [ ] 数据库连接成功（健康检查中 `db` 状态为 `UP`）
- [ ] ALB 目标组显示 `healthy`
- [ ] Instance Refresh 完成（状态: `Successful`）

---

**最后更新**: 2025-01-19  
**Java 版本**: 17  
**Spring Boot 版本**: 3.2.0
