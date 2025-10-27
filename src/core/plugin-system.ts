/**
 * 缓存插件系统
 * 
 * 提供可扩展的插件机制，允许在缓存操作的生命周期中插入自定义逻辑
 * 
 * 支持的钩子：
 * - onInit: 缓存初始化时
 * - onSet: 设置缓存时
 * - onGet: 获取缓存时  
 * - onRemove: 删除缓存时
 * - onClear: 清空缓存时
 * - onError: 发生错误时
 * - onDestroy: 缓存销毁时
 * 
 * @example
 * ```typescript
 * const loggingPlugin: CachePlugin = {
 *   name: 'logging',
 *   version: '1.0.0',
 *   
 *   onSet: async (event) => {
 *     console.log('[Cache] SET:', event.key)
 *   },
 *   
 *   onGet: async (event) => {
 *     console.log('[Cache] GET:', event.key, event.value ? 'HIT' : 'MISS')
 *   },
 * }
 * 
 * const cache = new CacheManager()
 * cache.use(loggingPlugin)
 * ```
 */

import type { CacheEvent } from '../types'
import type { CacheManager } from './cache-manager'

/**
 * 缓存插件接口
 */
export interface CachePlugin {
  /** 插件名称（唯一标识） */
  name: string

  /** 插件版本 */
  version: string

  /** 插件描述（可选） */
  description?: string

  /** 插件作者（可选） */
  author?: string

  // 生命周期钩子（可选实现）

  /**
   * 初始化钩子
   * 
   * 在缓存管理器初始化完成后调用
   * 
   * @param cache - 缓存管理器实例
   */
  onInit?(cache: CacheManager): void | Promise<void>

  /**
   * 设置缓存钩子
   * 
   * 在缓存项设置时调用
   * 
   * @param event - 缓存事件
   */
  onSet?(event: CacheEvent): void | Promise<void>

  /**
   * 获取缓存钩子
   * 
   * 在缓存项获取时调用
   * 
   * @param event - 缓存事件
   */
  onGet?(event: CacheEvent): void | Promise<void>

  /**
   * 删除缓存钩子
   * 
   * 在缓存项删除时调用
   * 
   * @param event - 缓存事件
   */
  onRemove?(event: CacheEvent): void | Promise<void>

  /**
   * 清空缓存钩子
   * 
   * 在清空缓存时调用
   * 
   * @param event - 缓存事件
   */
  onClear?(event: CacheEvent): void | Promise<void>

  /**
   * 错误处理钩子
   * 
   * 在发生错误时调用
   * 
   * @param event - 缓存事件（包含错误信息）
   */
  onError?(event: CacheEvent): void | Promise<void>

  /**
   * 销毁钩子
   * 
   * 在缓存管理器销毁前调用
   * 
   * @param cache - 缓存管理器实例
   */
  onDestroy?(cache: CacheManager): void | Promise<void>
}

/**
 * 插件管理器
 */
export class PluginManager {
  /** 已注册的插件 */
  private plugins = new Map<string, CachePlugin>()

  /** 插件注册顺序 */
  private pluginOrder: string[] = []

