export declare const CACHE_SIZE: {
    readonly SERIALIZATION_DEFAULT: 500;
    readonly SERIALIZATION_MIN: 100;
    readonly SERIALIZATION_MAX: 5000;
    readonly STRING_CACHE_MAX: 500;
    readonly SIZE_CACHE_LIMIT: 1000;
    readonly OBJECT_POOL_DEFAULT: 100;
    readonly OBJECT_POOL_METADATA: 500;
    readonly OBJECT_POOL_CACHE_ITEM: 500;
    readonly EVENT_THROTTLE_MAX: 200;
};
export declare const TIME_INTERVALS: {
    readonly SERIALIZATION_TTL_DEFAULT: 5000;
    readonly SERIALIZATION_TTL_MIN: 3000;
    readonly SERIALIZATION_TTL_MAX: 30000;
    readonly CLEANUP_INTERVAL_DEFAULT: 60000;
    readonly CLEANUP_INTERVAL_MIN: 10000;
    readonly EVENT_FLUSH_DEFAULT: 100;
    readonly EVENT_FLUSH_MIN: 10;
    readonly EVENT_FLUSH_MAX: 200;
    readonly AUTO_SAVE_THROTTLE_DEFAULT: 500;
    readonly AUTO_SAVE_DEBOUNCE_DEFAULT: 100;
    readonly HIGH_PRESSURE_CLEANUP_INTERVAL: 10000;
};
export declare const BATCH_CONFIG: {
    readonly DEFAULT_SIZE: 10;
    readonly MIN_SIZE: 1;
    readonly MAX_SIZE: 100;
    readonly LOW_PERFORMANCE: 20;
    readonly HIGH_PERFORMANCE: 5;
    readonly EXTREME_PERFORMANCE: 1;
};
export declare const MEMORY_CONFIG: {
    readonly MAX_DEFAULT: number;
    readonly MIN_LIMIT: number;
    readonly HIGH_PRESSURE_THRESHOLD: 0.8;
    readonly CRITICAL_PRESSURE_THRESHOLD: 0.95;
    readonly MEDIUM_PRESSURE_THRESHOLD: 0.6;
    readonly MAX_EVICTION_RATIO: 0.3;
    readonly HALF_EVICTION_RATIO: 0.5;
    readonly POOL_CLEANUP_THRESHOLD: 50;
};
export declare const DATA_SIZE: {
    readonly STRING_OVERHEAD: 24;
    readonly ARRAY_OVERHEAD: 24;
    readonly OBJECT_OVERHEAD: 32;
    readonly BOOLEAN_SIZE: 4;
    readonly NUMBER_SIZE: 8;
    readonly NULL_SIZE: 8;
    readonly COMPRESSION_MIN_SIZE: 1024;
    readonly COMPRESSION_CHUNK_SIZE: 32768;
    readonly COMPRESSION_ENTROPY_THRESHOLD: 7.5;
};
export declare const UTF8_SIZE: {
    readonly ASCII_MAX: 128;
    readonly TWO_BYTE_MAX: 2048;
    readonly THREE_BYTE_MAX: 65536;
    readonly ONE_BYTE: 1;
    readonly TWO_BYTES: 2;
    readonly THREE_BYTES: 3;
    readonly FOUR_BYTES: 4;
};
export declare const ENGINE_CONFIG: {
    readonly MEMORY_MAX_SIZE_DEFAULT: number;
    readonly MEMORY_MAX_ITEMS_DEFAULT: 1000;
    readonly COOKIE_MAX_SIZE: number;
    readonly LOCAL_STORAGE_LIMIT: number;
    readonly SESSION_STORAGE_LIMIT: number;
};
export declare const PERFORMANCE_THRESHOLDS: {
    readonly SMALL_FILE_SIZE: number;
    readonly LARGE_FILE_SIZE: number;
    readonly BROWSER_MEMORY_HIGH: 0.8;
    readonly BROWSER_MEMORY_MEDIUM: 0.5;
    readonly SERVER_MEMORY_HIGH: 0.7;
    readonly SERVER_MEMORY_MEDIUM: 0.8;
    readonly HIGH_PERFORMANCE_CORES: 8;
    readonly MEDIUM_PERFORMANCE_CORES: 4;
    readonly LOW_PERFORMANCE_CORES: 2;
};
export declare const COMPRESSION: {
    readonly DEFAULT_LEVEL: 6;
    readonly MIN_LEVEL: 1;
    readonly MAX_LEVEL: 9;
    readonly TYPICAL_RATIO: 0.3;
    readonly NO_COMPRESSION_RATIO: 1;
};
export declare const HASH_CONFIG: {
    readonly HASH_SHIFT: 5;
    readonly HASH_INIT: 0;
};
export declare const DEBUG_CONFIG: {
    readonly ENABLE_DEBUG: false;
    readonly ENABLE_PROFILING: false;
};
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
//# sourceMappingURL=performance.d.ts.map