/**
 * @ldesign/cache-vue 构建配置
 */

import { defineConfig } from '@ldesign/builder'

export default defineConfig({
  // 多入口配置 - 支持子路径导出
  input: {
    index: 'src/index.ts',
    'components/index': 'src/components/index.ts',
    'composables/index': 'src/composables/index.ts',
    'decorators/index': 'src/decorators/index.ts',
    'directives/index': 'src/directives/index.ts',
    'types/index': 'src/types/index.ts',
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
      name: 'LDesignCacheVue',
      minify: true,
    },
  },

  // 是否生成类型声明
  dts: true,

  // 外部依赖
  external: [
    'vue',
    '@ldesign/cache-core',
  ],

  // UMD 全局变量映射
  globals: {
    vue: 'Vue',
    '@ldesign/cache-core': 'LDesignCacheCore',
  },

  // 清理输出目录
  clean: true,

  // 源码映射
  sourcemap: false,
})

