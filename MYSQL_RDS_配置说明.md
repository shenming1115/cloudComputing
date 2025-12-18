# MySQL RDS 配置说明

## 📅 配置日期
2025年12月17日

---

## ✅ 完成的工作

### 1. **添加 MySQL 数据库驱动依赖**

**文件：** `socialApp/pom.xml`

添加了 MySQL Connector/J 依赖：

```xml
<dependency>
    <groupId>com.mysql</groupId>
    <artifactId>mysql-connector-j</artifactId>
    <scope>runtime</scope>
</dependency>
```

**作用：** Spring Boot 应用需要 MySQL JDBC 驱动才能连接 MySQL 数据库。

---

### 2. **配置 Spring Boot 数据库连接**

**文件：** `socialApp/src/main/resources/application.properties`

添加了完整的 MySQL RDS 连接配置：

```properties
spring.application.name=socialApp

# MySQL RDS Configuration
spring.datasource.url=jdbc:mysql://social-forum-db-mysql.cbii4gykc5p0.ap-southeast-2.rds.amazonaws.com:3306/social_forum?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
spring.datasource.username=admin123
spring.datasource.password=pxTUxZPBBmgk3XD
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

# HikariCP Configuration
spring.datasource.hikari.maximum-pool-size=10
spring.datasource.hikari.minimum-idle=5
spring.datasource.hikari.connection-timeout=30000

# JPA/Hibernate Configuration
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQLDialect
spring.jpa.properties.hibernate.format_sql=true
```

**配置说明：**

| 配置项 | 值 | 说明 |
|--------|-----|------|
| `datasource.url` | MySQL RDS 地址:3306 | AWS RDS MySQL 实例的连接地址 |
| `datasource.username` | admin123 | MySQL 数据库用户名 |
| `datasource.password` | pxTUxZPBBmgk3XD | MySQL 数据库密码 |
| `datasource.driver-class-name` | com.mysql.cj.jdbc.Driver | MySQL 8.x 驱动类 |
| `hikari.maximum-pool-size` | 10 | 连接池最大连接数 |
| `hikari.minimum-idle` | 5 | 连接池最小空闲连接数 |
| `jpa.hibernate.ddl-auto` | update | 自动更新数据库表结构 |
| `hibernate.dialect` | MySQLDialect | Hibernate MySQL 方言 |

---

## 🔧 MySQL RDS 信息

### 数据库实例信息
- **主机地址：** `social-forum-db-mysql.cbii4gykc5p0.ap-southeast-2.rds.amazonaws.com`
- **端口：** `3306`
- **数据库名：** `social_forum`
- **用户名：** `admin123`
- **密码：** `pxTUxZPBBmgk3XD`
- **区域：** AWS ap-southeast-2 (悉尼)

### 连接 URL 参数说明
```
?useSSL=false                    # 禁用 SSL（开发环境）
&allowPublicKeyRetrieval=true    # 允许客户端获取公钥（MySQL 8.x）
&serverTimezone=UTC              # 设置时区为 UTC
```

---

## 🚀 如何运行应用

### 方法一：使用 Maven Wrapper（推荐）

```powershell
cd socialApp
.\mvnw.cmd spring-boot:run
```

### 方法二：打包后运行

```powershell
cd socialApp
.\mvnw.cmd clean package
java -jar target/socialApp-0.0.1-SNAPSHOT.jar
```

---

## ⚠️ 已知问题

### 网络连接问题
**问题：** 从公司网络无法连接 MySQL RDS  
**原因：** 公司防火墙阻止了 MySQL 端口 3306  
**错误信息：**
```
Communications link failure
Connection timed out: getsockopt
```

### 解决方案：
1. **从其他网络运行**（家里/咖啡厅）
2. **部署到 AWS EC2** - EC2 可以正常访问 RDS
3. **配置 VPN** - 使用公司 VPN 访问 AWS 资源

---

## ✅ 配置验证

Spring Boot 应用启动时会显示以下日志，表示配置正确：

```
INFO --- HikariPool-1 - Starting...
INFO --- Hibernate ORM core version 6.6.36.Final
INFO --- Database version: 8.0
```

