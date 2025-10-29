/**
 * Cache Vue Demo 入口文件
 */
import { createApp } from 'vue'
import { CacheProvider } from '@ldesign/cache-vue'
import { createCache } from '@ldesign/cache-core'
import App from './App.vue'
import './style.css'

const cache = createCache({
  defaultEngine: 'localStorage',
  defaultTTL: 60 * 1000, // 1分钟
  enablePerformanceTracking: true,
})

const app = createApp(App)

app.use(CacheProvider, { cache })
app.mount('#app')


