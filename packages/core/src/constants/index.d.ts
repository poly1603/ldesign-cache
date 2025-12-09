/**
 * 缓存管理库常量定义
 * @module @ldesign/cache/core/constants
 */
/**
 * 默认配置常量
 */
export declare const DEFAULT_CONFIG: {
    /** 默认最大缓存容量 */
    readonly MAX_SIZE: 100;
    /** 默认 TTL（5 分钟） */
    readonly DEFAULT_TTL: number;
    /** 默认清理间隔（1 分钟） */
    readonly CLEANUP_INTERVAL: number;
    /** 默认存储前缀 */
    readonly STORAGE_PREFIX: "ldesign-cache:";
    /** 默认命名空间 */
    readonly DEFAULT_NAMESPACE: "default";
};
/**
 * 性能相关常量
 */
export declare const PERFORMANCE: {
    /** 性能指标采样窗口大小 */
    readonly METRICS_WINDOW_SIZE: 1000;
    /** 性能指标保留时间（1 小时） */
    readonly METRICS_RETENTION: number;
};
/**
 * 存储相关常量
 */
export declare const STORAGE: {
    /** IndexedDB 数据库名称 */
    readonly INDEXEDDB_NAME: "ldesign-cache";
    /** IndexedDB 存储对象名称 */
    readonly INDEXEDDB_STORE: "cache-items";
    /** IndexedDB 版本 */
    readonly INDEXEDDB_VERSION: 1;
};
/**
 * 错误消息常量
 */
export declare const ERROR_MESSAGES: {
    readonly INVALID_KEY: "缓存键不能为空";
    readonly INVALID_VALUE: "缓存值不能为 undefined";
    readonly INVALID_TTL: "TTL 必须是正数";
    readonly INVALID_MAX_SIZE: "最大容量必须是正数";
    readonly STORAGE_NOT_AVAILABLE: "存储不可用";
    readonly SERIALIZATION_ERROR: "序列化失败";
    readonly DESERIALIZATION_ERROR: "反序列化失败";
    readonly ENCRYPTION_ERROR: "加密失败";
    readonly DECRYPTION_ERROR: "解密失败";
    readonly COMPRESSION_ERROR: "压缩失败";
    readonly DECOMPRESSION_ERROR: "解压失败";
};
/**
 * 版本信息
 */
export declare const VERSION = "1.0.0";
