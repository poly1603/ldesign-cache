/**
 * @ldesign/cache-core Builder Configuration
 *
 * 框架无关的核心缓存库
 * 支持多种淘汰策略和存储引擎
 */
import { defineConfig } from '@ldesign/builder'

export default defineConfig({
  entry: 'src/index.ts',
  output: {
    formats: ['esm', 'cjs', 'dts'],
  },
  dts: {
    enabled: true,
  },
  external: [],
  minify: false, // 保持可读性，便于调试
  sourcemap: true,
})
