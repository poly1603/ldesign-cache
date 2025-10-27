/**
 * 真实世界场景示例
 * 
 * 这个文件展示了在真实项目中如何使用 @ldesign/cache 解决常见问题
 */

import { createCache, createSmartCache, createSecureCache } from '@ldesign/cache'
import type { CacheManager } from '@ldesign/cache'

/**
 * 场景 1: 电商网站 - 产品列表缓存
 * 
 * 需求：
 * - 缓存产品列表数据
 * - 5分钟后过期
 * - 支持按分类缓存
 */
export class ProductCacheService {
  private cache: CacheManager

  constructor() {
    this.cache = createCache({
      defaultEngine: 'localStorage',
      defaultTTL: 5 * 60 * 1000, // 5分钟
      keyPrefix: 'product_',
    })
  }

  async getProducts(category: string) {
    const key = `list_${category}`

    // 尝试从缓存获取
    let products = await this.cache.get(key)

    if (!products) {
      // 缓存未命中，从 API 获取
      products = await this.fetchProductsFromAPI(category)

      // 存入缓存
      await this.cache.set(key, products)
    }

    return products
  }

  async clearCategory(category: string) {
    await this.cache.remove(`list_${category}`)
  }

  private async fetchProductsFromAPI(category: string) {
    // 模拟 API 调用
    console.log(`Fetching products for category: ${category}`)
    return [
      { id: 1, name: 'Product 1', price: 99 },
      { id: 2, name: 'Product 2', price: 199 },
    ]
  }
}

/**
 * 场景 2: SaaS 应用 - 多租户数据隔离
 * 
 * 需求：
 * - 不同租户的数据完全隔离
 * - 支持快速切换租户
 * - 租户数据加密存储
 */
export class TenantCacheService {
  private cache: CacheManager
  private currentTenant: string | null = null

  constructor() {
    this.cache = createSecureCache({
      keyPrefix: 'tenant_',
    })
  }

  switchTenant(tenantId: string) {
    this.currentTenant = tenantId
  }

  async set(key: string, value: any) {
    if (!this.currentTenant) {
      throw new Error('No tenant selected')
    }

    const tenantKey = `${this.currentTenant}:${key}`
    await this.cache.set(tenantKey, value)
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.currentTenant) {
      throw new Error('No tenant selected')
    }

    const tenantKey = `${this.currentTenant}:${key}`
    return await this.cache.get<T>(tenantKey)
  }

  async clearTenant(tenantId?: string) {
    const targetTenant = tenantId || this.currentTenant
    if (!targetTenant) {
      throw new Error('No tenant specified')
    }

    const allKeys = await this.cache.keys()
    const tenantKeys = allKeys.filter(key =>
      key.startsWith(`${targetTenant}:`),
    )

    for (const key of tenantKeys) {
      await this.cache.remove(key)
    }
  }
}

/**
 * 场景 3: 社交媒体应用 - 用户动态缓存
 * 
 * 需求：
 * - 缓存用户动态列表
 * - 智能选择存储引擎（图片用 IndexedDB，文本用 localStorage）
 * - 支持离线访问
 */
export class SocialFeedService {
  private cache: CacheManager

  constructor() {
    this.cache = createSmartCache() // 使用智能策略
  }

  async cacheFeed(userId: string, posts: any[]) {
    // 批量缓存帖子
    const operations = posts.map(post => ({
      key: `feed_${userId}_${post.id}`,
      value: post,
    }))

    await this.cache.mset(operations)

    // 缓存帖子 ID 列表（用于恢复顺序）
    const postIds = posts.map(p => p.id)
    await this.cache.set(`feed_${userId}_ids`, postIds)
  }

  async getFeed(userId: string) {
    // 获取帖子 ID 列表
    const postIds = await this.cache.get<string[]>(`feed_${userId}_ids`)

    if (!postIds || postIds.length === 0) {
      return []
    }

    // 批量获取帖子
    const keys = postIds.map(id => `feed_${userId}_${id}`)
    const results = await this.cache.mget(keys)

    return results.filter(r => r.value !== null)
  }

  async cacheImage(url: string, blob: Blob) {
    // 大文件自动使用 IndexedDB
    await this.cache.set(`image_${url}`, blob, {
      ttl: 24 * 60 * 60 * 1000, // 1天
    })
  }

  async getImage(url: string): Promise<Blob | null> {
    return await this.cache.get(`image_${url}`)
  }
}

/**
 * 场景 4: 在线表单 - 草稿自动保存
 * 
 * 需求：
 * - 表单数据实时自动保存
 * - 防抖处理，避免频繁保存
 * - 页面刷新后恢复数据
 */
export class FormDraftService {
  private cache: CacheManager
  private saveTimer: number | null = null
  private readonly SAVE_DELAY = 1000 // 1秒防抖

  constructor(formId: string) {
    this.cache = createCache({
      defaultEngine: 'localStorage',
      keyPrefix: `form_${formId}_`,
    })
  }

  autosave(data: any) {
    // 防抖保存
    if (this.saveTimer !== null) {
      clearTimeout(this.saveTimer)
    }

    this.saveTimer = setTimeout(async () => {
      await this.save(data)
      console.log('Draft saved at', new Date().toLocaleTimeString())
    }, this.SAVE_DELAY) as unknown as number
  }

  async save(data: any) {
    await this.cache.set('draft', {
      ...data,
      savedAt: Date.now(),
    })
  }

