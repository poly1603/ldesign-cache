import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@ldesign/cache-core': resolve(__dirname, '../packages/core/src/index.ts'),
      '@ldesign/cache-vue': resolve(__dirname, '../packages/vue/src/index.ts'),
      '@ldesign/engine-vue3': resolve(__dirname, '../../engine/packages/vue3/src/index.ts'),
      '@ldesign/engine-core': resolve(__dirname, '../../engine/packages/core/src/index.ts'),
    },
  },
  server: {
    port: 5195,
    open: true,
  },
})
