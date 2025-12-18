# =========================================
# 上传 Spring Boot 项目到 EC2
# =========================================

param(
    [string]$KeyPath = "your-key.pem",
    [string]$EC2IP = "54.252.23.73",
    [string]$EC2User = "ec2-user"
)

Write-Host "========================================"
Write-Host "上传 Spring Boot 项目到 EC2"
Write-Host "========================================"
Write-Host ""

# 检查 SSH 密钥文件
if (-not (Test-Path $KeyPath)) {
    Write-Host "❌ 错误: SSH 密钥文件不存在: $KeyPath" -ForegroundColor Red
    Write-Host ""
    Write-Host "请指定正确的密钥文件路径："
    Write-Host "  .\upload-to-ec2.ps1 -KeyPath 'C:\path\to\your-key.pem'" -ForegroundColor Yellow
    exit 1
}

# 检查项目目录
if (-not (Test-Path "socialApp")) {
    Write-Host "❌ 错误: socialApp 目录不存在" -ForegroundColor Red
    exit 1
}

Write-Host "配置信息：" -ForegroundColor Cyan
Write-Host "  SSH 密钥: $KeyPath"
Write-Host "  EC2 IP:   $EC2IP"
Write-Host "  EC2 用户: $EC2User"
Write-Host ""

# 确认上传
$confirm = Read-Host "是否继续上传? (y/n)"
if ($confirm -ne "y") {
    Write-Host "已取消上传" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "==> 步骤 1/3: 上传项目代码..." -ForegroundColor Green

# 上传 socialApp 目录
Write-Host "正在上传 socialApp 目录..."
scp -i $KeyPath -r socialApp "${EC2User}@${EC2IP}:/home/${EC2User}/"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 上传项目代码失败" -ForegroundColor Red
    exit 1
}

Write-Host "✅ 项目代码上传完成" -ForegroundColor Green
Write-Host ""

Write-Host "==> 步骤 2/3: 上传部署脚本..." -ForegroundColor Green

# 上传部署脚本
Write-Host "正在上传 deploy_socialApp.sh..."
scp -i $KeyPath deploy_socialApp.sh "${EC2User}@${EC2IP}:/home/${EC2User}/"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 上传部署脚本失败" -ForegroundColor Red
    exit 1
}

Write-Host "✅ 部署脚本上传完成" -ForegroundColor Green
Write-Host ""

Write-Host "==> 步骤 3/3: 设置执行权限..." -ForegroundColor Green

# SSH 到 EC2 设置权限
ssh -i $KeyPath "${EC2User}@${EC2IP}" "chmod +x /home/${EC2User}/deploy_socialApp.sh"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 设置权限失败" -ForegroundColor Red
    exit 1
}

Write-Host "✅ 权限设置完成" -ForegroundColor Green
Write-Host ""

Write-Host "========================================"
Write-Host "上传完成! 🎉" -ForegroundColor Green
Write-Host "========================================"
Write-Host ""
Write-Host "下一步操作：" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. SSH 登录到 EC2:" -ForegroundColor Yellow
Write-Host "   ssh -i $KeyPath ${EC2User}@${EC2IP}"
Write-Host ""
Write-Host "2. 运行部署脚本:" -ForegroundColor Yellow
Write-Host "   ./deploy_socialApp.sh"
Write-Host ""
Write-Host "3. 查看应用日志:" -ForegroundColor Yellow
Write-Host "   tail -f /home/${EC2User}/socialApp.log"
Write-Host ""
Write-Host "4. 测试应用:" -ForegroundColor Yellow
Write-Host "   curl http://localhost:8080/actuator/health"
Write-Host "   或从浏览器访问: http://${EC2IP}:8080"
Write-Host ""
