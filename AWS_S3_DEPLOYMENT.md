# AWS S3 部署完整指南

本指南详细说明如何将 Spring Boot 应用打包、上传到 S3，并在 EC2 上自动部署。

---

## 📋 目录
1. [打包 JAR 文件](#打包-jar-文件)
2. [配置 AWS S3](#配置-aws-s3)
3. [上传 JAR 到 S3](#上传-jar-到-s3)
4. [配置数据库连接（安全方式）](#配置数据库连接)
5. [EC2 自动化部署脚本](#ec2-自动化部署脚本)
6. [完整部署流程](#完整部署流程)

---

## 📦 打包 JAR 文件

### 步骤 1：清理并重新构建

```powershell
# 进入项目目录
cd "C:\Users\User\Desktop\CS Y2S2\cloud\cloudComputing"

# 停止所有运行中的 Java 进程
Get-Process java -ErrorAction SilentlyContinue | Stop-Process -Force

# 清理并打包（跳过测试以加快速度）
cd socialApp
.\mvnw.cmd -f ..\pom.xml clean package -DskipTests
cd ..
```

### 步骤 2：验证 JAR 文件

```powershell
# 检查生成的 JAR 文件
Get-Item target\social-forum.jar | Select-Object Name, Length, LastWriteTime

# 预期输出：
# Name               Length      LastWriteTime
# ----               ------      -------------
# social-forum.jar   57,297,920  2025-12-19 7:10 PM
```

### 步骤 3：本地测试 JAR

```powershell
# 使用 H2 数据库测试
java "-Dspring.profiles.active=local" -jar target\social-forum.jar

# 在另一个终端测试
Invoke-RestMethod -Uri "http://localhost:8080/actuator/health"
```

**如果测试成功，继续下一步！** ✅

---

## ☁️ 配置 AWS S3

### 步骤 1：创建 S3 Bucket

在 AWS Console 中：

1. **进入 S3 服务**
2. **Create bucket**
   - Bucket name: `social-forum-app-deployments` （必须全局唯一）
   - Region: `ap-southeast-2` (Sydney - 与你的 EC2 同区域)
   - **取消勾选** "Block all public access" ❌
   - 启用 "Bucket Versioning" ✅
   - 点击 "Create bucket"

### 步骤 2：配置 Bucket Policy

在 Bucket → Permissions → Bucket Policy，添加：

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowEC2Access",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::YOUR-ACCOUNT-ID:role/EC2-S3-Access-Role"
      },
      "Action": [
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::social-forum-app-deployments/*",
        "arn:aws:s3:::social-forum-app-deployments"
      ]
    }
  ]
}
```

**注意：** 替换 `YOUR-ACCOUNT-ID` 为你的 AWS 账户 ID

---

## 📤 上传 JAR 到 S3

### 方法 1：使用 AWS CLI（推荐）

#### 安装 AWS CLI（如果还没有）

```powershell
# Windows - 使用 MSI 安装程序
# 下载：https://awscli.amazonaws.com/AWSCLIV2.msi

# 或使用 winget
winget install Amazon.AWSCLI

# 验证安装
aws --version
```

#### 配置 AWS 凭证

```powershell
# 配置 AWS 凭证（首次使用）
aws configure

# 输入以下信息：
# AWS Access Key ID: 你的 Access Key
# AWS Secret Access Key: 你的 Secret Key  
# Default region name: ap-southeast-2
# Default output format: json
```

#### 上传 JAR 文件

```powershell
# 上传 JAR 到 S3
aws s3 cp target\social-forum.jar s3://social-forum-app-deployments/releases/social-forum-latest.jar

# 验证上传
aws s3 ls s3://social-forum-app-deployments/releases/

# 预期输出：
# 2025-12-19 19:15:23   57297920 social-forum-latest.jar
```

#### 上传版本化的 JAR（可选）

```powershell
# 创建带版本号的副本
$version = Get-Date -Format "yyyyMMdd-HHmmss"
aws s3 cp target\social-forum.jar "s3://social-forum-app-deployments/releases/social-forum-$version.jar"

Write-Host "上传版本: social-forum-$version.jar" -ForegroundColor Green
```

### 方法 2：使用 AWS Console（GUI）

1. **进入 S3 Console**
2. **选择 bucket**: `social-forum-app-deployments`
3. **创建文件夹**: `releases/`
4. **进入 releases 文件夹**
5. **Upload → Add files → 选择** `target\social-forum.jar`
6. **重命名为**: `social-forum-latest.jar`
7. **点击 Upload**

---

## 🔒 配置数据库连接（安全方式）

### ⚠️ 重要：不要硬编码数据库密码！

### 方法 1：使用 AWS Systems Manager Parameter Store（推荐）

#### 步骤 1：存储数据库配置

```bash
# 在本地或 EC2 上执行（需要 AWS CLI）

# 存储数据库 URL
aws ssm put-parameter \
    --name "/social-forum/db/url" \
    --value "jdbc:mysql://social-forum-db-mysql.cbii4gykc5p0.ap-southeast-2.rds.amazonaws.com:3306/social_forum?useSSL=false&serverTimezone=UTC" \
    --type "String"

# 存储数据库用户名
aws ssm put-parameter \
    --name "/social-forum/db/username" \
    --value "admin123" \
    --type "String"

# 存储数据库密码（使用 SecureString 加密）
aws ssm put-parameter \
    --name "/social-forum/db/password" \
    --value "pxTUxZPBBmgk3XD" \
    --type "SecureString"

# 验证存储
aws ssm get-parameter --name "/social-forum/db/url"
aws ssm get-parameter --name "/social-forum/db/username"
aws ssm get-parameter --name "/social-forum/db/password" --with-decryption
```

#### 步骤 2：更新 EC2 IAM Role

确保 EC2 实例的 IAM Role 包含以下权限：

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::social-forum-app-deployments/*",
        "arn:aws:s3:::social-forum-app-deployments"
      ]
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

### 方法 2：使用环境变量（简单但不够安全）

#### 创建配置文件

在 EC2 上创建 `/home/ec2-user/db-config.env`:

```bash
# 数据库配置
export DB_URL="jdbc:mysql://social-forum-db-mysql.cbii4gykc5p0.ap-southeast-2.rds.amazonaws.com:3306/social_forum?useSSL=false&serverTimezone=UTC"
export DB_USER="admin123"
export DB_PASSWORD="pxTUxZPBBmgk3XD"
export SPRING_PROFILES_ACTIVE="prod"
```

**设置文件权限（重要！）：**

```bash
# 限制只有 ec2-user 可以读取
chmod 600 /home/ec2-user/db-config.env
chown ec2-user:ec2-user /home/ec2-user/db-config.env
```

---

## 🚀 EC2 自动化部署脚本

### 创建部署脚本

在 EC2 上创建 `/home/ec2-user/deploy-from-s3.sh`:

```bash
#!/bin/bash
# =========================================
# EC2 自动化部署脚本 - 从 S3 拉取 JAR
# =========================================

set -e  # 遇到错误立即退出

# 配置参数
S3_BUCKET="social-forum-app-deployments"
S3_KEY="releases/social-forum-latest.jar"
APP_DIR="/home/ec2-user/app"
JAR_NAME="social-forum.jar"
SERVICE_NAME="social-forum"

echo "=========================================="
echo "开始部署 Social Forum 应用"
echo "=========================================="
echo ""

# 创建应用目录
echo "==> 1/6: 创建应用目录..."
mkdir -p $APP_DIR
cd $APP_DIR

# 从 Parameter Store 获取数据库配置
echo "==> 2/6: 获取数据库配置..."
export DB_URL=$(aws ssm get-parameter --name "/social-forum/db/url" --query "Parameter.Value" --output text --region ap-southeast-2)
export DB_USER=$(aws ssm get-parameter --name "/social-forum/db/username" --query "Parameter.Value" --output text --region ap-southeast-2)
export DB_PASSWORD=$(aws ssm get-parameter --name "/social-forum/db/password" --with-decryption --query "Parameter.Value" --output text --region ap-southeast-2)

echo "✓ 数据库配置获取成功"

# 下载 JAR 文件
echo "==> 3/6: 从 S3 下载最新 JAR..."
aws s3 cp s3://${S3_BUCKET}/${S3_KEY} ${APP_DIR}/${JAR_NAME}

if [ ! -f "${APP_DIR}/${JAR_NAME}" ]; then
    echo "✗ JAR 文件下载失败！"
    exit 1
fi

echo "✓ JAR 文件下载成功"
echo "  文件大小: $(du -h ${APP_DIR}/${JAR_NAME} | cut -f1)"

# 停止旧的应用实例
echo "==> 4/6: 停止旧的应用实例..."
if systemctl is-active --quiet $SERVICE_NAME; then
    sudo systemctl stop $SERVICE_NAME
    echo "✓ 旧实例已停止"
else
    echo "✓ 没有运行中的实例"
fi

# 创建 systemd 服务
echo "==> 5/6: 配置 systemd 服务..."
sudo tee /etc/systemd/system/${SERVICE_NAME}.service > /dev/null <<EOF
[Unit]
Description=Social Forum Backend
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=${APP_DIR}
Environment="DB_URL=${DB_URL}"
Environment="DB_USER=${DB_USER}"
Environment="DB_PASSWORD=${DB_PASSWORD}"
Environment="SPRING_PROFILES_ACTIVE=prod"
Environment="DDL_AUTO=update"
Environment="SHOW_SQL=false"
ExecStart=/usr/bin/java -jar ${APP_DIR}/${JAR_NAME}
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

echo "✓ systemd 服务配置完成"

# 启动应用
echo "==> 6/6: 启动应用..."
sudo systemctl daemon-reload
sudo systemctl enable $SERVICE_NAME
sudo systemctl start $SERVICE_NAME

# 等待应用启动
echo "等待应用启动（最多 60 秒）..."
COUNTER=0
while [ $COUNTER -lt 60 ]; do
    if systemctl is-active --quiet $SERVICE_NAME; then
        if curl -s http://localhost:8080/actuator/health > /dev/null 2>&1; then
            echo "✓ 应用启动成功！"
            break
        fi
    fi
    sleep 2
    COUNTER=$((COUNTER + 2))
    echo -n "."
done
echo ""

# 检查状态
echo ""
echo "=========================================="
echo "部署完成！"
echo "=========================================="
echo ""
echo "应用状态："
sudo systemctl status $SERVICE_NAME --no-pager

echo ""
echo "健康检查："
curl -s http://localhost:8080/actuator/health | jq .

echo ""
echo "常用命令："
echo "  查看日志: sudo journalctl -u $SERVICE_NAME -f"
echo "  重启服务: sudo systemctl restart $SERVICE_NAME"
echo "  停止服务: sudo systemctl stop $SERVICE_NAME"
echo ""
```

### 设置脚本权限

```bash
chmod +x /home/ec2-user/deploy-from-s3.sh
```

---

## 📝 完整部署流程

### 第一步：本地准备（在你的电脑上）

```powershell
# 1. 清理并打包 JAR
cd "C:\Users\User\Desktop\CS Y2S2\cloud\cloudComputing"
cd socialApp
.\mvnw.cmd -f ..\pom.xml clean package -DskipTests
cd ..

# 2. 本地测试（可选）
java "-Dspring.profiles.active=local" -jar target\social-forum.jar

# 3. 上传到 S3
aws s3 cp target\social-forum.jar s3://social-forum-app-deployments/releases/social-forum-latest.jar

# 4. 验证上传
aws s3 ls s3://social-forum-app-deployments/releases/
```

### 第二步：配置数据库密钥（首次部署）

```powershell
# 存储数据库配置到 AWS Parameter Store
aws ssm put-parameter --name "/social-forum/db/url" --value "jdbc:mysql://social-forum-db-mysql.cbii4gykc5p0.ap-southeast-2.rds.amazonaws.com:3306/social_forum?useSSL=false&serverTimezone=UTC" --type "String"
aws ssm put-parameter --name "/social-forum/db/username" --value "admin123" --type "String"
aws ssm put-parameter --name "/social-forum/db/password" --value "pxTUxZPBBmgk3XD" --type "SecureString"
```

### 第三步：EC2 首次配置（SSH 到 EC2）

```bash
# 1. 连接到 EC2
ssh -i "your-key.pem" ec2-user@your-ec2-ip

# 2. 安装必要工具
sudo yum update -y
sudo yum install -y java-17-amazon-corretto jq

# 3. 配置 AWS CLI（应该已预装）
aws configure set region ap-southeast-2

# 4. 创建部署脚本
nano /home/ec2-user/deploy-from-s3.sh
# 粘贴上面的脚本内容，保存

# 5. 设置权限
chmod +x /home/ec2-user/deploy-from-s3.sh

# 6. 首次部署
./deploy-from-s3.sh
```

### 第四步：后续更新部署

每次代码更新后：

```powershell
# 本地：打包并上传
cd socialApp
.\mvnw.cmd -f ..\pom.xml clean package -DskipTests
cd ..
aws s3 cp target\social-forum.jar s3://social-forum-app-deployments/releases/social-forum-latest.jar
```

```bash
# EC2：重新部署
ssh -i "your-key.pem" ec2-user@your-ec2-ip
./deploy-from-s3.sh
```

---

## � Launch Template User Data 脚本

### 推荐版本（使用 systemd + Parameter Store）

将此脚本添加到 Launch Template 的 User Data：

```bash
#!/bin/bash
set -e

# 日志函数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a /var/log/social-forum-setup.log
}

log "=========================================="
log "开始配置 Social Forum 应用"
log "=========================================="

# 更新系统并安装依赖
log "1/6: 更新系统并安装 Java 17 和 AWS CLI..."
yum update -y
yum install -y java-17-amazon-corretto awscli jq --allowerasing

# 验证 Java 版本
java -version 2>&1 | head -n 1 | tee -a /var/log/social-forum-setup.log

# 创建应用目录
log "2/6: 创建应用目录..."
mkdir -p /opt/social-forum
cd /opt/social-forum

# 从 Parameter Store 获取数据库配置
log "3/6: 从 Parameter Store 获取数据库配置..."
DB_URL=$(aws ssm get-parameter --name "/social-forum/db/url" --query "Parameter.Value" --output text --region ap-southeast-2)
DB_USER=$(aws ssm get-parameter --name "/social-forum/db/username" --query "Parameter.Value" --output text --region ap-southeast-2)
DB_PASSWORD=$(aws ssm get-parameter --name "/social-forum/db/password" --with-decryption --query "Parameter.Value" --output text --region ap-southeast-2)

if [ -z "$DB_URL" ] || [ -z "$DB_USER" ] || [ -z "$DB_PASSWORD" ]; then
    log "错误: 无法获取数据库配置，请检查 Parameter Store"
    exit 1
fi

log "✓ 数据库配置获取成功"

# 从 S3 下载 JAR
log "4/6: 从 S3 下载应用 JAR..."
aws s3 cp s3://social-forum-app-deployments/releases/social-forum-latest.jar /opt/social-forum/app.jar

if [ ! -f "/opt/social-forum/app.jar" ]; then
    log "错误: JAR 文件下载失败"
    exit 1
fi

log "✓ JAR 文件下载成功 ($(du -h /opt/social-forum/app.jar | cut -f1))"

# 创建 systemd 服务
log "5/6: 创建 systemd 服务..."
cat > /etc/systemd/system/social-forum.service <<EOF
[Unit]
Description=Social Forum Backend Application
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/opt/social-forum
Environment="DB_URL=${DB_URL}"
Environment="DB_USER=${DB_USER}"
Environment="DB_PASSWORD=${DB_PASSWORD}"
Environment="SPRING_PROFILES_ACTIVE=prod"
Environment="DDL_AUTO=update"
Environment="SHOW_SQL=false"
ExecStart=/usr/bin/java -jar -Xms512m -Xmx1024m /opt/social-forum/app.jar
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=social-forum

[Install]
WantedBy=multi-user.target
EOF

# 设置文件权限
chown -R ec2-user:ec2-user /opt/social-forum

# 启动服务
log "6/6: 启动应用服务..."
systemctl daemon-reload
systemctl enable social-forum
systemctl start social-forum

# 等待应用启动
log "等待应用启动（最多 90 秒）..."
COUNTER=0
while [ $COUNTER -lt 90 ]; do
    if curl -s http://localhost:8080/actuator/health | grep -q "UP"; then
        log "✓ 应用启动成功！"
        curl -s http://localhost:8080/actuator/health | jq . | tee -a /var/log/social-forum-setup.log
        break
    fi
    sleep 3
    COUNTER=$((COUNTER + 3))
    if [ $((COUNTER % 15)) -eq 0 ]; then
        log "  等待中... ($COUNTER/90 秒)"
    fi
done

if [ $COUNTER -ge 90 ]; then
    log "警告: 应用启动超时，请检查日志"
    log "查看日志: sudo journalctl -u social-forum -n 50"
fi

log "=========================================="
log "配置完成！"
log "=========================================="
log "应用日志: sudo journalctl -u social-forum -f"
log "应用状态: sudo systemctl status social-forum"
```

### 简化版本（硬编码密码 - 仅用于开发测试）

如果你要继续使用你原来的方式（**不推荐生产环境**）：

```bash
#!/bin/bash
set -e

# 更新系统（改为 Java 17）
yum update -y
yum install -y java-17-amazon-corretto awscli jq --allowerasing

# 验证 Java 版本
java -version

# 创建应用目录
mkdir -p /opt/social-forum
cd /opt/social-forum

# 从 S3 下载 JAR（统一使用这个 bucket）
aws s3 cp s3://social-forum-app-deployments/releases/social-forum-latest.jar app.jar

if [ ! -f "app.jar" ]; then
    echo "错误: JAR 下载失败"
    exit 1
fi

# 创建 systemd 服务（更可靠）
cat > /etc/systemd/system/social-forum.service <<EOF
[Unit]
Description=Social Forum Backend
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/opt/social-forum
ExecStart=/usr/bin/java -jar /opt/social-forum/app.jar \
  --spring.datasource.url=jdbc:mysql://social-forum-db-mysql.cbii4gykc5p0.ap-southeast-2.rds.amazonaws.com:3306/social_forum?useSSL=false&serverTimezone=UTC \
  --spring.datasource.username=admin123 \
  --spring.datasource.password=pxTUxZPBBmgk3XD \
  --spring.jpa.hibernate.ddl-auto=update
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# 设置权限
chown -R ec2-user:ec2-user /opt/social-forum

# 启动服务
systemctl daemon-reload
systemctl enable social-forum
systemctl start social-forum

# 等待启动并检查
sleep 30
curl http://localhost:8080/actuator/health
```

### 你的原始脚本需要改的地方：

```diff
#!/bin/bash
set -e

yum update -y
-yum install -y java-21-amazon-corretto awscli --allowerasing
+yum install -y java-17-amazon-corretto awscli jq --allowerasing

mkdir -p /opt/social-forum
cd /opt/social-forum

-aws s3 cp s3://social-forum-artifacts/socialApp-0.0.1-SNAPSHOT.jar app.jar
+aws s3 cp s3://social-forum-app-deployments/releases/social-forum-latest.jar app.jar
chmod +x app.jar

+# 使用 systemd 替代 nohup（更可靠）
-nohup java -jar app.jar \
+cat > /etc/systemd/system/social-forum.service <<EOF
+[Unit]
+Description=Social Forum Backend
+After=network.target
+
+[Service]
+Type=simple
+User=ec2-user
+WorkingDirectory=/opt/social-forum
+ExecStart=/usr/bin/java -jar /opt/social-forum/app.jar \
  --spring.datasource.url="jdbc:mysql://social-forum-db-mysql.cbii4gykc5p0.ap-southeast-2.rds.amazonaws.com:3306/social_forum?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC" \
  --spring.datasource.username="admin123" \
  --spring.datasource.password="pxTUxZPBBmgk3XD" \
  --spring.jpa.hibernate.ddl-auto=update \
-  --management.endpoints.web.exposure.include=health \
-  --management.endpoints.web.base-path=/ \
-  > /opt/social-forum/app.log 2>&1 &
+Restart=always
+RestartSec=10
+StandardOutput=journal
+StandardError=journal
+
+[Install]
+WantedBy=multi-user.target
+EOF
+
+chown -R ec2-user:ec2-user /opt/social-forum
+systemctl daemon-reload
+systemctl enable social-forum
+systemctl start social-forum
```

### 关键改进说明：

| 改动 | 原因 | 优先级 |
|------|------|--------|
| **Java 21 → 17** | 项目编译使用 Java 17 | 🔴 必须 |
| **S3 bucket 统一** | 避免路径混乱 | 🔴 必须 |
| **nohup → systemd** | 自动重启、日志管理更好 | 🟡 强烈建议 |
| **Parameter Store** | 密码不暴露在 User Data | 🟡 生产必须 |
| **移除 base-path** | 使用标准路径 `/actuator/health` | 🟢 建议 |
| **添加健康检查** | 确认应用启动成功 | 🟢 建议 |

---

## �🔍 故障排查

### 问题 1：无法从 S3 下载 JAR

```bash
# 检查 IAM Role 权限
aws sts get-caller-identity

# 测试 S3 访问
aws s3 ls s3://social-forum-app-deployments/releases/

# 如果失败，检查 EC2 IAM Role 是否附加
```

### 问题 2：无法读取 Parameter Store

```bash
# 测试参数访问
aws ssm get-parameter --name "/social-forum/db/url"

# 如果失败，检查 IAM Role 权限
aws iam get-role-policy --role-name EC2-S3-Access-Role --policy-name SSM-Access
```

### 问题 3：应用启动失败

```bash
# 查看详细日志
sudo journalctl -u social-forum -n 100

# 检查数据库连接
mysql -h social-forum-db-mysql.cbii4gykc5p0.ap-southeast-2.rds.amazonaws.com -u admin123 -p
```

### 问题 4：端口占用

```bash
# 检查 8080 端口
sudo netstat -tlnp | grep 8080

# 杀掉占用的进程
sudo kill $(sudo lsof -t -i:8080)
```

---

## 📊 数据库连接信息参考

### RDS MySQL 配置

| 参数 | 值 |
|------|-----|
| **Endpoint** | `social-forum-db-mysql.cbii4gykc5p0.ap-southeast-2.rds.amazonaws.com` |
| **Port** | `3306` |
| **Database** | `social_forum` |
| **Username** | `admin123` |
| **Password** | `pxTUxZPBBmgk3XD` ⚠️ 使用 Parameter Store 存储 |
| **JDBC URL** | `jdbc:mysql://social-forum-db-mysql.cbii4gykc5p0.ap-southeast-2.rds.amazonaws.com:3306/social_forum?useSSL=false&serverTimezone=UTC` |

### H2 本地测试配置

| 参数 | 值 |
|------|-----|
| **URL** | `jdbc:h2:mem:testdb` |
| **Username** | `sa` |
| **Password** | （空） |
| **Console** | `http://localhost:8080/h2-console` |

---

## ✅ 部署检查清单

### 本地准备
- [ ] 代码测试通过
- [ ] JAR 打包成功 (`target/social-forum.jar`)
- [ ] 本地 H2 测试通过
- [ ] AWS CLI 已配置
- [ ] S3 Bucket 已创建

### AWS 配置
- [ ] S3 Bucket 创建完成
- [ ] Bucket Policy 配置正确
- [ ] IAM Role 创建并附加到 EC2
- [ ] Parameter Store 存储数据库配置
- [ ] Security Group 允许 8080 端口

### EC2 部署
- [ ] Java 17 已安装
- [ ] 部署脚本已创建
- [ ] 应用成功启动
- [ ] 健康检查返回 UP
- [ ] 可以从外部访问 API

---

## 🎯 快速命令参考

```powershell
# === 本地操作 ===

# 打包
cd socialApp; .\mvnw.cmd -f ..\pom.xml clean package -DskipTests; cd ..

# 上传到 S3
aws s3 cp target\social-forum.jar s3://social-forum-app-deployments/releases/social-forum-latest.jar

# 查看 S3 文件
aws s3 ls s3://social-forum-app-deployments/releases/
```

```bash
# === EC2 操作 ===

# 部署
./deploy-from-s3.sh

# 查看日志
sudo journalctl -u social-forum -f

# 重启服务
sudo systemctl restart social-forum

# 检查状态
sudo systemctl status social-forum

# 测试健康
curl http://localhost:8080/actuator/health
```

---

## 🔐 安全最佳实践

1. **永远不要提交密码到 Git** ❌
2. **使用 Parameter Store 存储敏感信息** ✅
3. **限制 S3 Bucket 访问权限** ✅
4. **使用 IAM Role 而非 Access Key** ✅
5. **RDS 放在私有子网** ✅
6. **定期轮换数据库密码** 🔄

---

## 📚 相关文档

- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - 本地 H2 测试指南
- [test-api.ps1](test-api.ps1) - API 测试脚本
- [AWS IAM 文档](https://docs.aws.amazon.com/IAM/)
- [AWS S3 文档](https://docs.aws.amazon.com/s3/)
- [AWS Systems Manager](https://docs.aws.amazon.com/systems-manager/)

---

**最后更新：** 2025-12-19  
**版本：** 1.0  
**作者：** Cloud Computing Project Team
