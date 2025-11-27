/**
 * 验证工具函数
 * @module @ldesign/cache/core/utils/validator
 */

import { ERROR_MESSAGES } from '../constants'

/**
 * 验证缓存键
 * @param key - 缓存键
 * @throws 如果键无效
 */
export function validateKey(key: string): void {
  if (!key || typeof key !== 'string' || key.trim() === '') {
    throw new Error(ERROR_MESSAGES.INVALID_KEY)
  }
}

/**
 * 验证缓存值
 * @param value - 缓存值
 * @throws 如果值无效
 */
export function validateValue<T>(value: T): void {
  if (value === undefined) {
    throw new Error(ERROR_MESSAGES.INVALID_VALUE)
  }
}

/**
 * 验证 TTL
 * @param ttl - TTL 值
 * @throws 如果 TTL 无效
 */
export function validateTTL(ttl: number): void {
  if (ttl !== undefined && (typeof ttl !== 'number' || ttl <= 0 || !Number.isFinite(ttl))) {
    throw new Error(ERROR_MESSAGES.INVALID_TTL)
  }
}

/**
 * 验证最大容量
 * @param maxSize - 最大容量
 * @throws 如果最大容量无效
 */
export function validateMaxSize(maxSize: number): void {
  if (typeof maxSize !== 'number' || maxSize <= 0 || !Number.isFinite(maxSize)) {
    throw new Error(ERROR_MESSAGES.INVALID_MAX_SIZE)
  }
}

/**
 * 检查是否过期
 * @param expiresAt - 过期时间戳
 * @returns 是否过期
 */
export function isExpired(expiresAt?: number): boolean {
  if (!expiresAt) {
    return false
  }
  return Date.now() >= expiresAt
}

/**
 * 检查存储是否可用
 * @param storageType - 存储类型
 * @returns 是否可用
 */
export function isStorageAvailable(storageType: 'localStorage' | 'sessionStorage'): boolean {
  if (typeof window === 'undefined') {
    return false
  }
  
  try {
    const storage = storageType === 'localStorage' ? window.localStorage : window.sessionStorage
    const testKey = '__ldesign_cache_test__'
    storage.setItem(testKey, 'test')
    storage.removeItem(testKey)
    return true
  }
  catch {
    return false
  }
}

/**
 * 检查 IndexedDB 是否可用
 * @returns 是否可用
 */
export function isIndexedDBAvailable(): boolean {
  if (typeof window === 'undefined') {
    return false
  }
  return 'indexedDB' in window && window.indexedDB !== null
}

