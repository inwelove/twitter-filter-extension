# 图标生成脚本
# 由于需要安装 ImageMagick 或其他工具，这里提供一个替代方案
# 请使用浏览器打开 generate-icons.html 来生成图标

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Twitter Filter 图标生成工具" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "请按以下步骤生成图标：" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. 在浏览器中打开以下文件：" -ForegroundColor Green
Write-Host "   $PSScriptRoot\generate-icons.html" -ForegroundColor White
Write-Host ""
Write-Host "2. 点击「下载」按钮保存三个尺寸的图标" -ForegroundColor Green
Write-Host "   - icon128.png (128x128)" -ForegroundColor White
Write-Host "   - icon48.png (48x48)" -ForegroundColor White
Write-Host "   - icon16.png (16x16)" -ForegroundColor White
Write-Host ""
Write-Host "3. 将下载的 PNG 文件放入 icons 文件夹" -ForegroundColor Green
Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan

# 尝试在浏览器中打开
$filePath = Join-Path $PSScriptRoot "generate-icons.html"
if (Test-Path $filePath) {
    Start-Process $filePath
    Write-Host "已打开浏览器，请按照页面提示生成图标" -ForegroundColor Green
} else {
    Write-Host "错误：找不到 generate-icons.html 文件" -ForegroundColor Red
}
