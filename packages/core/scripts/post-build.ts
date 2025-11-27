#!/usr/bin/env node
/**
 * 后处理脚本:将 DTS 文件从 es/ 复制到 lib/
 * 确保 CJS 和 ESM 都有完整的类型定义
 */

import { cpSync, existsSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import nodeProcess from 'node:process'

const esDir = join(nodeProcess.cwd(), 'es')
const libDir = join(nodeProcess.cwd(), 'lib')

function copyDtsFiles(srcDir: string, destDir: string): void {
  if (!existsSync(srcDir)) {
    console.warn(`⚠️  源目录不存在: ${srcDir}`)
    return
  }

  const files = readdirSync(srcDir)

  for (const file of files) {
    const srcPath = join(srcDir, file)
    const destPath = join(destDir, file)
    const stat = statSync(srcPath)

    if (stat.isDirectory()) {
      // 递归处理子目录
      copyDtsFiles(srcPath, destPath)
    }
    else if (file.endsWith('.d.ts') || file.endsWith('.d.ts.map')) {
      // 复制 .d.ts 和 .d.ts.map 文件
      try {
        cpSync(srcPath, destPath, { force: true })
        const relativePath = relative(nodeProcess.cwd(), destPath)
        console.log(`  ✓ ${relativePath}`)
      }
      catch (error) {
        console.error(`  ✗ 复制失败: ${file}`, error)
      }
    }
  }
}

console.log('\n📦 开始复制 DTS 文件...')
console.log(`   从: ${relative(nodeProcess.cwd(), esDir)}`)
console.log(`   到: ${relative(nodeProcess.cwd(), libDir)}\n`)

try {
  copyDtsFiles(esDir, libDir)
  console.log('\n✅ DTS 文件复制完成!\n')
}
catch (error) {
  console.error('\n❌ DTS 文件复制失败:', error)
  nodeProcess.exit(1)
}
