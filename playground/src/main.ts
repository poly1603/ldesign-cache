import { createVueEngine } from '@ldesign/engine-vue3'
import { createCacheEnginePlugin } from '@ldesign/cache-vue'
import { CacheStrategy } from '@ldesign/cache-core'
import App from './App.vue'
import './styles.css'

const cachePlugin = createCacheEnginePlugin({
  strategy: CacheStrategy.LRU,
  maxSize: 200,
  defaultTTL: 15_000,
  enableStats: true,
  enablePersistence: true,
  storageType: 'localStorage',
  storagePrefix: 'cache-playground:',
  vue: {
    globalPropertyName: '$cache',
    registerDirective: true,
    registerComponents: true,
  },
})

const engine = createVueEngine({
  name: 'Cache Playground',
  debug: true,
  app: {
    rootComponent: App,
  },
  plugins: [cachePlugin as any],
})

void engine.mount('#app')
