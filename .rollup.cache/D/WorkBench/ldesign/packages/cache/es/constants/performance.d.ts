/**
 * 性能相关常量配置
 *
 * 将所有魔法数字集中管理，便于维护和调优
 */
/**
 * 缓存大小限制常量
 */
export declare const CACHE_SIZE: {
    /** 序列化缓存最大条目数（默认） */
    readonly SERIALIZATION_DEFAULT: 500;
    /** 序列化缓存最小条目数 */
    readonly SERIALIZATION_MIN: 100;
    /** 序列化缓存最大条目数 */
    readonly SERIALIZATION_MAX: 5000;
    /** 字符串缓存最大条目数 */
    readonly STRING_CACHE_MAX: 500;
    /** 大小计算缓存最大条目数 */
    readonly SIZE_CACHE_LIMIT: 1000;
    /** 对象池默认最大大小 */
    readonly OBJECT_POOL_DEFAULT: 100;
    /** 对象池最大大小（元数据） */
    readonly OBJECT_POOL_METADATA: 500;
    /** 对象池最大大小（缓存项） */
    readonly OBJECT_POOL_CACHE_ITEM: 500;
    /** 事件节流队列最大大小 */
    readonly EVENT_THROTTLE_MAX: 200;
};
/**
 * 时间间隔常量（毫秒）
 */
export declare const TIME_INTERVALS: {
    /** 序列化缓存默认TTL */
    readonly SERIALIZATION_TTL_DEFAULT: 5000;
    /** 序列化缓存最小TTL */
    readonly SERIALIZATION_TTL_MIN: 3000;
    /** 序列化缓存最大TTL */
    readonly SERIALIZATION_TTL_MAX: 30000;
    /** 默认清理间隔 */
    readonly CLEANUP_INTERVAL_DEFAULT: 60000;
    /** 最小清理间隔 */
    readonly CLEANUP_INTERVAL_MIN: 10000;
    /** 事件节流默认刷新间隔 */
    readonly EVENT_FLUSH_DEFAULT: 100;
    /** 事件节流最小刷新间隔 */
    readonly EVENT_FLUSH_MIN: 10;
    /** 事件节流最大刷新间隔 */
    readonly EVENT_FLUSH_MAX: 200;
    /** Vue自动保存默认节流时间 */
    readonly AUTO_SAVE_THROTTLE_DEFAULT: 500;
    /** Vue自动保存默认防抖时间 */
    readonly AUTO_SAVE_DEBOUNCE_DEFAULT: 100;
    /** 高压力清理间隔 */
    readonly HIGH_PRESSURE_CLEANUP_INTERVAL: 10000;
};
/**
 * 批量操作常量
 */
export declare const BATCH_CONFIG: {
    /** 默认批量大小 */
    readonly DEFAULT_SIZE: 10;
    /** 最小批量大小 */
    readonly MIN_SIZE: 1;
    /** 最大批量大小 */
    readonly MAX_SIZE: 100;
    /** 低性能模式批量大小 */
    readonly LOW_PERFORMANCE: 20;
    /** 高性能模式批量大小 */
    readonly HIGH_PERFORMANCE: 5;
    /** 极致性能模式批量大小 */
    readonly EXTREME_PERFORMANCE: 1;
};
/**
 * 内存管理常量
 */
export declare const MEMORY_CONFIG: {
    /** 默认最大内存（100MB） */
    readonly MAX_DEFAULT: number;
    /** 最小内存限制（10MB） */
    readonly MIN_LIMIT: number;
    /** 高压力阈值（百分比） */
    readonly HIGH_PRESSURE_THRESHOLD: 0.8;
    /** 危急压力阈值（百分比） */
    readonly CRITICAL_PRESSURE_THRESHOLD: 0.95;
    /** 中等压力阈值（百分比） */
    readonly MEDIUM_PRESSURE_THRESHOLD: 0.6;
    /** 最大淘汰比例 */
    readonly MAX_EVICTION_RATIO: 0.3;
    /** 最大淘汰比例（一半） */
    readonly HALF_EVICTION_RATIO: 0.5;
    /** 对象池清理阈值 */
    readonly POOL_CLEANUP_THRESHOLD: 50;
};
/**
 * 字符串和数据大小常量
 */
export declare const DATA_SIZE: {
    /** 字符串对象基础开销（字节） */
    readonly STRING_OVERHEAD: 24;
    /** 数组基础开销（字节） */
    readonly ARRAY_OVERHEAD: 24;
    /** 对象基础开销（字节） */
    readonly OBJECT_OVERHEAD: 32;
    /** 基本类型大小 */
    readonly BOOLEAN_SIZE: 4;
    readonly NUMBER_SIZE: 8;
    readonly NULL_SIZE: 8;
    /** 压缩最小大小（1KB） */
    readonly COMPRESSION_MIN_SIZE: 1024;
    /** 压缩块大小（32KB） */
    readonly COMPRESSION_CHUNK_SIZE: 32768;
    /** 压缩熵值阈值 */
    readonly COMPRESSION_ENTROPY_THRESHOLD: 7.5;
};
/**
 * UTF-8字符编码大小常量
 */
