/**
 * Cache Vue Demo - Launcher 配置
 */
import { defineConfig } from '@ldesign/launcher'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3100,
    open: true,
  },
  build: {
    outDir: 'dist',
  },
})


