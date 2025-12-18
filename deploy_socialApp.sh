#!/bin/bash
# =========================================
# EC2 自动部署 & 启动 Spring Boot + RDS 检查
# =========================================

# ----------- 1. 更新系统并安装依赖 -----------
echo "==> 更新系统..."
sudo dnf update -y

echo "==> 安装 JDK 17 和 Maven..."
sudo dnf install -y java-17-amazon-corretto maven wget unzip git nc

# 检查版本
java -version
mvn -version

# ----------- 2. 上传/拉取项目代码 -----------
# 假设你已经用 git 拉代码，或者通过 scp 上传
PROJECT_DIR="/home/ec2-user/socialApp"

if [ ! -d "$PROJECT_DIR" ]; then
    echo "==> 项目目录不存在，请先上传代码"
    echo "==> 使用命令: scp -i your-key.pem -r socialApp ec2-user@<EC2-IP>:/home/ec2-user/"
    exit 1
else
    echo "==> 项目目录已存在，继续部署..."
fi

cd $PROJECT_DIR

# ----------- 3. 配置 application.properties -----------
APP_PROPERTIES="$PROJECT_DIR/src/main/resources/application.properties"
echo "==> 配置数据库连接..."
cat > $APP_PROPERTIES <<EOL
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
EOL

# ----------- 4. 构建 Spring Boot 项目 -----------
echo "==> 构建 Spring Boot 项目..."
./mvnw clean package -DskipTests

if [ $? -ne 0 ]; then
    echo "==> 构建失败 ❌"
    exit 1
fi

# ----------- 5. 停止旧的应用实例（如果存在）-----------
echo "==> 停止旧的应用实例..."
OLD_PID=$(pgrep -f "socialApp.*\.jar")
if [ ! -z "$OLD_PID" ]; then
    echo "==> 发现运行中的实例 PID: $OLD_PID，正在停止..."
    kill -15 $OLD_PID
    sleep 5
    # 如果还在运行，强制停止
    if ps -p $OLD_PID > /dev/null; then
        kill -9 $OLD_PID
    fi
    echo "==> 旧实例已停止"
else
    echo "==> 没有运行中的实例"
fi

# ----------- 6. 启动 Spring Boot 应用 -----------
JAR_FILE=$(ls target/*.jar | grep -v original | head -n 1)
LOG_FILE="/home/ec2-user/socialApp.log"

echo "==> 启动 Spring Boot 应用: $JAR_FILE"
echo "==> 日志文件: $LOG_FILE"

# 后台启动
nohup java -jar $JAR_FILE > $LOG_FILE 2>&1 &
APP_PID=$!
echo "==> 应用已启动，PID: $APP_PID"

# 等待应用启动
echo "==> 等待应用启动（最多 60 秒）..."
COUNTER=0
while [ $COUNTER -lt 60 ]; do
    if grep -q "Started SocialAppApplication" $LOG_FILE 2>/dev/null; then
        echo "==> 应用启动成功 ✅"
        break
    fi
    if grep -q "APPLICATION FAILED TO START" $LOG_FILE 2>/dev/null; then
        echo "==> 应用启动失败 ❌"
        echo "==> 查看日志: tail -f $LOG_FILE"
        exit 1
    fi
    sleep 2
    COUNTER=$((COUNTER + 2))
    echo -n "."
done
echo ""

if [ $COUNTER -ge 60 ]; then
    echo "==> 应用启动超时，请检查日志"
    echo "==> 查看日志: tail -f $LOG_FILE"
fi

# ----------- 7. 检查 MySQL RDS 连接 -----------
echo ""
echo "==> 测试 RDS 3306 端口..."
nc -zv social-forum-db-mysql.cbii4gykc5p0.ap-southeast-2.rds.amazonaws.com 3306
if [ $? -eq 0 ]; then
    echo "==> RDS 端口 3306 可访问 ✅"
else
    echo "==> RDS 端口 3306 无法访问 ❌"
    echo "==> 请检查 Security Group 设置"
fi

# ----------- 8. 检查应用健康状态 -----------
echo ""
echo "==> 等待 5 秒后检查应用状态..."
sleep 5

echo "==> 检查 Tomcat 8080 端口..."
netstat -tlnp | grep 8080
if [ $? -eq 0 ]; then
    echo "==> Tomcat 8080 端口已监听 ✅"
else
    echo "==> Tomcat 8080 端口未监听 ❌"
fi

# ----------- 9. 显示最后 20 行日志 -----------
echo ""
echo "==> 最后 20 行日志："
echo "============================================"
tail -n 20 $LOG_FILE
echo "============================================"

# ----------- 10. 显示有用的命令 -----------
echo ""
echo "==> 部署完成 🎉"
echo ""
echo "常用命令："
echo "  查看日志:    tail -f $LOG_FILE"
echo "  检查进程:    ps aux | grep socialApp"
echo "  停止应用:    kill \$(pgrep -f 'socialApp.*\.jar')"
echo "  测试 API:    curl http://localhost:8080/actuator/health"
echo "  重启应用:    ./deploy_socialApp.sh"
echo ""
