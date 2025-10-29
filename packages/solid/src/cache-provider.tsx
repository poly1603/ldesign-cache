/**
 * Solid Cache Provider
 */
import { createContext, useContext } from 'solid-js'
import { createCache, type CacheManager } from '@ldesign/cache-core'
import type { CacheProviderProps } from './types'

const CacheContext = createContext<CacheManager>()

export function CacheProvider(props: CacheProviderProps) {
  const cacheInstance = props.cache || createCache(props.options)

  return (
    <CacheContext.Provider value={cacheInstance}>
      {props.children}
    </CacheContext.Provider>
  )
}

export function useCacheContext(): CacheManager {
  const cache = useContext(CacheContext)
  if (!cache) {
    throw new Error('useCacheContext must be used within CacheProvider')
  }
  return cache
}