  /**
   * 注册插件
   * 
   * @param plugin - 插件实例
   * @throws {Error} 当插件名称已存在时
   */
  register(plugin: CachePlugin): void {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin "${plugin.name}" is already registered`)
    }

    this.plugins.set(plugin.name, plugin)
    this.pluginOrder.push(plugin.name)
  }

  /**
   * 注销插件
   * 
   * @param name - 插件名称
   * @returns 是否成功注销
   */
  unregister(name: string): boolean {
    const removed = this.plugins.delete(name)

    if (removed) {
      const index = this.pluginOrder.indexOf(name)
      if (index > -1) {
        this.pluginOrder.splice(index, 1)
      }
    }

    return removed
  }

  /**
   * 获取插件
   * 
   * @param name - 插件名称
   * @returns 插件实例或undefined
   */
  getPlugin(name: string): CachePlugin | undefined {
    return this.plugins.get(name)
  }

  /**
   * 获取所有插件
   * 
   * @returns 插件数组（按注册顺序）
   */
  getAllPlugins(): CachePlugin[] {
    return this.pluginOrder.map(name => this.plugins.get(name)!)
  }

  /**
   * 调用钩子
   * 
   * 按注册顺序依次调用所有插件的指定钩子
   * 
   * @param hook - 钩子名称
   * @param args - 钩子参数
   */
  async callHook(hook: keyof CachePlugin, ...args: any[]): Promise<void> {
    // 按注册顺序执行
    for (const name of this.pluginOrder) {
      const plugin = this.plugins.get(name)
      if (!plugin) {
        continue
      }

      const fn = plugin[hook]
      if (typeof fn === 'function') {
        try {
          await fn.apply(plugin, args)
        }
        catch (error) {
          console.error(`[Plugin:${plugin.name}] Hook "${hook}" failed:`, error)
          // 钩子失败不中断其他插件
        }
      }
    }
  }

  /**
   * 检查插件是否已注册
   * 
   * @param name - 插件名称
   * @returns 是否已注册
   */
  hasPlugin(name: string): boolean {
    return this.plugins.has(name)
  }

  /**
   * 清空所有插件
   */
  clear(): void {
    this.plugins.clear()
    this.pluginOrder = []
  }

  /**
   * 获取统计信息
   * 
   * @returns 统计信息
   */
  getStats(): {
    totalPlugins: number
    plugins: Array<{ name: string, version: string }>
  } {
    return {
      totalPlugins: this.plugins.size,
      plugins: Array.from(this.plugins.values()).map(p => ({
        name: p.name,
        version: p.version,
      })),
    }
  }
}

/**
 * 内置插件：性能监控插件
 */
export function createPerformancePlugin(): CachePlugin {
  const operationTimes: Record<string, number[]> = {}

  return {
    name: 'performance-monitor',
    version: '1.0.0',
    description: '监控缓存操作性能',

    onSet: async (event) => {
      // 记录SET操作（实际耗时需要外部测量）
    },

    onGet: async (event) => {
      // 记录GET操作
    },
  }
}

/**
 * 内置插件：日志插件
 */
export function createLoggingPlugin(options?: {
  logLevel?: 'debug' | 'info' | 'warn' | 'error'
  filter?: (event: CacheEvent) => boolean
}): CachePlugin {
  const logLevel = options?.logLevel || 'info'
  const filter = options?.filter || (() => true)

  return {
    name: 'logging',
    version: '1.0.0',
    description: '记录缓存操作日志',

    onSet: async (event) => {
      if (filter(event) && logLevel === 'debug') {
        console.log(`[Cache] SET: ${event.key} -> ${event.engine}`)
      }
    },

    onGet: async (event) => {
      if (filter(event) && logLevel === 'debug') {
        console.log(`[Cache] GET: ${event.key} -> ${event.value ? 'HIT' : 'MISS'}`)
      }
    },

    onError: async (event) => {
      if (filter(event)) {
        console.error(`[Cache] ERROR: ${event.key}`, event.error)
      }
    },
  }
}

/**
 * 内置插件：统计插件
 */
export function createStatsPlugin(): CachePlugin {
  const stats = {
    sets: 0,
    gets: 0,
    removes: 0,
    hits: 0,
    misses: 0,
    errors: 0,
  }

  return {
    name: 'stats-collector',
    version: '1.0.0',
    description: '收集缓存操作统计',

    onSet: async () => {
      stats.sets++
    },

    onGet: async (event) => {
      stats.gets++
      if (event.value !== null && event.value !== undefined) {
        stats.hits++
      }
      else {
        stats.misses++
      }
    },

    onRemove: async () => {
      stats.removes++
    },

    onError: async () => {
      stats.errors++
    },

    // 扩展方法（非标准）
    getStats: () => ({ ...stats }),
    resetStats: () => {
      stats.sets = 0
      stats.gets = 0
      stats.removes = 0
      stats.hits = 0
      stats.misses = 0
      stats.errors = 0
    },
  }
}