如果能看到这些日志，说明：
- ✅ MySQL 驱动加载成功
- ✅ 数据源配置正确
- ✅ Hibernate 初始化正常

---

## 📝 配置文件位置

```
cloudComputing/
├── socialApp/
│   ├── pom.xml                              ← MySQL 依赖
│   └── src/main/resources/
│       └── application.properties           ← 数据库连接配置
```

---

## 🔄 与其他环境的区别

### 原有配置（environment variables）
之前在 `src/main/resources/application.yml` 使用环境变量：
```yaml
datasource:
  url: ${DB_URL}
  username: ${DB_USER}
  password: ${DB_PASSWORD}
```

### 现在的配置（hardcoded for development）
在 `socialApp/src/main/resources/application.properties` 直接写入连接信息，适合本地开发。

**注意：** 生产环境建议使用环境变量或 AWS Secrets Manager 来管理敏感信息。

---

## 🚀 EC2 部署步骤

### EC2 实例信息
- **公网 IP：** `54.252.23.73`
- **私有 IP：** `172.31.9.15`
- **实例状态：** Running ✅
- **区域：** AWS ap-southeast-2 (悉尼)

### 方法一：使用自动化部署脚本（推荐）

#### 1. 上传项目到 EC2

```powershell
# 使用上传脚本（需要在本地运行）
.\upload-to-ec2.ps1
```

#### 2. 在 EC2 上部署

```bash
# SSH 登录到 EC2
ssh -i your-key.pem ec2-user@54.252.23.73

# 运行部署脚本
chmod +x deploy_socialApp.sh
./deploy_socialApp.sh
```

### 方法二：手动部署

#### 1. 上传代码到 EC2

```powershell
# 本地 PowerShell 执行
scp -i your-key.pem -r socialApp ec2-user@54.252.23.73:/home/ec2-user/
scp -i your-key.pem deploy_socialApp.sh ec2-user@54.252.23.73:/home/ec2-user/
```

#### 2. SSH 登录并部署

```bash
ssh -i your-key.pem ec2-user@54.252.23.73
cd /home/ec2-user
chmod +x deploy_socialApp.sh
./deploy_socialApp.sh
```

---

## 🎯 下一步建议

1. **在非公司网络测试连接**
   - 验证配置是否正确
   - 确认数据库表自动创建

2. **创建数据库表**
   - Hibernate 会自动创建（ddl-auto=update）
   - 或手动运行 SQL 脚本

3. **部署到 EC2 测试** ✅ 已配置
   - EC2 可以访问 RDS
   - 测试完整的应用功能
   - 使用提供的部署脚本

4. **安全性改进**（生产环境）
   - 使用 AWS Secrets Manager
   - 启用 SSL 连接
   - 配置 RDS Security Group

---

## 📚 相关文件

- ✅ [pom.xml](socialApp/pom.xml) - Maven 依赖配置
- ✅ [application.properties](socialApp/src/main/resources/application.properties) - Spring Boot 配置
- ✅ [deploy_socialApp.sh](deploy_socialApp.sh) - EC2 自动部署脚本
- ✅ [upload-to-ec2.ps1](upload-to-ec2.ps1) - 本地上传脚本（Windows）
- 📖 [PROJECT_STATUS_AND_NEXT_STEPS.md](PROJECT_STATUS_AND_NEXT_STEPS.md) - 项目整体状态
- 📖 [Next_Step.md](Next_Step.md) - AWS 架构扩展计划

---

## ✨ 配置完成确认

- [x] MySQL Connector/J 依赖已添加
- [x] 数据源配置已完成
- [x] HikariCP 连接池已配置
- [x] Hibernate/JPA 已配置
- [x] 清理了测试脚本文件
- [x] 创建了配置说明文档
- [x] 创建了 EC2 自动部署脚本
- [x] 创建了本地上传脚本

**配置状态：** ✅ 完成  
**网络状态：** ⚠️ 本地受公司防火墙限制  
**EC2 部署：** ✅ 已准备就绪（54.252.23.73）  
**建议：** 使用 EC2 部署脚本快速部署到云端测试
