#!/bin/bash
# 测试所有 Cache 子包的构建
# Bash 脚本（Linux/macOS）

echo "🚀 开始测试所有 Cache 子包构建..."
echo ""

packages=(
    "core"
    "vue"
    "react"
    "solid"
    "svelte"
    "angular"
    "lit"
    "devtools"
)

failed=()
succeeded=()

for package in "${packages[@]}"; do
    echo "📦 测试 @ldesign/cache-$package ..."
    
    path="packages/$package"
    
    if [ -d "$path" ]; then
        cd "$path" || exit
        
        # 运行构建
        if pnpm build > /dev/null 2>&1; then
            echo "  ✅ 构建成功"
            succeeded+=("$package")
        else
            echo "  ❌ 构建失败"
            failed+=("$package")
        fi
        
        cd - > /dev/null || exit
    else
        echo "  ⚠️  路径不存在: $path"
        failed+=("$package")
    fi
    
    echo ""
done

# 输出总结
echo "============================================================"
echo "📊 构建测试总结"
echo "============================================================"
echo ""
echo "✅ 成功: ${#succeeded[@]}/${#packages[@]}"
echo "❌ 失败: ${#failed[@]}/${#packages[@]}"
echo ""

if [ ${#succeeded[@]} -gt 0 ]; then
    echo "成功的包:"
    for pkg in "${succeeded[@]}"; do
        echo "  ✓ cache-$pkg"
    done
    echo ""
fi

if [ ${#failed[@]} -gt 0 ]; then
    echo "失败的包:"
    for pkg in "${failed[@]}"; do
        echo "  ✗ cache-$pkg"
    done
    echo ""
    exit 1
else
    echo "🎉 所有包构建成功！"
    exit 0
fi

