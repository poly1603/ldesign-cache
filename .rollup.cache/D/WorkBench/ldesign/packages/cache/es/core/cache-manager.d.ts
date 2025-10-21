import type { CacheEventListener, CacheEventType, CacheMetadata, CacheOptions, CacheStats, ICacheManager, SerializableValue, SetOptions, StorageEngine } from '../types';
/**
 * 缓存管理器核心实现
 */
export declare class CacheManager implements ICacheManager {
    private options;
    private engines;
    private strategy;
    private security;
    private eventEmitter;
    private stats;
    private cleanupTimer?;
    private initialized;
    private initPromise;
    private memoryManager;
    private prefetchManager?;
    private serializationCache;
    private stringSerializationCache;
    private readonly maxStringCacheSize;
    private serializationCacheOrder;
    private serializationCacheCounter;
    private eventThrottleRing;
    private eventThrottleIndex;
    private readonly eventThrottleMs;
    private readonly maxEventThrottleSize;
    constructor(options?: CacheOptions);
    /**
     * 确保已初始化
     */
    private ensureInitialized;
    /**
     * 初始化存储引擎
     */
    private initializeEngines;
    /**
     * 启动清理定时器
     */
    private startCleanupTimer;
    /**
     * 选择存储引擎
     */
    private selectEngine;
    /**
     * 处理键名
     */
    private processKey;
    /**
     * 反处理键名
     */
    private unprocessKey;
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
    private serializeValue;
    /**
     * 创建序列化缓存键（优化版）
     */
    private createSerializationCacheKey;
    /**
     * 缓存序列化结果（优化版）
     */
    private cacheSerializationResult;
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
    private deserializeValue;
    /**
     * 移除对象中的循环引用
     *
     * @param obj - 需要处理的对象
     * @param seen - 已访问的对象集合（用于检测循环引用）
     * @returns 移除循环引用后的对象
     */
    private removeCircularReferences;
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
    private validateSetInput;
    /**
     * 创建元数据
     */
    /**
     * 创建元数据
     *
     * 根据值、引擎和选项生成标准化的缓存元数据。
     * 注意：size 基于 JSON 字符串字节大小估算，若启用压缩请使用 compressor 统计真实值。
     */
    private createMetadata;
    /**
     * 获取数据类型
     */
    /**
     * 推断数据类型
     */
    private getDataType;
    /**
     * 触发事件（优化版）
     */
    private emitEvent;
    /**
     * 发出策略选择事件
     */
    private emitStrategyEvent;
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
    set<T extends SerializableValue = SerializableValue>(key: string, value: T, options?: SetOptions): Promise<void>;
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
    get<T extends SerializableValue = SerializableValue>(key: string): Promise<T | null>;
    /**
     * 获取或设置（缺省则计算并写入）
     *
     * 当缓存不存在时，调用提供的 fetcher 计算值并写入缓存，然后返回该值。
     * 可通过 options.refresh 强制刷新。
     */
    remember<T extends SerializableValue = SerializableValue>(key: string, fetcher: () => Promise<T> | T, options?: SetOptions & {
        refresh?: boolean;
    }): Promise<T>;
    /** 获取或设置（别名） */
    getOrSet<T extends SerializableValue = SerializableValue>(key: string, fetcher: () => Promise<T> | T, options?: SetOptions): Promise<T>;
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
    mset<T extends SerializableValue = SerializableValue>(items: Array<{
        key: string;
        value: T;
        options?: SetOptions;
    }> | Record<string, T>, options?: SetOptions): Promise<{
        success: string[];
        failed: Array<{
            key: string;
            error: Error;
        }>;
    }>;
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
    mget<T extends SerializableValue = SerializableValue>(keys: string[]): Promise<Record<string, T | null>>;
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
    mremove(keys: string[] | string): Promise<{
        success: string[];
        failed: Array<{
            key: string;
            error: Error;
        }>;
    }>;
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
    mhas(keys: string[]): Promise<Record<string, boolean>>;
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
    remove(key: string): Promise<void>;
    /**
     * 清空缓存
     */
    clear(engine?: StorageEngine): Promise<void>;
    /**
     * 检查键是否存在
     */
    has(key: string): Promise<boolean>;
    /**
     * 获取所有键名
     */
    keys(engine?: StorageEngine): Promise<string[]>;
    /**
     * 获取缓存项元数据
     */
    getMetadata(key: string): Promise<CacheMetadata | null>;
    /**
     * 获取缓存统计信息
     */
    getStats(): Promise<CacheStats>;
    /**
     * 清理过期项
     */
    cleanup(): Promise<void>;
    /**
     * 添加事件监听器
     */
    on<T = any>(event: CacheEventType, listener: CacheEventListener<T>): void;
    /**
     * 移除事件监听器
     */
    off<T = any>(event: CacheEventType, listener: CacheEventListener<T>): void;
    /**
     * 销毁缓存管理器
     */
    destroy(): Promise<void>;
    /**
     * 性能优化：手动触发内存清理
     */
    optimizeMemory(): Promise<void>;
    /**
     * 紧急内存清理
     */
    private performEmergencyCleanup;
}
