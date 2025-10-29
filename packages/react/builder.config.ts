/**
 * @ldesign/cache-react 构建配置
 */
import { defineConfig } from '@ldesign/builder'

export default defineConfig({
  entry: 'src/index.ts',
  output: {
    formats: ['esm', 'cjs', 'umd'],
    name: 'LDesignCacheReact',
    dir: {
      esm: 'es',
      cjs: 'lib',
      umd: 'dist',
    },
    fileName: {
      esm: '[name].js',
      cjs: '[name].js',
      umd: 'cache-react.umd.js',
    },
  },
  external: ['react', '@ldesign/cache-core'],
  globals: {
    react: 'React',
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


