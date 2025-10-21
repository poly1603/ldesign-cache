/*!
 * ***********************************
 * @ldesign/cache v0.1.1           *
 * Built with rollup               *
 * Build time: 2024-10-21 14:32:03 *
 * Build mode: production          *
 * Minified: No                    *
 * ***********************************
 */
import { StorageEngineFactory } from '../engines/factory.js';
import { SecurityManager } from '../security/security-manager.js';
import { StorageStrategy } from '../strategies/storage-strategy.js';
import '../utils/error-handler.js';
import { EventEmitter } from '../utils/event-emitter.js';
import '../utils/object-pool.js';
import '../utils/performance-profiler.js';
import '../utils/serialization-cache.js';
import { Validator } from '../utils/validator.js';
import { createMemoryManager } from './memory-manager.js';
import { createPrefetchManager } from './prefetch-manager.js';

class CacheManager {
  constructor(options = {}) {
    Object.defineProperty(this, "options", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: options
    });
    Object.defineProperty(this, "engines", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: /* @__PURE__ */ new Map()
    });
    Object.defineProperty(this, "strategy", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "security", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "eventEmitter", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "stats", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: /* @__PURE__ */ new Map()
    });
    Object.defineProperty(this, "cleanupTimer", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "initialized", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: false
    });
    Object.defineProperty(this, "initPromise", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: null
    });
    Object.defineProperty(this, "memoryManager", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "prefetchManager", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "serializationCache", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: /* @__PURE__ */ new WeakMap()
    });
    Object.defineProperty(this, "stringSerializationCache", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: /* @__PURE__ */ new Map()
    });
    Object.defineProperty(this, "maxStringCacheSize", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: 500
    });
    Object.defineProperty(this, "serializationCacheOrder", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: /* @__PURE__ */ new Map()
    });
    Object.defineProperty(this, "serializationCacheCounter", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: 0
    });
    Object.defineProperty(this, "eventThrottleRing", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: []
    });
    Object.defineProperty(this, "eventThrottleIndex", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: /* @__PURE__ */ new Map()
    });
    Object.defineProperty(this, "eventThrottleMs", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: 100
    });
    Object.defineProperty(this, "maxEventThrottleSize", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: 200
    });
    this.strategy = new StorageStrategy(options.strategy);
    this.security = new SecurityManager(options.security);
    this.eventEmitter = new EventEmitter();
    this.memoryManager = createMemoryManager({
      maxMemory: options.maxMemory || 100 * 1024 * 1024,
      highPressureThreshold: 0.8,
      criticalPressureThreshold: 0.95,
      autoCleanupInterval: options.cleanupInterval || 6e4
    });
    this.memoryManager.onPressure((level) => {
      if (level === "critical") {
        this.performEmergencyCleanup();
      } else if (level === "high") {
        this.cleanup().catch(console.error);
      }
    });
    if (options.enablePrefetch) {
      this.prefetchManager = createPrefetchManager({
        strategy: options.prefetch?.strategy || "markov",
        cacheGetter: async (key) => await this.get(key),
        cacheSetter: async (key, value, opts) => await this.set(key, value, opts),
        fetcher: options.prefetch?.fetcher
      });
    }
    this.initPromise = this.initializeEngines();
    this.startCleanupTimer();
  }
  /**
   * 确保已初始化
   */
  async ensureInitialized() {
    if (!this.initialized && this.initPromise) {
      await this.initPromise;
    }
  }
  /**
   * 初始化存储引擎
   */
  async initializeEngines() {
    const engineTypes = ["localStorage", "sessionStorage", "cookie", "indexedDB", "memory"];
    for (const engineType of engineTypes) {
      try {
        const engineConfig = this.options.engines?.[engineType];
        if (engineConfig && "enabled" in engineConfig && engineConfig.enabled === false) {
          continue;
        }
        const engine = await StorageEngineFactory.create(engineType, engineConfig);
        if (engine.available) {
          this.engines.set(engineType, engine);
          this.stats.set(engineType, {
            hits: 0,
            misses: 0
          });
        }
      } catch (error) {
        console.warn(`Failed to initialize ${engineType} engine:`, error);
      }
    }
    this.initialized = true;
  }
  /**
   * 启动清理定时器
   */
  startCleanupTimer() {
    if (typeof this.options.cleanupInterval === "number" && this.options.cleanupInterval > 0) {
      const setIntervalFn = typeof window !== "undefined" && typeof window.setInterval === "function" ? window.setInterval : globalThis.setInterval;
      this.cleanupTimer = setIntervalFn(() => {
        this.cleanup().catch((error) => {
          console.error(error);
        });
      }, this.options.cleanupInterval);
    }
  }
  /**
   * 选择存储引擎
   */
  async selectEngine(key, value, options) {
    if (options?.engine) {
      const engine2 = this.engines.get(options.engine);
      if (!engine2) {
        throw new Error(`Storage engine ${options.engine} is not available`);
      }
      return engine2;
    }
    if (this.options.strategy?.enabled) {
      const result = await this.strategy.selectEngine(key, value, options);
      const dataSize = new Blob([JSON.stringify(value)]).size;
      const dataType = this.getDataType(value);
      this.emitStrategyEvent(key, result.engine, value, {
        reason: result.reason,
        confidence: result.confidence,
        dataSize,
        dataType,
        ttl: options?.ttl
      });
      if (this.options.debug) {
        console.info(`[CacheManager] Strategy selected engine: ${result.engine}`);
      }
      const engine2 = this.engines.get(result.engine);
      if (engine2) {
        return engine2;
      } else {
        console.warn(`[CacheManager] Strategy selected engine ${result.engine} is not available, falling back to default`);
      }
    }
    const defaultEngine = this.options.defaultEngine || StorageEngineFactory.getRecommendedEngine();
    const engine = this.engines.get(defaultEngine);
    if (engine) {
      return engine;
    }
    const firstAvailable = Array.from(this.engines.values())[0];
    if (firstAvailable !== void 0) {
      return firstAvailable;
    }
    throw new Error("No storage engine is available");
  }
  /**
   * 处理键名
   */
  async processKey(key) {
    let processedKey = key;
    if (typeof this.options.keyPrefix === "string" && this.options.keyPrefix.length > 0) {
      processedKey = `${this.options.keyPrefix}:${processedKey}`;
    }
    if (this.options.security?.obfuscation?.enabled) {
      processedKey = await this.security.obfuscateKey(processedKey);
    }
    return processedKey;
  }
  /**
   * 反处理键名
   */
  async unprocessKey(key) {
    let originalKey = key;
    if (this.options.security?.obfuscation?.enabled) {
      originalKey = await this.security.deobfuscateKey(originalKey);
    }
    if (typeof this.options.keyPrefix === "string" && this.options.keyPrefix.length > 0) {
      const prefix = `${this.options.keyPrefix}:`;
      if (originalKey.startsWith(prefix)) {
        originalKey = originalKey.slice(prefix.length);
      }
    }
    return originalKey;
  }
  /**
   * 序列化数据
   *
   * 将任意类型的数据序列化为字符串，支持加密选项
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
  async serializeValue(value, options) {
    try {
      const needsEncryption = options?.encrypt || this.options.security?.encryption?.enabled;
      const cacheKey = needsEncryption ? null : this.createSerializationCacheKey(value);
      if (cacheKey !== null && this.stringSerializationCache.has(cacheKey)) {
        this.serializationCacheOrder.set(cacheKey, this.serializationCacheCounter++);
        const cached = this.stringSerializationCache.get(cacheKey);
        if (cached !== void 0) {
          return cached;
        }
      }
      let serialized;
      try {
        serialized = JSON.stringify(value);
      } catch (error) {
        if (error instanceof Error && error.message.includes("circular")) {
          const simplifiedValue = this.removeCircularReferences(value);
          serialized = JSON.stringify(simplifiedValue);
          console.warn("Circular reference detected in cache value, using simplified version:", error.message);
        } else {
          throw new Error(`JSON serialization failed: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
      }
      if (needsEncryption) {
        try {
          serialized = await this.security.encrypt(serialized);
        } catch (error) {
          throw new Error(`Encryption failed during serialization: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
      } else if (cacheKey !== null) {
        this.cacheSerializationResult(cacheKey, serialized);
      }
      return serialized;
    } catch (error) {
      this.emitEvent("error", "serialization", "memory", value, error);
      throw error;
    }
  }
  /**
   * 创建序列化缓存键（优化版）
   */
  createSerializationCacheKey(value) {
    try {
      const type = typeof value;
      if (type === "string" || type === "number" || type === "boolean" || value === null) {
        const key = `${type}:${String(value)}`;
        return key.length < 200 ? key : null;
      }
      return null;
    } catch {
      return null;
    }
  }
  /**
   * 缓存序列化结果（优化版）
   */
  cacheSerializationResult(key, result) {
    if (this.stringSerializationCache.size >= this.maxStringCacheSize) {
      const firstKey = this.stringSerializationCache.keys().next().value;
      if (firstKey !== void 0) {
        this.stringSerializationCache.delete(firstKey);
      }
    }
    this.stringSerializationCache.set(key, result);
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
  async deserializeValue(data, encrypted) {
    try {
      let deserialized = data;
      if (encrypted) {
        try {
          deserialized = await this.security.decrypt(deserialized);
        } catch (error) {
          throw new Error(`Decryption failed during deserialization: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
      }
      try {
        return JSON.parse(deserialized);
      } catch (error) {
        throw new Error(`JSON parsing failed during deserialization: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    } catch (error) {
      this.emitEvent("error", "deserialization", "memory", data, error);
      throw error;
    }
  }
  /**
   * 移除对象中的循环引用
   *
   * @param obj - 需要处理的对象
   * @param seen - 已访问的对象集合（用于检测循环引用）
   * @returns 移除循环引用后的对象
   */
  removeCircularReferences(obj, seen = /* @__PURE__ */ new WeakSet()) {
    if (obj === null || typeof obj !== "object") {
      return obj;
    }
    if (seen.has(obj)) {
      return "[Circular Reference]";
    }
    seen.add(obj);
    if (Array.isArray(obj)) {
      return obj.map((item) => this.removeCircularReferences(item, seen));
    }
    const result = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        result[key] = this.removeCircularReferences(obj[key], seen);
      }
    }
    return result;
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
  validateSetInput(key, value, options) {
    Validator.validateSetInput(key, value, options);
  }
  /**
   * 创建元数据
   */
  /**
   * 创建元数据
   *
   * 根据值、引擎和选项生成标准化的缓存元数据。
   * 注意：size 基于 JSON 字符串字节大小估算，若启用压缩请使用 compressor 统计真实值。
   */
  createMetadata(value, engine, options) {
    const now = Date.now();
    const serialized = JSON.stringify(value);
    return {
      createdAt: now,
      lastAccessedAt: now,
      expiresAt: typeof options?.ttl === "number" ? now + options.ttl : void 0,
      dataType: this.getDataType(value),
      size: new Blob([serialized]).size,
      accessCount: 0,
      engine,
      encrypted: options?.encrypt || this.options.security?.encryption?.enabled || false
    };
  }
  /**
   * 获取数据类型
   */
  /**
   * 推断数据类型
   */
  getDataType(value) {
    if (value === null || value === void 0) {
      return "string";
    }
    if (typeof value === "string") {
      return "string";
    }
    if (typeof value === "number") {
      return "number";
    }
    if (typeof value === "boolean") {
      return "boolean";
    }
    if (Array.isArray(value)) {
      return "array";
    }
    if (value instanceof ArrayBuffer || value instanceof Uint8Array) {
      return "binary";
    }
    return "object";
  }
  /**
   * 触发事件（优化版）
   */
  emitEvent(type, key, engine, value, error) {
    const eventKey = `${type}:${key}:${engine}`;
    const now = Date.now();
    const index = this.eventThrottleIndex.get(eventKey);
    if (index !== void 0 && type !== "error") {
      const entry = this.eventThrottleRing[index];
      if (entry && now - entry.time < this.eventThrottleMs) {
        return;
      }
    }
    if (this.eventThrottleRing.length >= this.maxEventThrottleSize) {
      const oldestIndex = 0;
      const oldEntry = this.eventThrottleRing[oldestIndex];
      if (oldEntry) {
        this.eventThrottleIndex.delete(oldEntry.key);
      }
      this.eventThrottleRing[oldestIndex] = {
        key: eventKey,
        time: now
      };
      this.eventThrottleIndex.set(eventKey, oldestIndex);
      this.eventThrottleRing.push(this.eventThrottleRing.shift());
    } else {
      const newIndex = this.eventThrottleRing.length;
      this.eventThrottleRing.push({
        key: eventKey,
        time: now
      });
      this.eventThrottleIndex.set(eventKey, newIndex);
    }
    const event = {
      type,
      key,
      value,
      engine,
      timestamp: now,
      error
    };
    this.eventEmitter.emit(type, event);
  }
  /**
   * 发出策略选择事件
   */
  emitStrategyEvent(key, engine, value, strategyInfo) {
    const event = {
      type: "strategy",
      key,
      value,
      engine,
      timestamp: Date.now(),
      strategy: strategyInfo
    };
    this.eventEmitter.emit("strategy", event);
    if (this.options.debug) ;
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
  async set(key, value, options) {
    this.validateSetInput(key, value, options);
    await this.ensureInitialized();
    try {
      const engine = await this.selectEngine(key, value, options);
      const processedKey = await this.processKey(key);
      const serializedValue = await this.serializeValue(value, options);
      const metadata = this.createMetadata(value, engine.name, options);
      const itemData = JSON.stringify({
        value: serializedValue,
        metadata
      });
      await engine.setItem(processedKey, itemData, options?.ttl);
      this.emitEvent("set", key, engine.name, value);
    } catch (error) {
      this.emitEvent("error", key, "memory", value, error);
      throw error;
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
  async get(key) {
    await this.ensureInitialized();
    const processedKey = await this.processKey(key);
    const searchOrder = ["memory", "localStorage", "sessionStorage", "cookie", "indexedDB"];
    for (const engineType of searchOrder) {
      const engine = this.engines.get(engineType);
      if (!engine) {
        continue;
      }
      try {
        const itemData = await engine.getItem(processedKey);
        if (typeof itemData === "string" && itemData.length > 0) {
          const {
            value,
            metadata
          } = JSON.parse(itemData);
          if (typeof metadata.expiresAt === "number" && Date.now() > metadata.expiresAt) {
            await engine.removeItem(processedKey);
            this.emitEvent("expired", key, engineType);
            continue;
          }
          metadata.lastAccessedAt = Date.now();
          metadata.accessCount++;
          const stats = this.stats.get(engineType);
          if (stats) {
            stats.hits++;
          }
          const deserializedValue = await this.deserializeValue(value, metadata.encrypted);
          if (engineType !== "memory") {
            const memoryEngine = this.engines.get("memory");
            if (memoryEngine) {
              try {
                const ttlRemaining = typeof metadata.expiresAt === "number" ? Math.max(0, metadata.expiresAt - Date.now()) : void 0;
                await memoryEngine.setItem(processedKey, itemData, ttlRemaining);
              } catch (e) {
                console.warn("[CacheManager] Failed to promote item to memory:", e);
              }
            }
          }
          this.emitEvent("get", key, engineType, deserializedValue);
          return deserializedValue;
        }
      } catch (error) {
        console.warn(`Error getting from ${engineType}:`, error);
      }
    }
    for (const [engineType] of this.engines) {
      const stats = this.stats.get(engineType);
      if (stats) {
        stats.misses++;
      }
    }
    return null;
  }
  /**
   * 获取或设置（缺省则计算并写入）
   *
   * 当缓存不存在时，调用提供的 fetcher 计算值并写入缓存，然后返回该值。
   * 可通过 options.refresh 强制刷新。
   */
  async remember(key, fetcher, options) {
    await this.ensureInitialized();
    if (!options?.refresh) {
      const cached = await this.get(key);
      if (cached !== null) {
        return cached;
      }
    }
    const value = await Promise.resolve().then(fetcher);
    await this.set(key, value, options);
    return value;
  }
  /** 获取或设置（别名） */
  async getOrSet(key, fetcher, options) {
    return this.remember(key, fetcher, options);
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
  async mset(items, options) {
    await this.ensureInitialized();
    let itemsArray;
    if (Array.isArray(items)) {
      itemsArray = items;
    } else {
      itemsArray = Object.entries(items).map(([key, value]) => ({
        key,
        value,
        options
      }));
    }
    if (itemsArray.length === 0) {
      return {
        success: [],
        failed: []
      };
    }
    const engineGroups = /* @__PURE__ */ new Map();
    const failedItems = [];
    for (let i = 0; i < itemsArray.length; i++) {
      const item = itemsArray[i];
      try {
        this.validateSetInput(item.key, item.value, item.options || options);
        const engine = await this.selectEngine(item.key, item.value, item.options || options);
        const group = engineGroups.get(engine.name) || [];
        group.push({
          ...item,
          index: i
        });
        engineGroups.set(engine.name, group);
      } catch (error) {
        failedItems.push({
          index: i,
          key: item.key,
          error: error instanceof Error ? error : new Error(String(error))
        });
      }
    }
    const allResults = Array.from({
      length: itemsArray.length
    });
    const enginePromises = Array.from(engineGroups.entries()).map(async ([engineType, group]) => {
      const engine = this.engines.get(engineType);
      if (!engine) {
        return;
      }
      const groupResults = await Promise.allSettled(group.map(async (item) => {
        try {
          const processedKey = await this.processKey(item.key);
          const serializedValue = await this.serializeValue(item.value, item.options || options);
          const metadata = this.createMetadata(item.value, engineType, item.options || options);
          const itemData = JSON.stringify({
            value: serializedValue,
            metadata
          });
          await engine.setItem(processedKey, itemData, (item.options || options)?.ttl);
          this.emitEvent("set", item.key, engineType, item.value);
          return {
            success: true,
            key: item.key
          };
        } catch (error) {
          this.emitEvent("error", item.key, engineType, item.value, error);
          return {
            success: false,
            key: item.key,
            error
          };
        }
      }));
      group.forEach((item, groupIndex) => {
        allResults[item.index] = groupResults[groupIndex];
      });
    });
    await Promise.all(enginePromises);
    const success = [];
    const failed = [];
    failedItems.forEach((item) => {
      failed.push({
        key: item.key,
        error: item.error
      });
    });
    itemsArray.forEach((item, index) => {
      if (failedItems.some((f) => f.index === index)) {
        return;
      }
      const result = allResults[index];
      if (result && result.status === "fulfilled" && result.value.success) {
        success.push(item.key);
      } else {
        let error;
        if (result && result.status === "rejected") {
          error = result.reason instanceof Error ? result.reason : new Error(String(result.reason));
        } else if (result && result.status === "fulfilled" && result.value.error) {
          error = result.value.error;
        } else {
          error = new Error("Unknown error");
        }
        failed.push({
          key: item.key,
          error
        });
      }
    });
    return {
      success,
      failed
    };
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
  async mget(keys) {
    await this.ensureInitialized();
    if (keys.length === 0) {
      return {};
    }
    const processedKeys = await Promise.all(keys.map(async (key) => this.processKey(key)));
    const results = Array.from({
      length: keys.length
    }, () => null);
    const remainingIndices = new Set(keys.map((_, i) => i));
    for (const [engineType, engine] of this.engines) {
      if (remainingIndices.size === 0) {
        break;
      }
      const engineResults = await Promise.allSettled(Array.from(remainingIndices).map(async (index) => {
        try {
          const processedKey = processedKeys[index];
          const itemData = await engine.getItem(processedKey);
          if (itemData) {
            const {
              value,
              metadata
            } = JSON.parse(itemData);
            if (typeof metadata.expiresAt === "number" && Date.now() > metadata.expiresAt) {
              await engine.removeItem(processedKey);
              this.emitEvent("expired", keys[index], engineType);
              return null;
            }
            const stats = this.stats.get(engineType);
            if (stats) {
              stats.hits++;
            }
            const deserializedValue = await this.deserializeValue(value, metadata.encrypted);
            if (engineType !== "memory") {
              const memoryEngine = this.engines.get("memory");
              if (memoryEngine) {
                try {
                  const ttlRemaining = typeof metadata.expiresAt === "number" ? Math.max(0, metadata.expiresAt - Date.now()) : void 0;
                  await memoryEngine.setItem(processedKey, itemData, ttlRemaining);
                } catch (e) {
                  console.warn("[CacheManager] Failed to promote item to memory:", e);
                }
              }
            }
            this.emitEvent("get", keys[index], engineType, deserializedValue);
            return deserializedValue;
          }
          return null;
        } catch (error) {
          console.warn(`Error getting ${keys[index]} from ${engineType}:`, error);
          return null;
        }
      }));
      Array.from(remainingIndices).forEach((index, resultIndex) => {
        const result = engineResults[resultIndex];
        if (result.status === "fulfilled" && result.value !== null) {
          results[index] = result.value;
          remainingIndices.delete(index);
        }
      });
    }
    if (remainingIndices.size > 0) {
      for (const [engineType] of this.engines) {
        const stats = this.stats.get(engineType);
        if (stats) {
          stats.misses += remainingIndices.size;
        }
      }
    }
    remainingIndices.forEach((index) => {
      results[index] = null;
    });
    return Object.fromEntries(keys.map((key, index) => [key, results[index]]));
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
  async mremove(keys) {
    await this.ensureInitialized();
    const keysArray = Array.isArray(keys) ? keys : [keys];
    if (keysArray.length === 0) {
      return {
        success: [],
        failed: []
      };
    }
    const results = await Promise.allSettled(keysArray.map(async (key) => this.remove(key)));
    const success = [];
    const failed = [];
    keysArray.forEach((key, index) => {
      const result = results[index];
      if (result.status === "fulfilled") {
        success.push(key);
      } else {
        failed.push({
          key,
          error: result.reason instanceof Error ? result.reason : new Error(String(result.reason))
        });
      }
    });
    return {
      success,
      failed
    };
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
  async mhas(keys) {
    await this.ensureInitialized();
    const results = await Promise.all(keys.map(async (key) => this.has(key).catch(() => false)));
    return Object.fromEntries(keys.map((key, index) => [key, results[index]]));
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
  async remove(key) {
    await this.ensureInitialized();
    const processedKey = await this.processKey(key);
    for (const [engineType, engine] of this.engines) {
      try {
        await engine.removeItem(processedKey);
        this.emitEvent("remove", key, engineType);
      } catch (error) {
        console.warn(`Error removing from ${engineType}:`, error);
      }
    }
  }
  /**
   * 清空缓存
   */
  async clear(engine) {
    if (engine) {
      const storageEngine = this.engines.get(engine);
      if (storageEngine) {
        await storageEngine.clear();
        this.emitEvent("clear", "*", engine);
      }
    } else {
      for (const [engineType, storageEngine] of this.engines) {
        try {
          await storageEngine.clear();
          this.emitEvent("clear", "*", engineType);
        } catch (error) {
          console.warn(`Error clearing ${engineType}:`, error);
        }
      }
    }
  }
  /**
   * 检查键是否存在
   */
  async has(key) {
    const value = await this.get(key);
    return value !== null;
  }
  /**
   * 获取所有键名
   */
  async keys(engine) {
    const allKeys = [];
    const engines = engine ? [this.engines.get(engine)] : Array.from(this.engines.values());
    for (const storageEngine of engines) {
      if (storageEngine) {
        try {
          const engineKeys = await storageEngine.keys();
          const processedKeys = await Promise.all(engineKeys.map(async (k) => this.unprocessKey(k)));
          allKeys.push(...processedKeys);
        } catch (error) {
          console.warn(`Error getting keys from ${storageEngine.name}:`, error);
        }
      }
    }
    return [...new Set(allKeys)];
  }
  /**
   * 获取缓存项元数据
   */
  async getMetadata(key) {
    const processedKey = await this.processKey(key);
    for (const [, engine] of this.engines) {
      try {
        const itemData = await engine.getItem(processedKey);
        if (itemData) {
          const {
            metadata
          } = JSON.parse(itemData);
          return metadata;
        }
      } catch (error) {
        console.warn(`Error getting metadata from ${engine.name}:`, error);
      }
    }
    return null;
  }
  /**
   * 获取缓存统计信息
   */
  async getStats() {
    const engineStats = {};
    let totalItems = 0;
    let totalSize = 0;
    let totalHits = 0;
    let totalRequests = 0;
    const expiredItems = 0;
    for (const [engineType, engine] of this.engines) {
      const stats = this.stats.get(engineType);
      const itemCount = await engine.length();
      const size = engine.usedSize;
      engineStats[engineType] = {
        itemCount,
        size,
        available: engine.available,
        hits: stats.hits,
        misses: stats.misses
      };
      totalItems += itemCount;
      totalSize += size;
      totalHits += stats.hits;
      totalRequests += stats.hits + stats.misses;
    }
    return {
      totalItems,
      totalSize,
      engines: engineStats,
      hitRate: totalRequests > 0 ? totalHits / totalRequests : 0,
      expiredItems
    };
  }
  /**
   * 清理过期项
   */
  async cleanup() {
    for (const [engineType, engine] of this.engines) {
      try {
        await engine.cleanup();
      } catch (error) {
        console.warn(`Error cleaning up ${engineType}:`, error);
      }
    }
  }
  /**
   * 添加事件监听器
   */
  on(event, listener) {
    this.eventEmitter.on(event, listener);
  }
  /**
   * 移除事件监听器
   */
  off(event, listener) {
    this.eventEmitter.off(event, listener);
  }
  /**
   * 销毁缓存管理器
   */
  async destroy() {
    if (this.cleanupTimer) {
      const clearIntervalFn = typeof window !== "undefined" && typeof window.clearInterval === "function" ? window.clearInterval : globalThis.clearInterval;
      clearIntervalFn(this.cleanupTimer);
      this.cleanupTimer = void 0;
    }
    this.eventEmitter.removeAllListeners();
    this.engines.clear();
    this.stats.clear();
    this.serializationCache = /* @__PURE__ */ new WeakMap();
    this.stringSerializationCache.clear();
    this.eventThrottleIndex.clear();
    this.eventThrottleRing = [];
  }
  /**
   * 性能优化：手动触发内存清理
   */
  async optimizeMemory() {
    if (this.stringSerializationCache.size > this.maxStringCacheSize / 2) {
      const keysToDelete = [];
      let count = 0;
      for (const key of this.stringSerializationCache.keys()) {
        if (count++ >= this.maxStringCacheSize / 4) break;
        keysToDelete.push(key);
      }
      keysToDelete.forEach((key) => this.stringSerializationCache.delete(key));
    }
    if (this.eventThrottleRing.length > this.maxEventThrottleSize / 2) {
      const halfSize = Math.floor(this.maxEventThrottleSize / 2);
      this.eventThrottleRing = this.eventThrottleRing.slice(-halfSize);
      this.eventThrottleIndex.clear();
      this.eventThrottleRing.forEach((entry, index) => {
        this.eventThrottleIndex.set(entry.key, index);
      });
    }
    this.memoryManager.requestMemory(0);
    const memoryEngine = this.engines.get("memory");
    if (memoryEngine && typeof memoryEngine.cleanup === "function") {
      try {
        await memoryEngine.cleanup();
      } catch (error) {
        console.warn("Error during memory engine cleanup:", error);
      }
    }
  }
  /**
   * 紧急内存清理
   */
  async performEmergencyCleanup() {
    console.warn("[CacheManager] Emergency cleanup triggered");
    this.stringSerializationCache.clear();
    this.eventThrottleRing = [];
    this.eventThrottleIndex.clear();
    for (const [, engine] of this.engines) {
      if (typeof engine.cleanup === "function") {
        try {
          await engine.cleanup();
        } catch (error) {
          console.error(`Cleanup failed for ${engine.name}:`, error);
        }
      }
    }
  }
}

export { CacheManager };
/*! End of @ldesign/cache | Powered by @ldesign/builder */
//# sourceMappingURL=cache-manager.js.map
