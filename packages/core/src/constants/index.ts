/**
 * 缓存管理库常量定义
 * @module @ldesign/cache/core/constants
 */

/**
 * 默认配置常量
 */
export const DEFAULT_CONFIG = {
  /** 默认最大缓存容量 */
  MAX_SIZE: 100,
  /** 默认 TTL（5 分钟） */
  DEFAULT_TTL: 5 * 60 * 1000,
  /** 默认清理间隔（1 分钟） */
  CLEANUP_INTERVAL: 60 * 1000,
  /** 默认存储前缀 */
  STORAGE_PREFIX: 'ldesign-cache:',
  /** 默认命名空间 */
  DEFAULT_NAMESPACE: 'default',
} as const

/**
 * 性能相关常量
 */
export const PERFORMANCE = {
  /** 性能指标采样窗口大小 */
  METRICS_WINDOW_SIZE: 1000,
  /** 性能指标保留时间（1 小时） */
  METRICS_RETENTION: 60 * 60 * 1000,
} as const

/**
 * 存储相关常量
 */
export const STORAGE = {
  /** IndexedDB 数据库名称 */
  INDEXEDDB_NAME: 'ldesign-cache',
  /** IndexedDB 存储对象名称 */
  INDEXEDDB_STORE: 'cache-items',
  /** IndexedDB 版本 */
  INDEXEDDB_VERSION: 1,
} as const

/**
 * 错误消息常量
 */
export const ERROR_MESSAGES = {
  INVALID_KEY: '缓存键不能为空',
  INVALID_VALUE: '缓存值不能为 undefined',
  INVALID_TTL: 'TTL 必须是正数',
  INVALID_MAX_SIZE: '最大容量必须是正数',
  STORAGE_NOT_AVAILABLE: '存储不可用',
  SERIALIZATION_ERROR: '序列化失败',
  DESERIALIZATION_ERROR: '反序列化失败',
  ENCRYPTION_ERROR: '加密失败',
  DECRYPTION_ERROR: '解密失败',
  COMPRESSION_ERROR: '压缩失败',
  DECOMPRESSION_ERROR: '解压失败',
} as const

/**
 * 版本信息
 */
export const VERSION = '1.0.0'

