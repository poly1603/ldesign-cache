/**
 * @ldesign/cache-core 构建配置
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
      name: 'LDesignCacheCore',
      fileName: 'cache-core.umd.js',
    },
  },

  dts: true,
  sourcemap: true,
  minify: false,
  clean: true,

  external: [
    'idb',
  ],
})


