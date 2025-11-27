/**
 * @ldesign/cache-vue Builder Configuration
 *
 * Vue 3 适配层，提供响应式缓存能力
 * 依赖 @ldesign/cache-core 核心库
 */
import { defineConfig } from '@ldesign/builder'

export default defineConfig({
  // 输入配置 - 使用主入口文件
  entry: 'src/index.ts',

  // 输出配置 - TDesign 风格
  output: {
    // ES 模块 - 使用 .mjs
    es: {
      dir: 'es',
      sourcemap: true,
    },

    // ESM 模块 - 使用 .js
    esm: {
      dir: 'esm',
      sourcemap: true,
    },

    // CJS 模块
    cjs: {
      dir: 'cjs',
      sourcemap: true,
    },

    // UMD 模块
    umd: {
      dir: 'dist',
      name: 'LDesignCacheVue',
      globals: {
        'vue': 'Vue',
        '@ldesign/cache-core': 'LDesignCacheCore',
      },
    },
  },

  // 外部依赖
  external: ['vue', '@ldesign/cache-core'],

  // 全局变量映射 (UMD 使用)
  globals: {
    'vue': 'Vue',
    '@ldesign/cache-core': 'LDesignCacheCore',
  },

  // 库类型
  libraryType: 'vue3',

  // 打包器
  bundler: 'rollup',

  // 类型声明
  dts: {
    enabled: true,
  },
})
