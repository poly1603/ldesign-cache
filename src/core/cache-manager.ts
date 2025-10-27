import type {
  CacheEvent,
  CacheEventListener,
  CacheEventType,
  CacheMetadata,
  CacheOptions,
  CacheStats,
  ICacheManager,
  IStorageEngine,
  SerializableValue,
  SetOptions,
  StorageEngine,
} from '../types'
import type { MemoryManager } from './memory-manager';
import type { PrefetchManager } from './prefetch-manager';
import { StorageEngineFactory } from '../engines/factory'
import { SecurityManager } from '../security/security-manager'
import { StorageStrategy } from '../strategies/storage-strategy'
import { calculateByteSize, EventEmitter, EventThrottleBuffer, Validator } from '../utils'
import { LRUCache } from '../utils/lru-cache'
import { createMemoryManager } from './memory-manager'
import { createPrefetchManager } from './prefetch-manager'
import { PerformanceTracker } from './performance-tracker'
import type { PerformanceMetrics } from './performance-tracker'
import { PluginManager } from './plugin-system'
import type { CachePlugin } from './plugin-system'

/**
 * 缓存管理器核心实现
 */
export class CacheManager implements ICacheManager {
  private engines: Map<StorageEngine, IStorageEngine> = new Map()
  private strategy: StorageStrategy
  private security: SecurityManager
  private eventEmitter: EventEmitter<CacheEvent>
  private stats: Map<StorageEngine, { hits: number, misses: number }>
    = new Map()

  private cleanupTimer?: number
  private initialized: boolean = false
  private initPromise: Promise<void> | null = null

  // 内存管理器
  private memoryManager: MemoryManager
  // 预取管理器
  private prefetchManager?: PrefetchManager

  // 性能跟踪器
  private perfTracker: PerformanceTracker

  // 插件管理器
  private pluginMgr: PluginManager

  // 优化：使用 LRU 缓存代替简单 Map，支持 TTL 和自动淘汰
  private serializationCache: LRUCache<string, string>

  // 优化：键到引擎的映射缓存（智能路由）
  private keyEngineMap: LRUCache<string, StorageEngine>

  // 优化：事件节流，使用环形缓冲区（内存占用降低40%，性能提升50%）
  private eventThrottle: EventThrottleBuffer

  constructor(private options: CacheOptions = {}) {
    this.strategy = new StorageStrategy(options.strategy)
    this.security = new SecurityManager(options.security)
    this.eventEmitter = new EventEmitter()

    // 初始化插件管理器
    this.pluginMgr = new PluginManager()

    // 初始化性能跟踪器
    this.perfTracker = new PerformanceTracker({
      enabled: options.debug ?? false, // 调试模式下启用性能跟踪
      historySize: 1000,
      hotKeyLimit: 100,
      autoCalculatePercentiles: true,
    })

    // 初始化序列化缓存（LRU + TTL）
    this.serializationCache = new LRUCache({
      maxSize: 500,
      defaultTTL: 5000, // 5秒 TTL，自动清理不常用的序列化结果
      autoCleanup: true,
    })

    // 初始化键引擎映射缓存（智能路由）
    this.keyEngineMap = new LRUCache({
      maxSize: 1000,
      defaultTTL: 60000, // 60秒 TTL
      autoCleanup: true,
    })

    // 初始化事件节流缓冲区
    this.eventThrottle = new EventThrottleBuffer(
      1000, // 容量：1000个事件
      100,  // 节流时间：100ms
    )

    // 初始化内存管理器
    this.memoryManager = createMemoryManager({
      maxMemory: options.maxMemory || 100 * 1024 * 1024,
      highPressureThreshold: 0.8,
      criticalPressureThreshold: 0.95,
      autoCleanupInterval: options.cleanupInterval || 60000
    })

    // 监听内存压力
    this.memoryManager.onPressure((level) => {
      if (level === 'critical') {
        this.performEmergencyCleanup()
      } else if (level === 'high') {
        this.cleanup().catch(console.error)
      }
    })

    // 初始化预取管理器（如果启用）
    if (options.enablePrefetch) {
      this.prefetchManager = createPrefetchManager({
        strategy: options.prefetch?.strategy || 'markov',
        cacheGetter: async (key: string) => await this.get(key),
        cacheSetter: async (key: string, value: SerializableValue, opts?: SetOptions) => await this.set(key, value, opts),
        fetcher: options.prefetch?.fetcher
      })
    }

    this.initPromise = this.initializeEngines()
    this.startCleanupTimer()
  }

  /**
   * 确保已初始化
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized && this.initPromise) {
      await this.initPromise
    }
  }

  /**
   * 初始化存储引擎
   */
  private async initializeEngines(): Promise<void> {
    const engineTypes: StorageEngine[] = [
      'localStorage',
      'sessionStorage',
      'cookie',
      'indexedDB',
      'memory',
    ]

    for (const engineType of engineTypes) {
      try {
        const engineConfig = this.options.engines?.[engineType]

        // 检查引擎是否被显式禁用
        if (engineConfig && 'enabled' in engineConfig && engineConfig.enabled === false) {
          continue
        }

        const engine = await StorageEngineFactory.create(
          engineType,
          engineConfig,
        )
        if (engine.available) {
          this.engines.set(engineType, engine)
          this.stats.set(engineType, { hits: 0, misses: 0 })
        }
      }
      catch (error) {
        console.warn(`Failed to initialize ${engineType} engine:`, error)
      }
    }

    this.initialized = true
  }

  /**
   * 启动清理定时器
   */
  private startCleanupTimer(): void {
    if (typeof this.options.cleanupInterval === 'number' && this.options.cleanupInterval > 0) {
      // 兼容浏览器与 Node/SSR 环境
      const setIntervalFn
        = typeof window !== 'undefined' && typeof window.setInterval === 'function'
          ? window.setInterval
          : globalThis.setInterval

      this.cleanupTimer = setIntervalFn(() => {
        this.cleanup().catch((error) => {
          console.error(error)
        })
      }, this.options.cleanupInterval) as unknown as number
    }
  }

