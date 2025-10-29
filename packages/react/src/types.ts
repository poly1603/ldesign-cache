/**
 * React 集成类型定义
 */
import type { ReactNode } from 'react'
import type { CacheManager, CacheOptions, SetOptions } from '@ldesign/cache-core'

/**
 * useCache 选项
 */
export interface UseCacheOptions<T = any> extends SetOptions {
  /**
   * 是否立即加载
   * @default true
   */
  immediate?: boolean

  /**
   * 初始值
   */
  initialValue?: T

  /**
   * 自动刷新间隔（毫秒）
   */
  refreshInterval?: number

  /**
   * 数据获取函数
   */
  fetcher?: () => Promise<T> | T

  /**
   * 依赖项数组（类似 useEffect）
   */
  deps?: any[]
}

/**
 * useCache 返回值
 */
export interface UseCacheReturn<T = any> {
  /**
   * 缓存数据
   */
  data: T | null

  /**
   * 加载状态
   */
  loading: boolean

  /**
   * 错误信息
   */
  error: Error | null

  /**
   * 是否存在
   */
  exists: boolean

  /**
   * 刷新数据
   */
  refresh: () => Promise<void>

  /**
   * 更新数据
   */
  update: (value: T, options?: SetOptions) => Promise<void>

  /**
   * 删除数据
   */
  remove: () => Promise<void>

  /**
   * 清空错误
   */
  clearError: () => void
}

/**
 * CacheProvider 组件属性
 */
export interface CacheProviderProps {
  /**
   * 子组件
   */
  children: ReactNode

  /**
   * 缓存管理器实例
   */
  cache?: CacheManager

  /**
   * 缓存配置选项
   */
  options?: CacheOptions
}


