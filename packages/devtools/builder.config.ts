import { defineConfig } from '@ldesign/builder'

export default defineConfig({
  entry: 'src/index.ts',
  output: {
    formats: ['esm', 'cjs', 'umd'],
    name: 'LDesignCacheDevtools',
    dir: { esm: 'es', cjs: 'lib', umd: 'dist' },
    fileName: { esm: '[name].js', cjs: '[name].js', umd: 'cache-devtools.umd.js' },
  },
  external: ['@ldesign/cache-core'],
  dts: { enabled: true, outDir: 'dist' },
  minify: { enabled: true, formats: ['umd'] },
  sourcemap: true,
  clean: true,
})