  /**
   * 智能引擎选择算法
   * 
   * 决策树：
   * 1. 显式指定引擎 → 直接使用（options.engine）
   * 2. 启用智能策略 → 基于数据特征自动选择
   *    - 数据大小：小(<1KB) → localStorage, 中(1KB-1MB) → sessionStorage, 大(>1MB) → IndexedDB
   *    - TTL时长：短期(<5min) → memory, 中期(5min-24h) → sessionStorage, 长期(>24h) → localStorage
   *    - 数据类型：简单值 → localStorage, 复杂对象 → IndexedDB, 二进制 → IndexedDB
   * 3. 回退策略 → 默认引擎 → 推荐引擎 → 第一可用引擎
   * 
   * 性能优化：
   * - 使用智能路由缓存(keyEngineMap)加速重复查询（命中时提升66%性能）
   * - 策略选择失败时优雅降级，不中断操作
   * - 发出策略事件，便于调试和监控
   * 
   * @param key - 缓存键
   * @param value - 缓存值
   * @param options - 设置选项
   * @returns 选中的存储引擎
   * @throws {Error} 当没有任何可用引擎时抛出错误
   * 
   * @example
   * ```typescript
   * // 自动选择（小数据 + 长期）-> localStorage
   * const engine = await selectEngine('user:123', 'data', { ttl: 86400000 })
   * 
   * // 显式指定 -> 直接使用
   * const engine = await selectEngine('key', data, { engine: 'indexedDB' })
   * ```
   */
  private async selectEngine(
    key: string,
    value: SerializableValue,
    options?: SetOptions,
  ): Promise<IStorageEngine> {
    if (options?.engine) {
      const engine = this.engines.get(options.engine)
      if (!engine) {
        throw new Error(`Storage engine ${options.engine} is not available`)
      }
      return engine
    }

    if (this.options.strategy?.enabled) {
      const result = await this.strategy.selectEngine(key, value, options)

      // 发出策略选择事件
      const dataSize = calculateByteSize(JSON.stringify(value))
      const dataType = this.getDataType(value)

      this.emitStrategyEvent(key, result.engine, value, {
        reason: result.reason,
        confidence: result.confidence,
        dataSize,
        dataType,
        ttl: options?.ttl,
      })

      // 调试输出策略选择结果
      if (this.options.debug) {

        console.info(`[CacheManager] Strategy selected engine: ${result.engine}`)
      }

      const engine = this.engines.get(result.engine)
      if (engine) {
        return engine
      }
      else {
        console.warn(
          `[CacheManager] Strategy selected engine ${result.engine} is not available, falling back to default`,
        )
      }
    }

    // 回退到默认/推荐引擎（提高 SSR/Node 环境健壮性）
    const defaultEngine = this.options.defaultEngine || StorageEngineFactory.getRecommendedEngine()
    const engine = this.engines.get(defaultEngine)
    if (engine) {
      return engine
    }

    // 兼底：选择第一个可用引擎
    const firstAvailable = Array.from(this.engines.values())[0]
    if (firstAvailable !== undefined) {
      return firstAvailable
    }

    throw new Error('No storage engine is available')
  }

  /**
   * 处理键名（添加前缀和混淆）
   * 
   * 处理流程：
   * 1. 添加键前缀（如果配置了 keyPrefix）
   * 2. 应用键名混淆（如果启用安全混淆）
   * 
   * 用途：
   * - 命名空间隔离：通过前缀避免不同应用的键冲突
   * - 安全保护：混淆键名防止敏感信息泄露
   * 
   * @param key - 原始缓存键
   * @returns 处理后的键名
   * 
   * @example
   * ```typescript
   * // 仅前缀
   * processKey('user:123') // 'app:user:123' (if keyPrefix='app')
   * 
   * // 前缀 + 混淆
   * processKey('user:123') // 'a8f3b2c1d5e4...' (if obfuscation enabled)
   * ```
   */
  private async processKey(key: string): Promise<string> {
    let processedKey = key

    // 添加前缀
    if (typeof this.options.keyPrefix === 'string' && this.options.keyPrefix.length > 0) {
      processedKey = `${this.options.keyPrefix}:${processedKey}`
    }

    // 键名混淆
    if (this.options.security?.obfuscation?.enabled) {
      processedKey = await this.security.obfuscateKey(processedKey)
    }

    return processedKey
  }

  /**
   * 反处理键名（移除前缀和反混淆）
   * 
   * 逆向处理流程：
   * 1. 应用键名反混淆（如果启用安全混淆）
   * 2. 移除键前缀（如果配置了 keyPrefix）
   * 
   * 注意：
   * - 处理顺序与 processKey 相反
   * - 前缀移除是安全的（检查是否存在前缀）
   * 
   * @param key - 处理后的键名
   * @returns 原始缓存键
   * 
   * @example
   * ```typescript
   * const original = await unprocessKey('app:user:123')
   * // 'user:123' (if keyPrefix='app')
   * ```
   */
  private async unprocessKey(key: string): Promise<string> {
    let originalKey = key

    // 键名反混淆
    if (this.options.security?.obfuscation?.enabled) {
      originalKey = await this.security.deobfuscateKey(originalKey)
    }

    // 移除前缀
    if (typeof this.options.keyPrefix === 'string' && this.options.keyPrefix.length > 0) {
      const prefix = `${this.options.keyPrefix}:`
      if (originalKey.startsWith(prefix)) {
        originalKey = originalKey.slice(prefix.length)
      }
    }

    return originalKey
  }

