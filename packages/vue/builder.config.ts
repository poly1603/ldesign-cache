/**
 * @ldesign/cache-vue 构建配置
 */
import { defineConfig } from '@ldesign/builder'

export default defineConfig({
  entry: 'src/index.ts',
  output: {
    formats: ['esm', 'cjs', 'umd'],
    name: 'LDesignCacheVue',
    dir: {
      esm: 'es',
      cjs: 'lib',
      umd: 'dist',
    },
    fileName: {
      esm: '[name].js',
      cjs: '[name].js',
      umd: 'cache-vue.umd.js',
    },
  },
  external: ['vue', '@ldesign/cache-core'],
  globals: {
    vue: 'Vue',
    '@ldesign/cache-core': 'LDesignCacheCore',
  },
  dts: {
    enabled: true,
    outDir: 'dist',
  },
  minify: {
    enabled: true,
    formats: ['umd'],
  },
  sourcemap: true,
  clean: true,
})


