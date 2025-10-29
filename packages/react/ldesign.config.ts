/**
 * @ldesign/cache-react 构建配置
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
      name: 'LDesignCacheReact',
      fileName: 'cache-react.umd.js',
    },
  },

  dts: true,
  sourcemap: true,
  minify: false,
  clean: true,

  external: [
    'react',
    'react-dom',
    '@ldesign/cache-core',
  ],

  globals: {
    react: 'React',
    'react-dom': 'ReactDOM',
    '@ldesign/cache-core': 'LDesignCacheCore',
  },
})


