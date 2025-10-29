/**
 * @ldesign/cache-lit 构建配置
 */
import { defineConfig } from '@ldesign/builder'

export default defineConfig({
  entry: 'src/index.ts',
  output: {
    formats: ['esm', 'cjs', 'umd'],
    name: 'LDesignCacheLit',
    dir: {
      esm: 'es',
      cjs: 'lib',
      umd: 'dist',
    },
    fileName: {
      esm: '[name].js',
      cjs: '[name].js',
      umd: 'cache-lit.umd.js',
    },
  },
  external: ['lit', 'lit/directive.js', 'lit/directives/async-directive.js', '@ldesign/cache-core'],
  globals: {
    lit: 'Lit',
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


