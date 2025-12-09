/**
 * 验证工具函数
 * @module @ldesign/cache/core/utils/validator
 */
/**
 * 验证缓存键
 * @param key - 缓存键
 * @throws 如果键无效
 */
export declare function validateKey(key: string): void;
/**
 * 验证缓存值
 * @param value - 缓存值
 * @throws 如果值无效
 */
export declare function validateValue<T>(value: T): void;
/**
 * 验证 TTL
 * @param ttl - TTL 值
 * @throws 如果 TTL 无效
 */
export declare function validateTTL(ttl: number): void;
/**
 * 验证最大容量
 * @param maxSize - 最大容量
 * @throws 如果最大容量无效
 */
export declare function validateMaxSize(maxSize: number): void;
/**
 * 检查是否过期
 * @param expiresAt - 过期时间戳
 * @returns 是否过期
 */
export declare function isExpired(expiresAt?: number): boolean;
/**
 * 检查存储是否可用
 * @param storageType - 存储类型
 * @returns 是否可用
 */
export declare function isStorageAvailable(storageType: 'localStorage' | 'sessionStorage'): boolean;
/**
 * 检查 IndexedDB 是否可用
 * @returns 是否可用
 */
export declare function isIndexedDBAvailable(): boolean;
