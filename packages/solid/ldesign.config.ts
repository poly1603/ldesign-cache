/**
 * @ldesign/cache-solid 构建配置
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
      name: 'LDesignCacheSolid',
      fileName: 'cache-solid.umd.js',
    },
  },

  dts: true,
  sourcemap: true,
  minify: false,
  clean: true,

  external: [
    'solid-js',
    'solid-js/store',
    '@ldesign/cache-core',
  ],

  globals: {
    'solid-js': 'solid',
    '@ldesign/cache-core': 'LDesignCacheCore',
  },
})

