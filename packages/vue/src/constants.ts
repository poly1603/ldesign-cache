import type { InjectionKey } from 'vue'
import type { CacheManager } from '@ldesign/cache-core'

export const CACHE_INJECTION_KEY: InjectionKey<CacheManager<any>> = Symbol('ldesign-cache')
