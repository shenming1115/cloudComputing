#!/bin/bash
exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1

echo "Starting User Data Script..."

# 1. Configure Swap Memory (Critical for t2.micro/t3.micro)
echo "Configuring Swap Memory..."
if [ ! -f /swapfile ]; then
    dd if=/dev/zero of=/swapfile bs=128M count=16
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo "/swapfile swap swap defaults 0 0" >> /etc/fstab
    echo "Swap created successfully!"
else
    echo "Swap already exists."
fi

# 2. Install Dependencies (Java 17, AWS CLI, jq)
echo "Installing dependencies..."
yum update -y
yum install -y java-17-amazon-corretto-headless aws-cli jq

# 3. Download Application Artifact
echo "Downloading application artifact..."
cd /home/ec2-user
aws s3 cp s3://social-forum-artifacts/social-forum.jar ./app.jar

# 4. Fetch Configuration from SSM Parameter Store
echo "Fetching configuration from SSM..."
REGION="ap-southeast-2"

# Function to get parameter with retry
get_param() {
    aws ssm get-parameter --name "$1" --with-decryption --query "Parameter.Value" --output text --region $REGION
}

DB_PASSWORD=$(get_param "/social-forum/prod/DB_PASSWORD")
JWT_SECRET=$(get_param "/social-forum/prod/JWT_SECRET")
TURNSTILE_SECRET=$(get_param "/social-forum/prod/TURNSTILE_SECRET_KEY")

# Verify parameters were fetched
if [ -z "$DB_PASSWORD" ] || [ "$DB_PASSWORD" == "None" ]; then
    echo "ERROR: Failed to fetch DB_PASSWORD from SSM. Check IAM Role permissions."
    # Fallback for debugging (DO NOT USE IN PRODUCTION IF POSSIBLE)
    # DB_PASSWORD="HARDCODED_PASSWORD_IF_NEEDED" 
fi

# 5. Create Systemd Service
echo "Creating systemd service..."
cat <<EOF > /etc/systemd/system/social-forum.service
[Unit]
Description=Social Forum Spring Boot Application
After=network.target

[Service]
User=ec2-user
WorkingDirectory=/home/ec2-user
SuccessExitStatus=143
TimeoutStopSec=10
Restart=on-failure
RestartSec=5

# Environment Variables
Environment=DB_PASSWORD=${DB_PASSWORD}
Environment=JWT_SECRET=${JWT_SECRET}
Environment=TURNSTILE_SECRET_KEY=${TURNSTILE_SECRET}
Environment=SERVER_PORT=8080
Environment=SPRING_PROFILES_ACTIVE=prod

# Java Command
ExecStart=/usr/bin/java -jar /home/ec2-user/app.jar \
  --server.port=8080 \
  --spring.datasource.password=\${DB_PASSWORD} \
  --jwt.secret=\${JWT_SECRET} \
  --turnstile.secret-key=\${TURNSTILE_SECRET_KEY} \
  --s3.bucket-name=social-forum-artifacts \
  --cloudfront.domain=d3esrdnqsl7nsk.cloudfront.net

[Install]
WantedBy=multi-user.target
EOF

# 6. Start Service
echo "Setting permissions and starting service..."
chown ec2-user:ec2-user /home/ec2-user/app.jar
systemctl daemon-reload
systemctl enable social-forum
systemctl start social-forum

echo "User Data Script Completed!"
