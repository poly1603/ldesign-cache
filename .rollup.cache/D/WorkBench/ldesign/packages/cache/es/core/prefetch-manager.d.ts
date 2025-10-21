/**
 * 智能预取和缓存预热管理器
 */
import type { SerializableValue, SetOptions } from '../types';
/**
 * 预取管理器配置
 */
export interface PrefetchConfig {
    /** 预取策略 */
    strategy?: 'markov' | 'lru' | 'association';
    /** 缓存获取器 */
    cacheGetter?: (key: string) => Promise<SerializableValue | null>;
    /** 缓存设置器 */
    cacheSetter?: (key: string, value: SerializableValue, opts?: SetOptions) => Promise<void>;
    /** 数据获取器 */
    fetcher?: (key: string) => Promise<SerializableValue>;
}
/**
 * 预取策略
 */
export interface PrefetchStrategy {
    /** 策略名称 */
    name: string;
    /** 预测下一个可能访问的键 */
    predict: (currentKey: string, history: string[]) => string[];
    /** 更新访问历史 */
    updateHistory: (key: string) => void;
    /** 清空历史 */
    clear: () => void;
}
/**
 * 预热配置
 */
export interface WarmupConfig {
    /** 预热的键列表 */
    keys?: string[];
    /** 预热的键模式 */
    patterns?: string[];
    /** 数据获取函数 */
    fetcher?: (key: string) => Promise<SerializableValue>;
    /** 批量获取函数 */
    batchFetcher?: (keys: string[]) => Promise<Map<string, SerializableValue>>;
    /** 并发数 */
    concurrency?: number;
    /** 重试次数 */
    retryCount?: number;
    /** 预热优先级 */
    priority?: 'high' | 'medium' | 'low';
}
/**
 * 智能预取管理器
 */
export declare class PrefetchManager {
    private strategies;
    private activeStrategy;
    private prefetchQueue;
    private prefetchInProgress;
    private cacheGetter?;
    private cacheSetter?;
    private fetcher?;
    constructor(config?: {
        strategy?: 'markov' | 'lru' | 'association';
        cacheGetter?: (key: string) => Promise<SerializableValue | null>;
        cacheSetter?: (key: string, value: SerializableValue, options?: SetOptions) => Promise<void>;
        fetcher?: (key: string) => Promise<SerializableValue>;
    });
    /**
     * 记录访问并触发预取
     */
    recordAccess(key: string): Promise<void>;
    /**
     * 预取数据
     */
    private prefetch;
    /**
     * 获取并缓存数据
     */
    private fetchAndCache;
    /**
     * 预热缓存
     */
    warmup(config: WarmupConfig): Promise<{
        success: string[];
        failed: Array<{
            key: string;
            error: Error;
        }>;
    }>;
    /**
     * 重试获取
     */
    private retryFetch;
    /**
     * 控制并发执行
     */
    private runConcurrent;
    /**
     * 切换预测策略
     */
    setStrategy(strategyName: 'markov' | 'lru' | 'association'): void;
    /**
     * 添加自定义策略
     */
    addStrategy(name: string, strategy: PrefetchStrategy): void;
    /**
     * 获取预取统计
     */
    getStats(): {
        queueSize: number;
        inProgressCount: number;
        strategy: string;
    };
    /**
     * 清空预取队列和历史
     */
    clear(): void;
}
/**
 * 创建预取管理器
 */
export declare function createPrefetchManager(config?: PrefetchConfig): PrefetchManager;
