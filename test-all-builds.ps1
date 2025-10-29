# 测试所有 Cache 子包的构建
# PowerShell 脚本

Write-Host "🚀 开始测试所有 Cache 子包构建..." -ForegroundColor Green
Write-Host ""

$packages = @(
    "core",
    "vue",
    "react",
    "solid",
    "svelte",
    "angular",
    "lit",
    "devtools"
)

$failed = @()
$succeeded = @()

foreach ($package in $packages) {
    Write-Host "📦 测试 @ldesign/cache-$package ..." -ForegroundColor Cyan
    
    $path = "packages/$package"
    
    if (Test-Path $path) {
        Push-Location $path
        
        # 运行构建
        $output = pnpm build 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✅ 构建成功" -ForegroundColor Green
            $succeeded += $package
        } else {
            Write-Host "  ❌ 构建失败" -ForegroundColor Red
            Write-Host "  错误: $output" -ForegroundColor Red
            $failed += $package
        }
        
        Pop-Location
    } else {
        Write-Host "  ⚠️  路径不存在: $path" -ForegroundColor Yellow
        $failed += $package
    }
    
    Write-Host ""
}

# 输出总结
Write-Host "=" * 60 -ForegroundColor Gray
Write-Host "📊 构建测试总结" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Gray
Write-Host ""
Write-Host "✅ 成功: $($succeeded.Count)/$($packages.Count)" -ForegroundColor Green
Write-Host "❌ 失败: $($failed.Count)/$($packages.Count)" -ForegroundColor $(if ($failed.Count -gt 0) { "Red" } else { "Green" })
Write-Host ""

if ($succeeded.Count -gt 0) {
    Write-Host "成功的包:" -ForegroundColor Green
    foreach ($pkg in $succeeded) {
        Write-Host "  ✓ cache-$pkg" -ForegroundColor Green
    }
    Write-Host ""
}

if ($failed.Count -gt 0) {
    Write-Host "失败的包:" -ForegroundColor Red
    foreach ($pkg in $failed) {
        Write-Host "  ✗ cache-$pkg" -ForegroundColor Red
    }
    Write-Host ""
    exit 1
} else {
    Write-Host "🎉 所有包构建成功！" -ForegroundColor Green
    exit 0
}

