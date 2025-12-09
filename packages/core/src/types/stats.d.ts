/**
 * 缓存统计相关类型定义
 * @module @ldesign/cache/core/types/stats
 */
/**
 * 缓存统计信息
 */
export interface CacheStats {
    /** 当前缓存项数量 */
    size: number;
    /** 最大容量 */
    maxSize: number;
    /** 总请求次数 */
    totalRequests: number;
    /** 命中次数 */
    hits: number;
    /** 未命中次数 */
    misses: number;
    /** 命中率（0-1） */
    hitRate: number;
    /** 淘汰次数 */
    evictions: number;
    /** 过期清理次数 */
    expirations: number;
    /** 总内存占用（字节，估算值） */
    memoryUsage: number;
    /** 平均响应时间（毫秒） */
    avgResponseTime?: number;
    /** P95 响应时间（毫秒） */
    p95ResponseTime?: number;
    /** P99 响应时间（毫秒） */
    p99ResponseTime?: number;
    /** 最后更新时间 */
    lastUpdated?: number;
}
/**
 * 性能指标
 */
export interface PerformanceMetrics {
    /** 操作类型 */
    operation: 'get' | 'set' | 'delete' | 'clear';
    /** 响应时间（毫秒） */
    responseTime: number;
    /** 时间戳 */
    timestamp: number;
    /** 是否成功 */
    success: boolean;
}
