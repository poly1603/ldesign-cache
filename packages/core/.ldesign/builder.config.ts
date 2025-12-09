/**
 * @ldesign/cache-core 构建配置
 */

import { defineConfig } from '@ldesign/builder'

export default defineConfig({
  // 多入口配置 - 支持子路径导出
  input: {
    index: 'src/index.ts',
    'constants/index': 'src/constants/index.ts',
    'plugins/index': 'src/plugins/index.ts',
    'serializers/index': 'src/serializers/index.ts',
    'storage/index': 'src/storage/index.ts',
    'strategies/index': 'src/strategies/index.ts',
    'types/index': 'src/types/index.ts',
    'utils/index': 'src/utils/index.ts',
  },

  // 输出配置 - 完整产物：es + lib + dist
  output: {
    format: ['esm', 'cjs', 'umd'],
    esm: {
      dir: 'es',
      preserveStructure: true,
    },
    cjs: {
      dir: 'lib',
      preserveStructure: true,
    },
    umd: {
      dir: 'dist',
      name: 'LDesignCacheCore',
      minify: true,
    },
  },

  // 是否生成类型声明
  dts: true,

  // 外部依赖
  external: [],

  // 清理输出目录
  clean: true,

  // 源码映射
  sourcemap: false,
})

