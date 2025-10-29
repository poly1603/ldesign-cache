/**
 * @ldesign/cache-lit 构建配置
 */
import { defineConfig } from '@ldesign/builder'

export default defineConfig({
  input: 'src/index.ts',

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
      name: 'LDesignCacheLit',
      fileName: 'cache-lit.umd.js',
    },
  },

  dts: true,
  sourcemap: true,
  minify: false,
  clean: true,

  external: [
    'lit',
    /^lit\//,
    '@ldesign/cache-core',
  ],

  globals: {
    lit: 'Lit',
    '@ldesign/cache-core': 'LDesignCacheCore',
  },
})


