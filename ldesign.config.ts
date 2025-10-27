import { defineConfig } from '@ldesign/builder'

export default defineConfig({
  input: 'src/index.ts',

  output: {
    format: ['esm', 'cjs', 'umd'],
    name: 'LDesignCache',
    globals: {
      vue: 'Vue'
    },
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
    },
  },

  dts: true,
  sourcemap: true,
  clean: true,

  external: [
    'vue',
    '@ldesign/shared'
  ],
})
