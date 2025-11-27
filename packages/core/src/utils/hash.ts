/**
 * 哈希工具函数
 * @module @ldesign/cache/core/utils/hash
 */

/**
 * 简单的字符串哈希函数（FNV-1a 算法）
 * @param str - 要哈希的字符串
 * @returns 哈希值
 */
export function hashString(str: string): number {
  let hash = 2166136261 // FNV offset basis
  
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i)
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24)
  }
  
  return hash >>> 0 // 转换为无符号 32 位整数
}

/**
 * 生成缓存键的哈希值
 * @param key - 缓存键
 * @param namespace - 命名空间
 * @returns 完整的缓存键
 */
export function generateCacheKey(key: string, namespace?: string): string {
  if (namespace) {
    return `${namespace}:${key}`
  }
  return key
}

/**
 * 解析缓存键
 * @param fullKey - 完整的缓存键
 * @returns 命名空间和键
 */
export function parseCacheKey(fullKey: string): { namespace?: string, key: string } {
  const parts = fullKey.split(':')
  if (parts.length > 1) {
    return {
      namespace: parts[0],
      key: parts.slice(1).join(':'),
    }
  }
  return { key: fullKey }
}

/**
 * 生成唯一 ID
 * @returns 唯一 ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

