/**
 * 哈希工具函数
 * @module @ldesign/cache/core/utils/hash
 */
/**
 * 简单的字符串哈希函数（FNV-1a 算法）
 * @param str - 要哈希的字符串
 * @returns 哈希值
 */
export declare function hashString(str: string): number;
/**
 * 生成缓存键的哈希值
 * @param key - 缓存键
 * @param namespace - 命名空间
 * @returns 完整的缓存键
 */
export declare function generateCacheKey(key: string, namespace?: string): string;
/**
 * 解析缓存键
 * @param fullKey - 完整的缓存键
 * @returns 命名空间和键
 */
export declare function parseCacheKey(fullKey: string): {
    namespace?: string;
    key: string;
};
/**
 * 生成唯一 ID
 * @returns 唯一 ID
 */
export declare function generateId(): string;