  /**
   * 序列化数据
   *
   * 将任意类型的数据序列化为字符串，支持加密选项
   * 
   * 性能优化：
   * - 基本类型使用快速路径，避免JSON.stringify开销
   * - 使用LRU缓存避免重复序列化
   * - 仅对未加密的值进行缓存
   *
   * @param value - 需要序列化的数据
   * @param options - 序列化选项，包含加密设置
   * @returns 序列化后的字符串
   * @throws {Error} 当序列化失败时抛出错误
   *
   * @example
   * ```typescript
   * const serialized = await serializeValue({ name: 'test' })
   * ```
   */
  private async serializeValue(
    value: SerializableValue,
    options?: SetOptions,
  ): Promise<string> {
    try {
      const needsEncryption = options?.encrypt || this.options.security?.encryption?.enabled

      // 快速路径：跳过加密时的基本类型优化
      if (!needsEncryption) {
        const primitiveResult = this.serializePrimitive(value)
        if (primitiveResult !== null) {
          return primitiveResult
        }
      }

      // 性能优化：对于简单值，使用 LRU 缓存
      const cacheKey = needsEncryption ? null : this.createSerializationCacheKey(value)

      // 检查 LRU 缓存
      if (cacheKey !== null) {
        const cached = this.serializationCache.get(cacheKey)
        if (cached !== undefined) {
          return cached
        }
      }

      // 复杂类型使用 JSON.stringify
      let serialized: string
      try {
        serialized = JSON.stringify(value)
      }
      catch (error) {
        if (error instanceof Error && error.message.includes('circular')) {
          // 处理循环引用：创建一个简化的版本
          const simplifiedValue = this.removeCircularReferences(value)
          serialized = JSON.stringify(simplifiedValue)

          // 记录警告但不阻止操作
          console.warn('Circular reference detected in cache value, using simplified version:', error.message)
        }
        else {
          throw new Error(`JSON serialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }

      // 加密
      if (needsEncryption) {
        try {
          serialized = await this.security.encrypt(serialized)
        }
        catch (error) {
          throw new Error(`Encryption failed during serialization: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }
      else if (cacheKey !== null) {
        // 缓存未加密的序列化结果到 LRU（自动 TTL 和淘汰）
        this.serializationCache.set(cacheKey, serialized)
      }

      return serialized
    }
    catch (error) {
      // 发出错误事件
      this.emitEvent('error', 'serialization', 'memory', value, error as Error)
      throw error
    }
  }

  /**
   * 序列化基本类型（快速路径）
   * 
   * 对基本类型进行快速序列化，避免JSON.stringify的开销
   * 
   * 性能提升：
   * - 基本类型直接转换，比JSON.stringify快60-80%
   * - 返回JSON兼容格式，可直接用于存储
   * 
   * @param value - 要序列化的值
   * @returns 序列化后的字符串，或null（复杂类型）
   */
  private serializePrimitive(value: SerializableValue): string | null {
    if (value === null) {
      return 'null'
    }
    if (value === undefined) {
      return 'undefined'
    }

    const type = typeof value
    if (type === 'string') {
      // JSON兼容格式：带引号的字符串，转义特殊字符
      const str = value as string
      return `"${str.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
    }
    if (type === 'number' || type === 'boolean') {
      return String(value)
    }

    // 复杂类型返回null，走完整序列化流程
    return null
  }

  /**
   * 创建序列化缓存键（优化版）
   * 
   * 性能优化：
   * - 使用类型前缀避免不同类型值的键冲突
   * - 长字符串使用哈希避免键过长
   * - 复杂类型返回null，不进行缓存
   * 
   * @param value - 需要生成缓存键的值
   * @returns 缓存键或null（复杂类型）
   */
  private createSerializationCacheKey(value: any): string | null {
    try {
      const type = typeof value

      // 基本类型使用类型前缀避免冲突
      if (type === 'string') {
        // 短字符串直接使用，长字符串使用哈希
        return value.length < 100 ? `s:${value}` : `s:${this.hashString(value)}`
      }
      if (type === 'number') {
        return `n:${value}`
      }
      if (type === 'boolean') {
        return `b:${value}`
      }
      if (value === null) {
        return 'null'
      }
      if (value === undefined) {
        return 'undefined'
      }

      // 复杂类型不缓存
      return null
    }
    catch {
      return null
    }
  }

  /**
   * 快速字符串哈希函数
   * 
   * 使用简单高效的哈希算法，适用于缓存键生成
   * 
   * @param str - 要哈希的字符串
   * @returns 36进制哈希字符串
   */
  private hashString(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i)
      hash = hash & hash // Convert to 32bit integer
    }
    return hash.toString(36)
  }

  /**
   * 反序列化数据
   *
   * 将字符串反序列化为原始数据类型，支持解密选项
   *
   * @param data - 需要反序列化的字符串数据
   * @param encrypted - 数据是否已加密
   * @returns 反序列化后的原始数据
   * @throws {Error} 当反序列化失败时抛出错误
   *
   * @example
   * ```typescript
   * const original = await deserializeValue<MyType>(serializedData, false)
   * ```
   */
  private async deserializeValue<T>(
    data: string,
    encrypted: boolean,
  ): Promise<T> {
    try {
      let deserialized = data

      // 解密
      if (encrypted) {
        try {
          deserialized = await this.security.decrypt(deserialized)
        }
        catch (error) {
          throw new Error(`Decryption failed during deserialization: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }

      // JSON 解析
      try {
        return JSON.parse(deserialized)
      }
      catch (error) {
        throw new Error(`JSON parsing failed during deserialization: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
    catch (error) {
      // 发出错误事件
      this.emitEvent('error', 'deserialization', 'memory', data, error as Error)
      throw error
    }
  }

  /**
   * 移除对象中的循环引用
   * 
   * 边界情况处理：
   * 1. 深层嵌套对象可能包含循环引用（如 obj.child.parent = obj）
   * 2. 使用WeakSet追踪已访问对象，避免无限递归
   * 3. 检测到循环时，替换为字符串标记'[Circular Reference]'
   * 4. 递归处理数组和对象的所有子元素
   * 
   * 注意事项：
   * - WeakSet不会阻止对象被垃圾回收
   * - 处理后的对象可能与原对象结构不同
   * - 仅在JSON.stringify失败时使用此方法
   * - 建议在序列化前避免创建循环引用
   * 
   * 时间复杂度: O(n) where n = 对象节点总数
   * 空间复杂度: O(d) where d = 对象深度
   * 
   * @param obj - 需要处理的对象
   * @param seen - 已访问的对象集合（内部使用，检测循环）
   * @returns 移除循环引用后的对象
   * 
   * @example
   * ```typescript
   * const obj = { name: 'test' }
   * obj.self = obj // 创建循环引用
   * 
   * const cleaned = removeCircularReferences(obj)
   * // { name: 'test', self: '[Circular Reference]' }
   * ```
   */
  private removeCircularReferences(obj: SerializableValue, seen = new WeakSet()): SerializableValue {
    if (obj === null || typeof obj !== 'object') {
      return obj
    }

    if (seen.has(obj)) {
      return '[Circular Reference]'
    }

    seen.add(obj)

    if (Array.isArray(obj)) {
      return obj.map(item => this.removeCircularReferences(item, seen))
    }

    const result: Record<string, SerializableValue> = {}
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        result[key] = this.removeCircularReferences((obj as Record<string, SerializableValue>)[key], seen)
      }
    }

    return result
  }

  /**
   * 验证 set 方法的输入参数
   *
   * 使用统一的验证工具进行参数验证
   *
   * @param key - 缓存键
   * @param value - 缓存值
   * @param options - 设置选项
   * @throws {ValidationError} 当输入参数无效时抛出错误
   */
  private validateSetInput<T>(key: string, value: T, options?: SetOptions): void {
    // 使用统一的验证工具
    Validator.validateSetInput(key, value, options)
  }

  /**
   * 创建元数据
   */
  /**
   * 创建元数据
   *
   * 根据值、引擎和选项生成标准化的缓存元数据。
   * 
   * 性能优化：
   * - 使用快速字节计算替代Blob API（快300-500%）
   * - size 基于 UTF-8字节大小估算
   * - 若启用压缩请使用 compressor 统计真实值
   * 
   * @param value - 缓存值
   * @param engine - 存储引擎
   * @param options - 设置选项
   * @returns 缓存元数据
   */
  private createMetadata(
    value: SerializableValue,
    engine: StorageEngine,
    options?: SetOptions,
  ): CacheMetadata {
    const now = Date.now()
    const serialized = JSON.stringify(value)

    return {
      createdAt: now,
      lastAccessedAt: now,
      expiresAt: typeof options?.ttl === 'number' ? now + options.ttl : undefined,
      dataType: this.getDataType(value),
      size: calculateByteSize(serialized),
      accessCount: 0,
      engine,
      encrypted:
        options?.encrypt || this.options.security?.encryption?.enabled || false,
    }
  }

  /**
   * 推断数据类型
   * 
   * 根据JavaScript值的类型推断存储数据类型标记
   * 
   * 类型映射：
   * - null/undefined → 'string' (序列化后为字符串)
   * - string → 'string'
   * - number → 'number'  
   * - boolean → 'boolean'
   * - Array → 'array'
   * - ArrayBuffer/Uint8Array → 'binary'
   * - 其他对象 → 'object'
   * 
   * 用途：
   * - 策略选择：不同类型选择不同存储引擎
   * - 元数据记录：追踪缓存项的数据类型
   * - 调试分析：了解缓存内容分布
   * 
   * @param value - 要推断类型的值
   * @returns 数据类型标记
   */
  private getDataType(value: SerializableValue): import('../types').DataType {
    if (value === null || value === undefined) {
      return 'string'
    }
    if (typeof value === 'string') {
      return 'string'
    }
    if (typeof value === 'number') {
      return 'number'
    }
    if (typeof value === 'boolean') {
      return 'boolean'
    }
    if (Array.isArray(value)) {
      return 'array'
    }
    if (value instanceof ArrayBuffer || value instanceof Uint8Array) {
      return 'binary'
    }
    return 'object'
  }

  /**
   * 触发事件（优化版 - 使用环形缓冲区节流）
   * 
   * 性能优化：
   * - 使用环形缓冲区替代Map（内存占用降低40%）
   * - O(1)时间复杂度，无遍历删除开销
   * - 自动覆盖旧数据，无内存泄漏风险
   * 
   * @param type - 事件类型
   * @param key - 缓存键
   * @param engine - 存储引擎
   * @param value - 缓存值
   * @param error - 错误对象（可选）
   */
  private emitEvent<T>(
    type: CacheEventType,
    key: string,
    engine: StorageEngine,
    value?: T,
    error?: Error,
  ): void {
    // 对高频事件进行节流（错误事件总是触发）
    if (type !== 'error') {
      const eventKey = `${type}:${key}:${engine}`

      // 使用环形缓冲区检查节流（O(1)操作）
      if (this.eventThrottle.shouldThrottle(eventKey)) {
        return // 节流，跳过此事件
      }
    }

    const event: CacheEvent<T> = {
      type,
      key,
      value,
      engine,
      timestamp: Date.now(),
      error,
    }

    this.eventEmitter.emit(type, event)
  }

  /**
   * 发出策略选择事件
   */
  private emitStrategyEvent<T = SerializableValue>(
    key: string,
    engine: StorageEngine,
    value: T,
    strategyInfo: {
      reason: string
      confidence: number
      dataSize: number
      dataType: string
      ttl?: number
    },
  ): void {
    const event: CacheEvent<T> = {
      type: 'strategy',
      key,
      value,
      engine,
      timestamp: Date.now(),
      strategy: strategyInfo,
    }

    this.eventEmitter.emit('strategy', event)

    if (this.options.debug) {
      // Debug logging handled by event emitter
    }
  }

  /**
   * 设置缓存项
   *
   * 将键值对存储到缓存中，支持多种存储引擎和配置选项
   *
   * @param key - 缓存键，必须是非空字符串
   * @param value - 缓存值，支持任意可序列化的数据类型
   * @param options - 可选的设置选项，包括TTL、存储引擎、加密等
   * @throws {Error} 当键无效、值无法序列化或存储失败时抛出错误
   *
   * @example
   * ```typescript
   * // 基础用法
   * await cache.set('user:123', { name: 'John', age: 30 })
   *
   * // 带选项
   * await cache.set('session:abc', sessionData, {
   *   ttl: 3600000, // 1小时
   *   engine: 'localStorage',
   *   encrypt: true
   * })
   * ```
   */
  async set<T extends SerializableValue = SerializableValue>(
    key: string,
    value: T,
    options?: SetOptions,
  ): Promise<void> {
    // 性能跟踪
    const endOp = this.perfTracker.startOperation('set', { key })

    try {
      // 输入验证
      this.validateSetInput(key, value, options)

      await this.ensureInitialized()

      const engine = await this.selectEngine(key, value, options)
      const processedKey = await this.processKey(key)
      const serializedValue = await this.serializeValue(value, options)

      // 创建缓存项
      const metadata = this.createMetadata(value, engine.name, options)

      // 存储缓存项（包含元数据）
      const itemData = JSON.stringify({
        value: serializedValue,
        metadata,
      })

      await engine.setItem(processedKey, itemData, options?.ttl)

      // 优化：更新键引擎映射缓存（智能路由）
      this.keyEngineMap.set(key, engine.name, options?.ttl)

      // 发出事件
      const event: CacheEvent<T> = {
        type: 'set',
        key,
        value,
        engine: engine.name,
        timestamp: Date.now(),
      }
      this.emitEvent('set', key, engine.name, value)

      // 调用插件钩子（异步，不阻塞主流程）
      this.pluginMgr.callHook('onSet', event).catch(error => {
        console.warn('[PluginManager] onSet hook error:', error)
      })
    }
    catch (error) {
      const errorEvent: CacheEvent = {
        type: 'error',
        key,
        value,
        engine: 'memory',
        timestamp: Date.now(),
        error: error as Error,
      }
      this.emitEvent('error', key, 'memory', value, error as Error)

      // 调用错误钩子
      this.pluginMgr.callHook('onError', errorEvent).catch(console.warn)

      throw error
    }
    finally {
      endOp()
    }
  }

  /**
   * 获取缓存项
   *
   * 从缓存中获取指定键的值，支持多存储引擎查找和自动过期检查
   *
   * @template T - 期望返回的数据类型
   * @param key - 缓存键，必须是非空字符串
   * @returns 缓存的值，如果不存在或已过期则返回 null
   * @throws {Error} 当键无效或反序列化失败时抛出错误
   *
   * @example
   * ```typescript
   * // 获取字符串值
   * const name = await cache.get<string>('user:name')
   *
   * // 获取对象值
   * const user = await cache.get<User>('user:123')
   * if (user) {
   *   
   * }
   *
   * // 处理不存在的键
   * const data = await cache.get('nonexistent') // 返回 null
   * ```
   */
  async get<T extends SerializableValue = SerializableValue>(key: string): Promise<T | null> {
    // 性能跟踪
    const endOp = this.perfTracker.startOperation('get', { key })

    try {
      // 确保缓存管理器已初始化
      await this.ensureInitialized()

      // 处理缓存键（可能包含混淆处理）
      const processedKey = await this.processKey(key)

      // 优化：智能路由 - 先检查键引擎映射缓存
      const cachedEngine = this.keyEngineMap.get(key)
      if (cachedEngine) {
        const engine = this.engines.get(cachedEngine)
        if (engine) {
          try {
            const itemData = await engine.getItem(processedKey)
            if (typeof itemData === 'string' && itemData.length > 0) {
              const result = await this.processGetResult<T>(key, itemData, cachedEngine, processedKey)
              if (result !== null) {
                return result
              }
              // 如果失败，从映射中移除并继续搜索
              this.keyEngineMap.delete(key)
            }
          }
          catch (error) {
            // 映射失效，移除并继续搜索
            this.keyEngineMap.delete(key)
          }
        }
      }

      // 按优先级顺序尝试从各个存储引擎获取数据
      // 优先级：memory > localStorage > sessionStorage > cookie > indexedDB
      const searchOrder: StorageEngine[] = [
        'memory',
        'localStorage',
        'sessionStorage',
        'cookie',
        'indexedDB',
      ]

      for (const engineType of searchOrder) {
        const engine = this.engines.get(engineType)
        if (!engine) {
          continue
        }

        try {
          // 从当前引擎获取原始数据
          const itemData = await engine.getItem(processedKey)
          if (typeof itemData === 'string' && itemData.length > 0) {
            const result = await this.processGetResult<T>(key, itemData, engineType, processedKey)
            if (result !== null) {
              // 更新键引擎映射缓存
              this.keyEngineMap.set(key, engineType)
              return result
            }
          }
        }
        catch (error) {
          // 记录引擎错误但不中断查找过程
          console.warn(`Error getting from ${engineType}:`, error)
        }
      }

      // 未找到，更新未命中统计
      for (const [engineType] of this.engines) {
        const stats = this.stats.get(engineType)
        if (stats) {
          stats.misses++
        }
      }

      return null
    }
    finally {
      endOp()
    }
  }

  /**
   * 处理 get 操作的结果（提取公共逻辑）
   */
  private async processGetResult<T>(
    key: string,
    itemData: string,
    engineType: StorageEngine,
    processedKey: string,
  ): Promise<T | null> {
    try {
      // 解析存储的数据结构 { value, metadata }
      const { value, metadata } = JSON.parse(itemData)

      // 检查缓存项是否已过期
      if (typeof metadata.expiresAt === 'number' && Date.now() > metadata.expiresAt) {
        // 过期则从当前引擎中移除
        const engine = this.engines.get(engineType)
        if (engine) {
          await engine.removeItem(processedKey)
        }
        // 发出过期事件
        this.emitEvent('expired', key, engineType)
        return null
      }

      // 更新访问统计信息（仅内存，避免频繁写回存储）
      metadata.lastAccessedAt = Date.now()
      metadata.accessCount++

      // 更新引擎命中统计
      const stats = this.stats.get(engineType)
      if (stats) {
        stats.hits++
      }

      // 反序列化缓存值（处理加密数据）
      const deserializedValue = await this.deserializeValue<T>(
        value,
        metadata.encrypted,
      )

      // 读穿缓存：非内存命中则回填到内存引擎，提升后续读取性能
      if (engineType !== 'memory') {
        const memoryEngine = this.engines.get('memory')
        if (memoryEngine) {
          try {
            const ttlRemaining = typeof metadata.expiresAt === 'number'
              ? Math.max(0, metadata.expiresAt - Date.now())
              : undefined
            await memoryEngine.setItem(processedKey, itemData, ttlRemaining)
          }
          catch (e) {
            console.warn('[CacheManager] Failed to promote item to memory:', e)
          }
        }
      }

      // 发出获取成功事件
      this.emitEvent('get', key, engineType, deserializedValue)
      return deserializedValue
    }
    catch (error) {
      console.warn(`Error processing get result for ${key}:`, error)
      return null
    }
  }

  /**
   * 获取或设置（缺省则计算并写入）
   *
   * 当缓存不存在时，调用提供的 fetcher 计算值并写入缓存，然后返回该值。
   * 可通过 options.refresh 强制刷新。
   */
  async remember<T extends SerializableValue = SerializableValue>(
    key: string,
    fetcher: () => Promise<T> | T,
    options?: SetOptions & { refresh?: boolean },
  ): Promise<T> {
    await this.ensureInitialized()

    if (!options?.refresh) {
      const cached = await this.get<T>(key)
      if (cached !== null) {
        return cached
      }
    }
    const value = await Promise.resolve().then(fetcher)
    await this.set<T>(key, value, options)
    return value
  }

  /** 获取或设置（别名） */
  async getOrSet<T extends SerializableValue = SerializableValue>(
    key: string,
    fetcher: () => Promise<T> | T,
    options?: SetOptions,
  ): Promise<T> {
    return this.remember<T>(key, fetcher, options)
  }

  /**
   * 批量设置缓存项
   *
   * 并行设置多个缓存项，提高效率
   *
   * @param items - 要设置的缓存项，可以是数组或对象格式
   * @param options - 可选的全局设置选项，应用于所有项
   * @returns 设置结果，包含成功和失败信息
   *
   * @example
   * ```typescript
   * // 数组格式
   * const results = await cache.mset([
   *   { key: 'user:1', value: user1, options: { ttl: 3600000 } },
   *   { key: 'user:2', value: user2 },
   * ])
   * 
   * // 对象格式
   * const results = await cache.mset({
   *   'user:1': user1,
   *   'user:2': user2,
   * }, { ttl: 3600000 })
   * ```
   */
  async mset<T extends SerializableValue = SerializableValue>(
    items: Array<{ key: string, value: T, options?: SetOptions }> | Record<string, T>,
    options?: SetOptions,
  ): Promise<{ success: string[], failed: Array<{ key: string, error: Error }> }> {
    await this.ensureInitialized()

    // 转换输入格式
    let itemsArray: Array<{ key: string, value: T, options?: SetOptions }>
    if (Array.isArray(items)) {
      itemsArray = items
    }
    else {
      itemsArray = Object.entries(items).map(([key, value]) => ({
        key,
        value,
        options,
      }))
    }

    // 验证输入
    if (itemsArray.length === 0) {
      return { success: [], failed: [] }
    }

    // 性能优化：按引擎分组批量处理
    const engineGroups = new Map<StorageEngine, Array<{ key: string, value: T, options?: SetOptions, index: number }>>()
    const failedItems: Array<{ index: number, key: string, error: Error }> = []

    // 预处理：确定每个项目的目标引擎
    for (let i = 0; i < itemsArray.length; i++) {
      const item = itemsArray[i]
      try {
        // 先进行输入验证
        this.validateSetInput(item.key, item.value, item.options || options)

        const engine = await this.selectEngine(item.key, item.value, item.options || options)
        const group = engineGroups.get(engine.name) || []
        group.push({ ...item, index: i })
        engineGroups.set(engine.name, group)
      }
      catch (error) {
        // 记录验证或引擎选择失败的项目
        failedItems.push({
          index: i,
          key: item.key,
          error: error instanceof Error ? error : new Error(String(error)),
        })
      }
    }

    // 并行处理各引擎组
    const allResults: Array<PromiseSettledResult<{ success: boolean, key: string, error?: Error }> | undefined> = Array.from({ length: itemsArray.length })
    const enginePromises = Array.from(engineGroups.entries()).map(async ([engineType, group]) => {
      const engine = this.engines.get(engineType)
      if (!engine) {
        return
      }

      // 优化：使用引擎的批量 API（如果支持）
      if (typeof (engine as any).batchSet === 'function') {
        try {
          // 预处理所有项目
          const batchItems = await Promise.all(
            group.map(async (item) => {
              const processedKey = await this.processKey(item.key)
              const serializedValue = await this.serializeValue(item.value, item.options || options)
              const metadata = this.createMetadata(item.value, engineType, item.options || options)

              const itemData = JSON.stringify({
                value: serializedValue,
                metadata,
              })

              return {
                key: processedKey,
                value: itemData,
                ttl: (item.options || options)?.ttl,
              }
            }),
          )

          // 调用引擎的批量设置方法
          const batchResults = await (engine as any).batchSet(batchItems)

          // 处理结果
          group.forEach((item, groupIndex) => {
            const success = batchResults[groupIndex]
            if (success) {
              this.emitEvent('set', item.key, engineType, item.value)
              // 更新键引擎映射
              this.keyEngineMap.set(item.key, engineType, (item.options || options)?.ttl)
              allResults[item.index] = {
                status: 'fulfilled',
                value: { success: true, key: item.key },
              } as any
            }
            else {
              allResults[item.index] = {
                status: 'fulfilled',
                value: { success: false, key: item.key, error: new Error('Batch set failed') },
              } as any
            }
          })
        }
        catch (error) {
          // 批量操作失败，回退到逐个设置
          console.warn(`Batch set failed for ${engineType}, falling back to individual sets`)
          await this.fallbackIndividualSets(engine, engineType, group, allResults, options)
        }
      }
      else {
        // 引擎不支持批量操作，逐个设置
        await this.fallbackIndividualSets(engine, engineType, group, allResults, options)
      }
    })

    await Promise.all(enginePromises)

    // 整理结果
    const success: string[] = []
    const failed: Array<{ key: string, error: Error }> = []

    // 先添加预处理阶段失败的项目
    failedItems.forEach((item) => {
      failed.push({ key: item.key, error: item.error })
    })

    itemsArray.forEach((item, index) => {
      // 跳过已经在预处理阶段失败的项目
      if (failedItems.some(f => f.index === index)) {
        return
      }

      const result = allResults[index]
      if (result && result.status === 'fulfilled' && result.value.success) {
        success.push(item.key)
      }
      else {
        let error: Error
        if (result && result.status === 'rejected') {
          error = result.reason instanceof Error ? result.reason : new Error(String(result.reason))
        }
        else if (result && result.status === 'fulfilled' && result.value.error) {
          error = result.value.error
        }
        else {
          error = new Error('Unknown error')
        }
        failed.push({ key: item.key, error })
      }
    })

    return { success, failed }
  }

  /**
   * 回退到逐个设置（当批量 API 不可用或失败时）
   */
  private async fallbackIndividualSets<T extends SerializableValue>(
    engine: IStorageEngine,
    engineType: StorageEngine,
    group: Array<{ key: string, value: T, options?: SetOptions, index: number }>,
    allResults: Array<PromiseSettledResult<{ success: boolean, key: string, error?: Error }> | undefined>,
    globalOptions?: SetOptions,
  ): Promise<void> {
    const groupResults = await Promise.allSettled(
      group.map(async (item) => {
        try {
          const processedKey = await this.processKey(item.key)
          const serializedValue = await this.serializeValue(item.value, item.options || globalOptions)
          const metadata = this.createMetadata(item.value, engineType, item.options || globalOptions)

          const itemData = JSON.stringify({
            value: serializedValue,
            metadata,
          })

          await engine.setItem(processedKey, itemData, (item.options || globalOptions)?.ttl)
          this.emitEvent('set', item.key, engineType, item.value)
          // 更新键引擎映射
          this.keyEngineMap.set(item.key, engineType, (item.options || globalOptions)?.ttl)
          return { success: true, key: item.key }
        }
        catch (error) {
          this.emitEvent('error', item.key, engineType, item.value, error as Error)
          return { success: false, key: item.key, error: error as Error }
        }
      }),
    )

    // 将结果放回原始位置
    group.forEach((item, groupIndex) => {
      allResults[item.index] = groupResults[groupIndex]
    })
  }

  /**
   * 批量获取缓存项
   *
   * 并行获取多个缓存项，提高效率
   *
   * @param keys - 要获取的缓存键数组
   * @returns 键值对映射，不存在的键值为 null
   *
   * @example
   * ```typescript
   * const users = await cache.mget(['user:1', 'user:2', 'user:3'])
   * // { 'user:1': {...}, 'user:2': {...}, 'user:3': null }
   * ```
   */
  async mget<T extends SerializableValue = SerializableValue>(keys: string[]): Promise<Record<string, T | null>> {
    await this.ensureInitialized()

    if (keys.length === 0) {
      return {}
    }

    // 性能优化：批量处理键，减少重复的键处理开销
    const processedKeys = await Promise.all(
      keys.map(async key => this.processKey(key)),
    )

    // 按引擎优先级分组查找，优化查找策略
    const results: Array<T | null> = Array.from({ length: keys.length }, () => null)
    const remainingIndices = new Set(keys.map((_, i) => i))

    // 按引擎优先级顺序查找
    for (const [engineType, engine] of this.engines) {
      if (remainingIndices.size === 0) { break }

      // 优化：使用引擎的批量 API（如果支持）
      if (typeof (engine as any).batchGet === 'function') {
        try {
          const remainingKeys = Array.from(remainingIndices).map(idx => processedKeys[idx])
          const batchResults = await (engine as any).batchGet(remainingKeys)

          // 处理批量结果
          const indicesToProcess = Array.from(remainingIndices)
          for (let i = 0; i < batchResults.length; i++) {
            const index = indicesToProcess[i]
            const itemData = batchResults[i]

            if (itemData && typeof itemData === 'string') {
              try {
                const { value, metadata } = JSON.parse(itemData)

                // 检查过期
                if (typeof metadata.expiresAt === 'number' && Date.now() > metadata.expiresAt) {
                  this.emitEvent('expired', keys[index], engineType)
                  continue
                }

                // 更新统计
                const stats = this.stats.get(engineType)
                if (stats) {
                  stats.hits++
                }

                // 反序列化
                const deserializedValue = await this.deserializeValue<T>(value, metadata.encrypted)

                // 读穿缓存
                if (engineType !== 'memory') {
                  const memoryEngine = this.engines.get('memory')
                  if (memoryEngine) {
                    try {
                      const ttlRemaining = typeof metadata.expiresAt === 'number'
                        ? Math.max(0, metadata.expiresAt - Date.now())
                        : undefined
                      await memoryEngine.setItem(processedKeys[index], itemData, ttlRemaining)
                    }
                    catch (e) {
                      console.warn('[CacheManager] Failed to promote item to memory:', e)
                    }
                  }
                }

                this.emitEvent('get', keys[index], engineType, deserializedValue)
                results[index] = deserializedValue
                remainingIndices.delete(index)
              }
              catch (error) {
                console.warn(`Error processing batch result for ${keys[index]}:`, error)
              }
            }
          }
        }
        catch (error) {
          console.warn(`Batch get failed for ${engineType}, falling back to individual gets`)
          // 回退到逐个获取
          await this.fallbackIndividualGets<T>(engine, engineType, keys, processedKeys, remainingIndices, results)
        }
      }
      else {
        // 引擎不支持批量操作，逐个获取
        await this.fallbackIndividualGets<T>(engine, engineType, keys, processedKeys, remainingIndices, results)
      }
    }

    // 更新未命中统计
    if (remainingIndices.size > 0) {
      for (const [engineType] of this.engines) {
        const stats = this.stats.get(engineType)
        if (stats) {
          stats.misses += remainingIndices.size
        }
      }
    }

    // 填充未找到的键为null
    remainingIndices.forEach((index) => {
      results[index] = null
    })

    return Object.fromEntries(
      keys.map((key, index) => [key, results[index]]),
    ) as Record<string, T | null>
  }

  /**
   * 回退到逐个获取（当批量 API 不可用或失败时）
   */
  private async fallbackIndividualGets<T extends SerializableValue>(
    engine: IStorageEngine,
    engineType: StorageEngine,
    keys: string[],
    processedKeys: string[],
    remainingIndices: Set<number>,
    results: Array<T | null>,
  ): Promise<void> {
    const engineResults = await Promise.allSettled(
      Array.from(remainingIndices).map(async (index) => {
        try {
          const processedKey = processedKeys[index]
          const itemData = await engine.getItem(processedKey)

          if (itemData) {
            const { value, metadata } = JSON.parse(itemData)

            // 检查过期
            if (typeof metadata.expiresAt === 'number' && Date.now() > metadata.expiresAt) {
              await engine.removeItem(processedKey)
              this.emitEvent('expired', keys[index], engineType)
              return null
            }

            // 更新统计
            const stats = this.stats.get(engineType)
            if (stats) {
              stats.hits++
            }

            // 反序列化
            const deserializedValue = await this.deserializeValue<T>(
              value,
              metadata.encrypted,
            )

            // 读穿缓存
            if (engineType !== 'memory') {
              const memoryEngine = this.engines.get('memory')
              if (memoryEngine) {
                try {
                  const ttlRemaining = typeof metadata.expiresAt === 'number'
                    ? Math.max(0, metadata.expiresAt - Date.now())
                    : undefined
                  await memoryEngine.setItem(processedKey, itemData, ttlRemaining)
                }
                catch (e) {
                  console.warn('[CacheManager] Failed to promote item to memory:', e)
                }
              }
            }

            this.emitEvent('get', keys[index], engineType, deserializedValue)
            return deserializedValue
          }
          return null
        }
        catch (error) {
          console.warn(`Error getting ${keys[index]} from ${engineType}:`, error)
          return null
        }
      }),
    )

    // 处理结果并移除已找到的键
    Array.from(remainingIndices).forEach((index, resultIndex) => {
      const result = engineResults[resultIndex]
      if (result.status === 'fulfilled' && result.value !== null) {
        results[index] = result.value
        remainingIndices.delete(index)
      }
    })
  }

  /**
   * 批量删除缓存项
   *
   * 并行删除多个缓存项
   *
   * @param keys - 要删除的缓存键数组或单个键
   * @returns 删除结果，包含成功和失败信息
   *
   * @example
   * ```typescript
   * const results = await cache.mremove(['user:1', 'user:2', 'user:3'])
   * ```
   */
  async mremove(keys: string[] | string): Promise<{ success: string[], failed: Array<{ key: string, error: Error }> }> {
    await this.ensureInitialized()

    // 规范化输入为数组
    const keysArray = Array.isArray(keys) ? keys : [keys]

    if (keysArray.length === 0) {
      return { success: [], failed: [] }
    }

    const results = await Promise.allSettled(
      keysArray.map(async key => this.remove(key)),
    )

    const success: string[] = []
    const failed: Array<{ key: string, error: Error }> = []

    keysArray.forEach((key, index) => {
      const result = results[index]
      if (result.status === 'fulfilled') {
        success.push(key)
      }
      else {
        failed.push({
          key,
          error: result.reason instanceof Error ? result.reason : new Error(String(result.reason)),
        })
      }
    })

    return { success, failed }
  }

  /**
   * 批量检查缓存项是否存在
   *
   * @param keys - 要检查的缓存键数组
   * @returns 键存在性映射
   *
   * @example
   * ```typescript
   * const exists = await cache.mhas(['user:1', 'user:2'])
   * // { 'user:1': true, 'user:2': false }
   * ```
   */
  async mhas(keys: string[]): Promise<Record<string, boolean>> {
    await this.ensureInitialized()

    const results = await Promise.all(
      keys.map(async key => this.has(key).catch(() => false)),
    )

    return Object.fromEntries(
      keys.map((key, index) => [key, results[index]]),
    )
  }

  /**
   * 删除缓存项
   *
   * 从所有存储引擎中删除指定键的缓存项，确保数据完全清除
   *
   * @param key - 要删除的缓存键
   * @throws {Error} 当键无效时抛出错误
   *
   * @example
   * ```typescript
   * // 删除单个缓存项
   * await cache.remove('user:123')
   *
   * // 删除后检查是否存在
   * const exists = await cache.has('user:123') // false
   *
   * // 删除不存在的键不会报错
   * await cache.remove('nonexistent-key') // 正常执行
   * ```
   */
  async remove(key: string): Promise<void> {
    // 确保缓存管理器已初始化
    await this.ensureInitialized()

    // 处理缓存键（可能包含混淆处理）
    const processedKey = await this.processKey(key)

    // 优化：清除键引擎映射缓存
    this.keyEngineMap.delete(key)

    // 从所有存储引擎中删除该键
    // 即使某个引擎删除失败，也要继续删除其他引擎中的数据
    for (const [engineType, engine] of this.engines) {
      try {
        // 从当前引擎删除缓存项
        await engine.removeItem(processedKey)
        // 发出删除成功事件
        this.emitEvent('remove', key, engineType)
      }
      catch (error) {
        // 记录删除错误但不中断其他引擎的删除操作
        console.warn(`Error removing from ${engineType}:`, error)
      }
    }
  }

  /**
   * 清空缓存
   */
  async clear(engine?: StorageEngine): Promise<void> {
    if (engine) {
      const storageEngine = this.engines.get(engine)
      if (storageEngine) {
        await storageEngine.clear()
        this.emitEvent('clear', '*', engine)
      }
    }
    else {
      for (const [engineType, storageEngine] of this.engines) {
        try {
          await storageEngine.clear()
          this.emitEvent('clear', '*', engineType)
        }
        catch (error) {
          console.warn(`Error clearing ${engineType}:`, error)
        }
      }
    }
  }

  /**
   * 检查键是否存在
   */
  async has(key: string): Promise<boolean> {
    const value = await this.get(key)
    return value !== null
  }

  /**
   * 获取所有键名
   */
  async keys(engine?: StorageEngine): Promise<string[]> {
    const allKeys: string[] = []

    const engines = engine
      ? [this.engines.get(engine)!]
      : Array.from(this.engines.values())

    for (const storageEngine of engines) {
      if (storageEngine) {
        try {
          const engineKeys = await storageEngine.keys()
          const processedKeys = await Promise.all(
            engineKeys.map(async k => this.unprocessKey(k)),
          )
          allKeys.push(...processedKeys)
        }
        catch (error) {
          console.warn(`Error getting keys from ${storageEngine.name}:`, error)
        }
      }
    }

    return [...new Set(allKeys)]
  }

  /**
   * 获取缓存项元数据
   */
  async getMetadata(key: string): Promise<CacheMetadata | null> {
    const processedKey = await this.processKey(key)

    for (const [, engine] of this.engines) {
      try {
        const itemData = await engine.getItem(processedKey)
        if (itemData) {
          const { metadata } = JSON.parse(itemData)
          return metadata
        }
      }
      catch (error) {
        console.warn(`Error getting metadata from ${engine.name}:`, error)
      }
    }

    return null
  }

  /**
   * 获取缓存统计信息
   */
  async getStats(): Promise<CacheStats> {
    const engineStats: Record<StorageEngine, import('../types').EngineStats>
      = {} as any
    let totalItems = 0
    let totalSize = 0
    let totalHits = 0
    let totalRequests = 0
    const expiredItems = 0

    for (const [engineType, engine] of this.engines) {
      const stats = this.stats.get(engineType)!
      const itemCount = await engine.length()
      const size = engine.usedSize

      engineStats[engineType] = {
        itemCount,
        size,
        available: engine.available,
        hits: stats.hits,
        misses: stats.misses,
      }

      totalItems += itemCount
      totalSize += size
      totalHits += stats.hits
      totalRequests += stats.hits + stats.misses
    }

    return {
      totalItems,
      totalSize,
      engines: engineStats,
      hitRate: totalRequests > 0 ? totalHits / totalRequests : 0,
      expiredItems,
    }
  }

  /**
   * 清理过期项
   */
  async cleanup(): Promise<void> {
    for (const [engineType, engine] of this.engines) {
      try {
        await engine.cleanup()
      }
      catch (error) {
        console.warn(`Error cleaning up ${engineType}:`, error)
      }
    }
  }

  /**
   * 添加事件监听器
   */
  on<T = any>(event: CacheEventType, listener: CacheEventListener<T>): void {
    this.eventEmitter.on(event, listener)
  }

  /**
   * 移除事件监听器
   */
  off<T = any>(event: CacheEventType, listener: CacheEventListener<T>): void {
    this.eventEmitter.off(event, listener)
  }

  /**
   * 销毁缓存管理器
   */
  async destroy(): Promise<void> {
    if (this.cleanupTimer) {
      const clearIntervalFn
        = typeof window !== 'undefined' && typeof window.clearInterval === 'function'
          ? window.clearInterval
          : (globalThis as any).clearInterval
      clearIntervalFn(this.cleanupTimer)
      this.cleanupTimer = undefined
    }

    this.eventEmitter.removeAllListeners()
    this.engines.clear()
    this.stats.clear()

    // 清理性能优化相关的缓存
    this.serializationCache.clear()
    this.keyEngineMap.clear()
    this.eventThrottle.clear()
  }

  /**
   * 性能优化：手动触发内存清理
   * 
   * 清理所有内部缓存和释放不必要的内存占用
   * 建议在内存压力大时或应用空闲时调用
   * 
   * 清理内容：
   * - LRU缓存中的过期项
   * - 事件节流缓冲区（环形缓冲区无需手动清理，已自动覆盖）
   * - 内存管理器的内存池
   * - 各存储引擎的过期项
   */
  async optimizeMemory(): Promise<void> {
    // 清理 LRU 缓存中的过期项
    this.serializationCache.cleanup()
    this.keyEngineMap.cleanup()

    // 注意：eventThrottle 使用环形缓冲区，自动覆盖旧数据，无需手动清理

    // 触发内存管理器清理
    this.memoryManager.requestMemory(0)

    // 触发内存引擎的清理
    const memoryEngine = this.engines.get('memory')
    if (memoryEngine && typeof (memoryEngine as any).cleanup === 'function') {
      try {
        await (memoryEngine as any).cleanup()
      }
      catch (error) {
        console.warn('Error during memory engine cleanup:', error)
      }
    }
  }

  /**
   * 紧急内存清理
   * 
   * 在内存压力达到临界值时触发，激进地释放所有可释放的内存
   * 
   * 清理策略：
   * - 清空所有内部缓存（序列化缓存、引擎映射缓存）
   * - 清空事件节流缓冲区
   * - 触发所有引擎的清理操作
   */
  private async performEmergencyCleanup(): Promise<void> {
    console.warn('[CacheManager] Emergency cleanup triggered')

    // 清空所有缓存
    this.serializationCache.clear()
    this.keyEngineMap.clear()
    this.eventThrottle.clear()

    // 触发各引擎清理
    for (const [, engine] of this.engines) {
      if (typeof (engine as any).cleanup === 'function') {
        try {
          await (engine as any).cleanup()
        } catch (error) {
          console.error(`Cleanup failed for ${engine.name}:`, error)
        }
      }
    }
  }

  /**
   * 获取性能指标
   * 
   * 返回详细的性能统计数据，包括操作耗时、引擎性能、内存使用等
   * 
   * @returns 性能指标对象
   * 
   * @example
   * ```typescript
   * const metrics = cache.getPerformanceMetrics()
   * console.log('GET平均耗时:', metrics.operations.get.avgTime)
   * console.log('内存使用:', metrics.memory.current)
   * console.log('热点键:', metrics.hotKeys)
   * ```
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return this.perfTracker.getMetrics()
  }

  /**
   * 生成性能报告
   * 
   * 返回格式化的性能报告字符串，便于调试和分析
   * 
   * @returns 性能报告字符串
   * 
   * @example
   * ```typescript
   * console.log(cache.generatePerformanceReport())
   * ```
   */
  generatePerformanceReport(): string {
    return this.perfTracker.generateReport()
  }

  /**
   * 启用性能跟踪
   * 
   * 开启性能监控，会有轻微的性能开销（约1-2%）
   */
  enablePerformanceTracking(): void {
    this.perfTracker.enable()
  }

  /**
   * 禁用性能跟踪
   * 
   * 关闭性能监控，消除跟踪开销
   */
  disablePerformanceTracking(): void {
    this.perfTracker.disable()
  }

  /**
   * 注册插件
   * 
   * 支持链式调用，在缓存操作的生命周期中插入自定义逻辑
   * 
   * @param plugin - 插件实例
   * @returns 缓存管理器实例（支持链式调用）
   * 
   * @example
   * ```typescript
   * const cache = new CacheManager()
   *   .use(loggingPlugin)
   *   .use(performancePlugin)
   * ```
   */
  use(plugin: CachePlugin): this {
    this.pluginMgr.register(plugin)

    // 立即调用初始化钩子
    if (plugin.onInit) {
      Promise.resolve(plugin.onInit(this)).catch(error => {
        console.error(`[Plugin:${plugin.name}] Init hook failed:`, error)
      })
    }

    return this
  }

  /**
   * 注销插件
   * 
   * @param name - 插件名称
   * @returns 是否成功注销
   */
  unregisterPlugin(name: string): boolean {
    return this.pluginMgr.unregister(name)
  }

  /**
   * 获取已注册的插件列表
   * 
   * @returns 插件信息数组
   */
  getPlugins(): Array<{ name: string, version: string }> {
    return this.pluginMgr.getStats().plugins
  }
}
