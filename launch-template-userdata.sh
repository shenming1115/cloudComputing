#!/bin/bash
set -e

yum update -y
yum install -y java-17-amazon-corretto awscli jq --allowerasing

mkdir -p /opt/social-forum
cd /opt/social-forum

DB_URL=$(aws ssm get-parameter --name "/social-forum/db/url" --query "Parameter.Value" --output text --region ap-southeast-2)
DB_USER=$(aws ssm get-parameter --name "/social-forum/db/username" --query "Parameter.Value" --output text --region ap-southeast-2)
DB_PASSWORD=$(aws ssm get-parameter --name "/social-forum/db/password" --with-decryption --query "Parameter.Value" --output text --region ap-southeast-2)
JWT_SECRET=$(aws ssm get-parameter --name "/social-forum/jwt/secret" --with-decryption --query "Parameter.Value" --output text --region ap-southeast-2)
S3_BUCKET_NAME=$(aws ssm get-parameter --name "/social-forum/s3/bucket-name" --query "Parameter.Value" --output text --region ap-southeast-2)

if [ -z "$DB_URL" ] || [ -z "$DB_USER" ] || [ -z "$DB_PASSWORD" ] || [ -z "$JWT_SECRET" ] || [ -z "$S3_BUCKET_NAME" ]; then
    echo "Error: Required parameters not found in SSM Parameter Store"
    exit 1
fi

aws s3 cp s3://social-forum-app-deployments/releases/social-forum-latest.jar /opt/social-forum/app.jar

if [ ! -f "/opt/social-forum/app.jar" ]; then
    exit 1
fi
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
Environment="JWT_SECRET=${JWT_SECRET}"
Environment="AWS_S3_BUCKET_NAME=${S3_BUCKET_NAME}"
Environment="AWS_REGION=ap-southeast-2"
Environment="SPRING_PROFILES_ACTIVE=prod"
Environment="DDL_AUTO=update"
Environment="SHOW_SQL=false"
Environment="JWT_EXPIRATION=86400000"
ExecStart=/usr/bin/java -jar -Xms512m -Xmx1024m /opt/social-forum/app.jar
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=social-forum

[Install]
WantedBy=multi-user.target
EOF

chown -R ec2-user:ec2-user /opt/social-forum

systemctl daemon-reload
systemctl enable social-forum
systemctl start social-forum