  async load() {
    const draft = await this.cache.get<any>('draft')
    return draft
  }

  async clear() {
    await this.cache.remove('draft')
  }

  async hasDraft(): Promise<boolean> {
    return await this.cache.has('draft')
  }
}

/**
 * 场景 5: 游戏应用 - 玩家进度保存
 * 
 * 需求：
 * - 保存玩家游戏进度
 * - 支持多个存档槽位
 * - 定期自动保存
 */
export class GameSaveService {
  private cache: CacheManager
  private autoSaveInterval: number | null = null

  constructor() {
    this.cache = createCache({
      defaultEngine: 'indexedDB', // 使用 IndexedDB 存储大量游戏数据
      keyPrefix: 'game_',
    })
  }

  async saveProgress(slot: number, progress: any) {
    const saveData = {
      ...progress,
      savedAt: Date.now(),
      version: '1.0.0',
    }

    await this.cache.set(`save_${slot}`, saveData)
    console.log(`Game saved to slot ${slot}`)
  }

  async loadProgress(slot: number) {
    const saveData = await this.cache.get<any>(`save_${slot}`)

    if (!saveData) {
      throw new Error(`No save data found in slot ${slot}`)
    }

    return saveData
  }

  async listSaves() {
    const saves = []

    for (let i = 1; i <= 5; i++) {
      const data = await this.cache.get<any>(`save_${i}`)
      if (data) {
        saves.push({
          slot: i,
          savedAt: data.savedAt,
          level: data.level || 1,
        })
      }
    }

    return saves
  }

  async deleteSave(slot: number) {
    await this.cache.remove(`save_${slot}`)
  }

  enableAutoSave(slot: number, interval = 60000) {
    this.autoSaveInterval = setInterval(() => {
      // 在实际应用中，这里应该获取当前游戏状态
      const currentProgress = this.getCurrentGameState()
      this.saveProgress(slot, currentProgress)
    }, interval) as unknown as number
  }

  disableAutoSave() {
    if (this.autoSaveInterval !== null) {
      clearInterval(this.autoSaveInterval)
      this.autoSaveInterval = null
    }
  }

  private getCurrentGameState() {
    // 模拟获取游戏状态
    return {
      level: 1,
      score: 0,
      health: 100,
      inventory: [],
    }
  }
}

/**
 * 场景 6: API 响应缓存 - 减少网络请求
 * 
 * 需求：
 * - 缓存 API 响应
 * - 基于 URL 和参数自动生成缓存键
 * - 支持强制刷新
 */
export class APICache {
  private cache: CacheManager

  constructor() {
    this.cache = createCache({
      defaultEngine: 'localStorage',
      defaultTTL: 10 * 60 * 1000, // 10分钟
      keyPrefix: 'api_',
    })
  }

  async fetch<T>(
    url: string,
    options?: {
      params?: Record<string, any>
      ttl?: number
      forceRefresh?: boolean
    },
  ): Promise<T> {
    const cacheKey = this.generateCacheKey(url, options?.params)

    // 如果不是强制刷新，尝试从缓存获取
    if (!options?.forceRefresh) {
      const cached = await this.cache.get<T>(cacheKey)
      if (cached !== null) {
        console.log(`Cache hit: ${cacheKey}`)
        return cached
      }
    }

    // 缓存未命中或强制刷新，发起请求
    console.log(`Cache miss: ${cacheKey}`)
    const response = await this.fetchFromAPI<T>(url, options?.params)

    // 存入缓存
    await this.cache.set(cacheKey, response, {
      ttl: options?.ttl,
    })

    return response
  }

  private generateCacheKey(url: string, params?: Record<string, any>): string {
    if (!params || Object.keys(params).length === 0) {
      return url
    }

    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&')

    return `${url}?${sortedParams}`
  }

  private async fetchFromAPI<T>(
    url: string,
    params?: Record<string, any>,
  ): Promise<T> {
    // 实际项目中应该使用真实的 fetch
    // const response = await fetch(url, { ... })
    // return response.json()

    // 模拟 API 调用
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({ data: 'mock data' } as T)
      }, 100)
    })
  }

  async invalidate(url: string, params?: Record<string, any>) {
    const cacheKey = this.generateCacheKey(url, params)
    await this.cache.remove(cacheKey)
  }

  async clear() {
    await this.cache.clear()
  }
}

/**
 * 使用示例
 */
export function examples() {
  // 示例 1: 产品缓存
  const productService = new ProductCacheService()
  productService.getProducts('electronics')

  // 示例 2: 多租户
  const tenantService = new TenantCacheService()
  tenantService.switchTenant('tenant-123')
  tenantService.set('config', { theme: 'dark' })

  // 示例 3: 社交动态
  const feedService = new SocialFeedService()
  feedService.cacheFeed('user-456', [
    { id: '1', content: 'Hello World!' },
    { id: '2', content: 'Another post' },
  ])

  // 示例 4: 表单草稿
  const formService = new FormDraftService('contact-form')
  formService.autosave({ name: 'John', email: 'john@example.com' })

  // 示例 5: 游戏存档
  const gameService = new GameSaveService()
  gameService.saveProgress(1, { level: 5, score: 1000 })

  // 示例 6: API 缓存
  const apiCache = new APICache()
  apiCache.fetch('/api/users', {
    params: { page: 1, limit: 10 },
    ttl: 5 * 60 * 1000,
  })
}