export declare const UTF8_SIZE: {
    /** ASCII字符上限 */
    readonly ASCII_MAX: 128;
    /** 2字节UTF-8字符上限 */
    readonly TWO_BYTE_MAX: 2048;
    /** 3字节UTF-8字符上限 */
    readonly THREE_BYTE_MAX: 65536;
    /** 对应的字节大小 */
    readonly ONE_BYTE: 1;
    readonly TWO_BYTES: 2;
    readonly THREE_BYTES: 3;
    readonly FOUR_BYTES: 4;
};
/**
 * 引擎配置常量
 */
export declare const ENGINE_CONFIG: {
    /** 内存引擎默认最大大小（10MB） */
    readonly MEMORY_MAX_SIZE_DEFAULT: number;
    /** 内存引擎默认最大项数 */
    readonly MEMORY_MAX_ITEMS_DEFAULT: 1000;
    /** Cookie最大大小（4KB） */
    readonly COOKIE_MAX_SIZE: number;
    /** LocalStorage推荐大小限制（5MB） */
    readonly LOCAL_STORAGE_LIMIT: number;
    /** SessionStorage推荐大小限制（5MB） */
    readonly SESSION_STORAGE_LIMIT: number;
};
/**
 * 性能优化阈值常量
 */
export declare const PERFORMANCE_THRESHOLDS: {
    /** 小文件大小阈值（10KB） */
    readonly SMALL_FILE_SIZE: number;
    /** 大文件大小阈值（1MB） */
    readonly LARGE_FILE_SIZE: number;
    /** 浏览器内存使用率高阈值 */
    readonly BROWSER_MEMORY_HIGH: 0.8;
    /** 浏览器内存使用率中等阈值 */
    readonly BROWSER_MEMORY_MEDIUM: 0.5;
    /** 服务器内存使用率高阈值 */
    readonly SERVER_MEMORY_HIGH: 0.7;
    /** 服务器内存使用率中等阈值 */
    readonly SERVER_MEMORY_MEDIUM: 0.8;
    /** 高性能CPU核心数阈值 */
    readonly HIGH_PERFORMANCE_CORES: 8;
    /** 中性能CPU核心数阈值 */
    readonly MEDIUM_PERFORMANCE_CORES: 4;
    /** 低性能CPU核心数阈值 */
    readonly LOW_PERFORMANCE_CORES: 2;
};
/**
 * 压缩算法相关常量
 */
export declare const COMPRESSION: {
    /** 默认压缩级别 */
    readonly DEFAULT_LEVEL: 6;
    /** 最小压缩级别 */
    readonly MIN_LEVEL: 1;
    /** 最大压缩级别 */
    readonly MAX_LEVEL: 9;
    /** 典型压缩率（用于估算） */
    readonly TYPICAL_RATIO: 0.3;
    /** 无压缩率 */
    readonly NO_COMPRESSION_RATIO: 1;
};
/**
 * 哈希和字符串处理常量
 */
export declare const HASH_CONFIG: {
    /** 哈希位移量 */
    readonly HASH_SHIFT: 5;
    /** 哈希初始值 */
    readonly HASH_INIT: 0;
};
/**
 * 调试和日志常量
 *
 * 注意：在生产环境中应设置为false以获得最佳性能
 */
export declare const DEBUG_CONFIG: {
    /** 是否启用调试日志（开发环境） */
    readonly ENABLE_DEBUG: false;
    /** 是否启用性能分析 */
    readonly ENABLE_PROFILING: false;
};
/**
 * 导出所有常量的类型
 */
export type CacheSizeConstants = typeof CACHE_SIZE;
export type TimeIntervalsConstants = typeof TIME_INTERVALS;
export type BatchConfigConstants = typeof BATCH_CONFIG;
export type MemoryConfigConstants = typeof MEMORY_CONFIG;
export type DataSizeConstants = typeof DATA_SIZE;
export type UTF8SizeConstants = typeof UTF8_SIZE;
export type EngineConfigConstants = typeof ENGINE_CONFIG;
export type PerformanceThresholdsConstants = typeof PERFORMANCE_THRESHOLDS;
export type CompressionConstants = typeof COMPRESSION;
export type HashConfigConstants = typeof HASH_CONFIG;
export type DebugConfigConstants = typeof DEBUG_CONFIG;
