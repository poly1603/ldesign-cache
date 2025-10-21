import type { SetOptions } from '../types';
import type { CacheManager } from './cache-manager';
/**
 * 预热配置项
 */
export interface WarmupItem<T = any> {
    /** 缓存键 */
    key: string;
    /** 数据获取函数 */
    fetcher: () => Promise<T> | T;
    /** 缓存选项 */
    options?: SetOptions;
    /** 优先级（数字越大优先级越高） */
    priority?: number;
    /** 依赖的其他键 */
    dependencies?: string[];
}
/**
 * 预热配置
 */
export interface WarmupConfig {
    /** 并发数限制 */
    concurrency?: number;
    /** 超时时间（毫秒） */
    timeout?: number;
    /** 失败重试次数 */
    retries?: number;
    /** 重试间隔（毫秒） */
    retryDelay?: number;
    /** 是否在失败时继续 */
    continueOnError?: boolean;
}
/**
 * 预热结果
 */
export interface WarmupResult {
    /** 成功的键 */
    successful: string[];
    /** 失败的项 */
    failed: Array<{
        key: string;
        error: Error;
        retries: number;
    }>;
    /** 总耗时（毫秒） */
    duration: number;
    /** 统计信息 */
    stats: {
        total: number;
        success: number;
        failed: number;
        skipped: number;
    };
}
/**
 * 缓存预热管理器
 *
 * 在应用启动时预加载重要数据到缓存中
 */
export declare class WarmupManager {
    private cache;
    private config;
    private warmupItems;
    private running;
    constructor(cache: CacheManager, config?: WarmupConfig);
    /**
     * 注册预热项
     */
    register<T = any>(item: WarmupItem<T> | WarmupItem<T>[]): void;
    /**
     * 注销预热项
     */
    unregister(key: string | string[]): void;
    /**
     * 执行预热
     */
    warmup(keys?: string[]): Promise<WarmupResult>;
    /**
     * 获取要预热的项
     */
    private getItemsToWarmup;
    /**
     * 按优先级排序
     */
    private sortByPriority;
    /**
     * 解析依赖关系
     */
    private resolveDependencies;
    /**
     * 分批处理
     */
    private processBatches;
    /**
     * 处理单个预热项
     */
    private processItem;
    /**
     * 带超时的数据获取
     */
    private fetchWithTimeout;
    /**
     * 延迟函数
     */
    private delay;
    /**
     * 获取预热状态
     */
    getStatus(): {
        running: boolean;
        itemCount: number;
        items: Array<{
            key: string;
            priority?: number;
        }>;
    };
    /**
     * 清空所有预热项
     */
    clear(): void;
}
/**
 * 创建预热管理器
 */
export declare function createWarmupManager(cache: CacheManager, config?: WarmupConfig): WarmupManager;
