#!/bin/bash

echo "--- Starting Deployment Script ---"

# 1. Add Swap to prevent EC2 freezing/lag (Critical for Java on t2.micro)
if [ ! -f /swapfile ]; then
    echo "Creating 2GB swapfile to fix lag..."
    sudo dd if=/dev/zero of=/swapfile bs=128M count=16
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo "/swapfile swap swap defaults 0 0" | sudo tee -a /etc/fstab
    echo "Swap created."
else
    echo "Swapfile already exists."
fi

# 2. Kill any existing Java process
echo "Stopping existing application..."
pkill -f social-forum || echo "No running application found."

# 3. Ensure Java 17 is installed
echo "Checking Java version..."
if ! java -version 2>&1 | grep -q "17"; then
    echo "Installing Java 17..."
    sudo yum install java-17-amazon-corretto -y
fi

# 4. Download the latest JAR from S3
echo "Downloading JAR from S3..."
aws s3 cp s3://social-forum-artifacts/social-forum.jar .

# 5. Run the Application
# Note: ddl-auto=create will WIPE the database.
echo "Starting Application..."
nohup java -jar social-forum.jar \
  --spring.profiles.active=default \
  --spring.jpa.hibernate.ddl-auto=create \
  --S3_BUCKET_NAME=social-forum-artifacts \
  --DB_PASSWORD=pxTUxZPBBmgk3XD \
  --CLOUDFRONT_DOMAIN=d3esrdnqsl7nsk.cloudfront.net \
  --TURNSTILE_SITE_KEY=0x4AAAAAAACIM1MoqYpHJ_b99 \
  --TURNSTILE_SECRET_KEY=0x4AAAAAAACIM1Gnv0QO3qUj1V17wnDwuV_4 > app.log 2>&1 &

echo "------------------------------------------------"
echo "Application started in background!"
echo "To see logs, run: tail -f app.log"
echo "------------------------------------------------"
