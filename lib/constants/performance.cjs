/*!
 * ***********************************
 * @ldesign/cache v0.1.1           *
 * Built with rollup               *
 * Build time: 2024-10-21 14:32:03 *
 * Build mode: production          *
 * Minified: No                    *
 * ***********************************
 */
'use strict';

const CACHE_SIZE = {
  /** 序列化缓存最大条目数（默认） */
  SERIALIZATION_DEFAULT: 500,
  /** 序列化缓存最小条目数 */
  SERIALIZATION_MIN: 100,
  /** 序列化缓存最大条目数 */
  SERIALIZATION_MAX: 5e3,
  /** 字符串缓存最大条目数 */
  STRING_CACHE_MAX: 500,
  /** 大小计算缓存最大条目数 */
  SIZE_CACHE_LIMIT: 1e3,
  /** 对象池默认最大大小 */
  OBJECT_POOL_DEFAULT: 100,
  /** 对象池最大大小（元数据） */
  OBJECT_POOL_METADATA: 500,
  /** 对象池最大大小（缓存项） */
  OBJECT_POOL_CACHE_ITEM: 500,
  /** 事件节流队列最大大小 */
  EVENT_THROTTLE_MAX: 200
};
const TIME_INTERVALS = {
  /** 序列化缓存默认TTL */
  SERIALIZATION_TTL_DEFAULT: 5e3,
  /** 序列化缓存最小TTL */
  SERIALIZATION_TTL_MIN: 3e3,
  /** 序列化缓存最大TTL */
  SERIALIZATION_TTL_MAX: 3e4,
  /** 默认清理间隔 */
  CLEANUP_INTERVAL_DEFAULT: 6e4,
  /** 最小清理间隔 */
  CLEANUP_INTERVAL_MIN: 1e4,
  /** 事件节流默认刷新间隔 */
  EVENT_FLUSH_DEFAULT: 100,
  /** 事件节流最小刷新间隔 */
  EVENT_FLUSH_MIN: 10,
  /** 事件节流最大刷新间隔 */
  EVENT_FLUSH_MAX: 200,
  /** Vue自动保存默认节流时间 */
  AUTO_SAVE_THROTTLE_DEFAULT: 500,
  /** Vue自动保存默认防抖时间 */
  AUTO_SAVE_DEBOUNCE_DEFAULT: 100,
  /** 高压力清理间隔 */
  HIGH_PRESSURE_CLEANUP_INTERVAL: 1e4
};
const BATCH_CONFIG = {
  /** 默认批量大小 */
  DEFAULT_SIZE: 10,
  /** 最小批量大小 */
  MIN_SIZE: 1,
  /** 最大批量大小 */
  MAX_SIZE: 100,
  /** 低性能模式批量大小 */
  LOW_PERFORMANCE: 20,
  /** 高性能模式批量大小 */
  HIGH_PERFORMANCE: 5,
  /** 极致性能模式批量大小 */
  EXTREME_PERFORMANCE: 1
};
const MEMORY_CONFIG = {
  /** 默认最大内存（100MB） */
  MAX_DEFAULT: 100 * 1024 * 1024,
  /** 最小内存限制（10MB） */
  MIN_LIMIT: 10 * 1024 * 1024,
  /** 高压力阈值（百分比） */
  HIGH_PRESSURE_THRESHOLD: 0.8,
  /** 危急压力阈值（百分比） */
  CRITICAL_PRESSURE_THRESHOLD: 0.95,
  /** 中等压力阈值（百分比） */
  MEDIUM_PRESSURE_THRESHOLD: 0.6,
  /** 最大淘汰比例 */
  MAX_EVICTION_RATIO: 0.3,
  /** 最大淘汰比例（一半） */
  HALF_EVICTION_RATIO: 0.5,
  /** 对象池清理阈值 */
  POOL_CLEANUP_THRESHOLD: 50
};
const DATA_SIZE = {
  /** 字符串对象基础开销（字节） */
  STRING_OVERHEAD: 24,
  /** 数组基础开销（字节） */
  ARRAY_OVERHEAD: 24,
  /** 对象基础开销（字节） */
  OBJECT_OVERHEAD: 32,
  /** 基本类型大小 */
  BOOLEAN_SIZE: 4,
  NUMBER_SIZE: 8,
  NULL_SIZE: 8,
  /** 压缩最小大小（1KB） */
  COMPRESSION_MIN_SIZE: 1024,
  /** 压缩块大小（32KB） */
  COMPRESSION_CHUNK_SIZE: 32768,
  /** 压缩熵值阈值 */
  COMPRESSION_ENTROPY_THRESHOLD: 7.5
};
const UTF8_SIZE = {
  /** ASCII字符上限 */
  ASCII_MAX: 128,
  /** 2字节UTF-8字符上限 */
  TWO_BYTE_MAX: 2048,
  /** 3字节UTF-8字符上限 */
  THREE_BYTE_MAX: 65536,
  /** 对应的字节大小 */
  ONE_BYTE: 1,
  TWO_BYTES: 2,
  THREE_BYTES: 3,
  FOUR_BYTES: 4
};
const ENGINE_CONFIG = {
  /** 内存引擎默认最大大小（10MB） */
  MEMORY_MAX_SIZE_DEFAULT: 10 * 1024 * 1024,
  /** 内存引擎默认最大项数 */
  MEMORY_MAX_ITEMS_DEFAULT: 1e3,
  /** Cookie最大大小（4KB） */
  COOKIE_MAX_SIZE: 4 * 1024,
  /** LocalStorage推荐大小限制（5MB） */
  LOCAL_STORAGE_LIMIT: 5 * 1024 * 1024,
  /** SessionStorage推荐大小限制（5MB） */
  SESSION_STORAGE_LIMIT: 5 * 1024 * 1024
};
const PERFORMANCE_THRESHOLDS = {
  /** 小文件大小阈值（10KB） */
  SMALL_FILE_SIZE: 10 * 1024,
  /** 大文件大小阈值（1MB） */
  LARGE_FILE_SIZE: 1024 * 1024,
  /** 浏览器内存使用率高阈值 */
  BROWSER_MEMORY_HIGH: 0.8,
  /** 浏览器内存使用率中等阈值 */
  BROWSER_MEMORY_MEDIUM: 0.5,
  /** 服务器内存使用率高阈值 */
  SERVER_MEMORY_HIGH: 0.7,
  /** 服务器内存使用率中等阈值 */
  SERVER_MEMORY_MEDIUM: 0.8,
  /** 高性能CPU核心数阈值 */
  HIGH_PERFORMANCE_CORES: 8,
  /** 中性能CPU核心数阈值 */
  MEDIUM_PERFORMANCE_CORES: 4,
  /** 低性能CPU核心数阈值 */
  LOW_PERFORMANCE_CORES: 2
};
const COMPRESSION = {
  /** 默认压缩级别 */
  DEFAULT_LEVEL: 6,
  /** 最小压缩级别 */
  MIN_LEVEL: 1,
  /** 最大压缩级别 */
  MAX_LEVEL: 9,
  /** 典型压缩率（用于估算） */
  TYPICAL_RATIO: 0.3,
  /** 无压缩率 */
  NO_COMPRESSION_RATIO: 1
};
const HASH_CONFIG = {
  /** 哈希位移量 */
  HASH_SHIFT: 5,
  /** 哈希初始值 */
  HASH_INIT: 0
};
const DEBUG_CONFIG = {
  /** 是否启用调试日志（开发环境） */
  ENABLE_DEBUG: false,
  /** 是否启用性能分析 */
  ENABLE_PROFILING: false
};

exports.BATCH_CONFIG = BATCH_CONFIG;
exports.CACHE_SIZE = CACHE_SIZE;
exports.COMPRESSION = COMPRESSION;
exports.DATA_SIZE = DATA_SIZE;
exports.DEBUG_CONFIG = DEBUG_CONFIG;
exports.ENGINE_CONFIG = ENGINE_CONFIG;
exports.HASH_CONFIG = HASH_CONFIG;
exports.MEMORY_CONFIG = MEMORY_CONFIG;
exports.PERFORMANCE_THRESHOLDS = PERFORMANCE_THRESHOLDS;
exports.TIME_INTERVALS = TIME_INTERVALS;
exports.UTF8_SIZE = UTF8_SIZE;
/*! End of @ldesign/cache | Powered by @ldesign/builder */
//# sourceMappingURL=performance.cjs.map
