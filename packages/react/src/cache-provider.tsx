/**
 * React Cache Provider
 */
import React, { createContext, useContext, useMemo } from 'react'
import { createCache, type CacheManager } from '@ldesign/cache-core'
import type { CacheProviderProps } from './types'

/**
 * Cache Context
 */
const CacheContext = createContext<CacheManager | null>(null)

/**
 * Cache Provider 组件
 *
 * @example
 * ```tsx
 * import { CacheProvider } from '@ldesign/cache-react'
 * import { createCache } from '@ldesign/cache-core'
 *
 * const cache = createCache({ defaultEngine: 'localStorage' })
 *
 * function App() {
 *   return (
 *     <CacheProvider cache={cache}>
 *       <YourApp />
 *     </CacheProvider>
 *   )
 * }
 * ```
 */
export function CacheProvider({ children, cache, options }: CacheProviderProps) {
  const cacheInstance = useMemo(() => {
    return cache || createCache(options)
  }, [cache, options])

  return (
    <CacheContext.Provider value={cacheInstance}>
      {children}
    </CacheContext.Provider>
  )
}

/**
 * 使用 Cache Context
 *
 * @returns CacheManager 实例
 * @throws 如果在 CacheProvider 外部使用
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const cache = useCacheContext()
 *   // 使用 cache...
 * }
 * ```
 */
export function useCacheContext(): CacheManager {
  const cache = useContext(CacheContext)
  if (!cache) {
    throw new Error('useCacheContext must be used within CacheProvider')
  }
  return cache
}


