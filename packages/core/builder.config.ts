/**
 * @ldesign/cache-core 构建配置
 */
import { defineConfig } from '@ldesign/builder'

export default defineConfig({
  entry: 'src/index.ts',
  output: {
    formats: ['esm', 'cjs', 'umd'],
    name: 'LDesignCacheCore',
    dir: {
      esm: 'es',
      cjs: 'lib',
      umd: 'dist',
    },
    fileName: {
      esm: '[name].js',
      cjs: '[name].js',
      umd: 'cache-core.umd.js',
    },
  },
  external: [],
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


