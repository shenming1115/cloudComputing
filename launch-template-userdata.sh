#!/bin/bash
set -e

# Redirect output to log file for debugging
exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1

echo "Starting User Data Script..."

# Update and Install Dependencies
yum update -y
yum install -y java-17-amazon-corretto-headless awscli jq

# Create App Directory
mkdir -p /opt/social-forum
cd /opt/social-forum

# Function to retry commands (robustness against transient network/service issues)
retry_command() {
    local -r cmd="$1"
    local -r delay=5
    local -r retries=10
    local count=0
    until $cmd; do
        exit_code=$?
        count=$((count + 1))
        if [ $count -lt $retries ]; then
            echo "Command failed with exit code $exit_code. Retrying in $delay seconds..."
            sleep $delay
        else
            echo "Command failed after $retries attempts."
            return $exit_code
        fi
    done
}

# Download Artifact with Retry
echo "Downloading application artifact..."
retry_command "aws s3 cp s3://social-forum-artifacts/social-forum.jar /opt/social-forum/app.jar --region ap-southeast-2"

if [ ! -f "/opt/social-forum/app.jar" ]; then
    echo "Error: app.jar not found!"
    exit 1
fi

# Fetch Secrets with Retry
echo "Fetching configuration from SSM..."
JWT_SECRET=$(retry_command "aws ssm get-parameter --name /social-forum/jwt/secret --with-decryption --region ap-southeast-2 --query Parameter.Value --output text")
DB_PASSWORD=$(retry_command "aws ssm get-parameter --name /social-forum/db/password --with-decryption --region ap-southeast-2 --query Parameter.Value --output text")
TURNSTILE_SECRET=$(retry_command "aws ssm get-parameter --name /social-forum/turnstile/secret --with-decryption --region ap-southeast-2 --query Parameter.Value --output text")
AI_WORKER_URL=$(retry_command "aws ssm get-parameter --name /social-forum/ai/worker-url --region ap-southeast-2 --query Parameter.Value --output text")
AI_SECRET_KEY=$(retry_command "aws ssm get-parameter --name /social-forum/ai/secret-key --with-decryption --region ap-southeast-2 --query Parameter.Value --output text")
S3_BUCKET_NAME=$(retry_command "aws ssm get-parameter --name /social-forum/s3/bucket-name --region ap-southeast-2 --query Parameter.Value --output text")
CLOUDFRONT_DOMAIN=$(retry_command "aws ssm get-parameter --name /social-forum/cloudfront/domain --region ap-southeast-2 --query Parameter.Value --output text")

# Configuration
JWT_EXPIRATION="86400000"
# FIXED: Added createDatabaseIfNotExist=true because your RDS 'DB name' is empty
DB_URL="jdbc:mysql://social-forum-db-mysql.cbii4gykc5p0.ap-southeast-2.rds.amazonaws.com:3306/social_forum?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Kuala_Lumpur&createDatabaseIfNotExist=true"
DB_USERNAME="admin123"
AWS_REGION="ap-southeast-2"

# Create Systemd Service
echo "Creating systemd service..."
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
Environment="TURNSTILE_SECRET_KEY=${TURNSTILE_SECRET}"
Environment="AI_WORKER_URL=${AI_WORKER_URL}"
Environment="AI_SECRET_KEY=${AI_SECRET_KEY}"
Environment="AWS_S3_BUCKET_NAME=${S3_BUCKET_NAME}"
Environment="AWS_REGION=${AWS_REGION}"
Environment="CLOUDFRONT_DOMAIN=${CLOUDFRONT_DOMAIN}"
Environment="MANAGEMENT_ENDPOINTS_WEB_EXPOSURE_INCLUDE=health,info"
Environment="MANAGEMENT_ENDPOINTS_WEB_BASE_PATH=/actuator"
ExecStart=/usr/bin/java -Xms512m -Xmx1024m -XX:+UseG1GC -XX:MaxGCPauseMillis=200 -Djava.security.egd=file:/dev/./urandom -jar /opt/social-forum/app.jar
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
EOF

# Set Permissions and Start Service
echo "Starting service..."
chown -R ec2-user:ec2-user /opt/social-forum
chmod 644 /etc/systemd/system/social-forum.service
systemctl daemon-reload
systemctl enable social-forum
systemctl start social-forum

echo "User Data Script Completed Successfully."
