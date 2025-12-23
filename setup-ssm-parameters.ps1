# Setup AWS SSM Parameters for Social Forum Application
# 确保 AWS CLI 已配置好凭证和区域

$region = "ap-southeast-2"

Write-Host "Setting up AWS SSM Parameters..." -ForegroundColor Green
Write-Host ""

# 1. Database URL (完整的 JDBC URL)
$dbUrl = "jdbc:mysql://social-forum-db-mysql.cbii4gykc5p0.ap-southeast-2.rds.amazonaws.com:3306/social_forum?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC"
Write-Host "Setting /social-forum/db/url..." -ForegroundColor Yellow
aws ssm put-parameter `
    --name "/social-forum/db/url" `
    --value $dbUrl `
    --type "String" `
    --region $region `
    --overwrite

# 2. Database Username
Write-Host "Setting /social-forum/db/username..." -ForegroundColor Yellow
aws ssm put-parameter `
    --name "/social-forum/db/username" `
    --value "admin" `
    --type "String" `
    --region $region `
    --overwrite

# 3. Database Password (来自你的截图)
Write-Host "Setting /social-forum/db/password..." -ForegroundColor Yellow
aws ssm put-parameter `
    --name "/social-forum/db/password" `
    --value "pxTUxZPBBmgk3XD" `
    --type "SecureString" `
    --region $region `
    --overwrite

# 4. JWT Secret (生成一个 64 字符的密钥)
Write-Host "Setting /social-forum/jwt/secret..." -ForegroundColor Yellow
aws ssm put-parameter `
    --name "/social-forum/jwt/secret" `
    --value "your-super-secure-64-character-secret-key-for-jwt-production-2025" `
    --type "SecureString" `
    --region $region `
    --overwrite

# 5. Turnstile Secret (来自你的截图)
Write-Host "Setting /social-forum/turnstile/secret..." -ForegroundColor Yellow
aws ssm put-parameter `
    --name "/social-forum/turnstile/secret" `
    --value "0x4AAAAAAC1M1Gnv0QO3qUj1V17wnDwuV_4" `
    --type "SecureString" `
    --region $region `
    --overwrite

# 6. S3 Bucket Name
Write-Host "Setting /social-forum/s3/bucket-name..." -ForegroundColor Yellow
aws ssm put-parameter `
    --name "/social-forum/s3/bucket-name" `
    --value "social-forum-media" `
    --type "String" `
    --region $region `
    --overwrite

# 7. Google OAuth Client ID (如果需要的话，没有就留空)
Write-Host "Setting /social-forum/oauth2/google-client-id..." -ForegroundColor Yellow
aws ssm put-parameter `
    --name "/social-forum/oauth2/google-client-id" `
    --value "not-used-turnstile-only" `
    --type "String" `
    --region $region `
    --overwrite

# 8. Google OAuth Client Secret (如果需要的话，没有就留空)
Write-Host "Setting /social-forum/oauth2/google-client-secret..." -ForegroundColor Yellow
aws ssm put-parameter `
    --name "/social-forum/oauth2/google-client-secret" `
    --value "not-used-turnstile-only" `
    --type "SecureString" `
    --region $region `
    --overwrite

# 9. OAuth Redirect URI (如果需要的话，没有就留空)
Write-Host "Setting /social-forum/oauth2/redirect-uri..." -ForegroundColor Yellow
aws ssm put-parameter `
    --name "/social-forum/oauth2/redirect-uri" `
    --value "not-used-turnstile-only" `
    --type "String" `
    --region $region `
    --overwrite

Write-Host ""
Write-Host "✅ All SSM Parameters have been set!" -ForegroundColor Green
Write-Host ""
Write-Host "Verifying parameters..." -ForegroundColor Cyan
Write-Host ""

# 验证参数
aws ssm get-parameters `
    --names `
        "/social-forum/db/url" `
        "/social-forum/db/username" `
        "/social-forum/db/password" `
        "/social-forum/jwt/secret" `
        "/social-forum/turnstile/secret" `
        "/social-forum/s3/bucket-name" `
    --with-decryption `
    --region $region `
    --query "Parameters[*].[Name,Type]" `
    --output table

Write-Host ""
Write-Host "✅ Setup Complete! You can now deploy to AWS." -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Upload JAR to S3: aws s3 cp target/social-forum.jar s3://social-forum-artifacts/" -ForegroundColor White
Write-Host "2. Update Launch Template or refresh EC2 instances" -ForegroundColor White
