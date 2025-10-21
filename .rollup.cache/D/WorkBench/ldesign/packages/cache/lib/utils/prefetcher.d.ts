/**
 * 预取策略类型
 */
export type PrefetchStrategy = 'eager' | 'lazy' | 'predictive' | 'manual';
/**
 * 预取规则
 */
export interface PrefetchRule {
    /** 规则 ID */
    id: string;
    /** 触发条件 */
    trigger: (context: PrefetchContext) => boolean;
    /** 要预取的键或键生成函数 */
    keys: string[] | ((context: PrefetchContext) => string[]);
    /** 数据获取函数 */
    fetcher: (key: string) => Promise<any>;
    /** 优先级（数字越大优先级越高） */
    priority?: number;
    /** 策略 */
    strategy?: PrefetchStrategy;
    /** 延迟时间（毫秒） */
    delay?: number;
}
/**
 * 预取上下文
 */
export interface PrefetchContext {
    /** 当前访问的键 */
    currentKey?: string;
    /** 最近访问的键 */
    recentKeys: string[];
    /** 访问时间 */
    timestamp: number;
    /** 用户自定义数据 */
    userData?: any;
}
/**
 * 预取配置
 */
export interface PrefetcherOptions {
    /** 最大并发预取数 */
    maxConcurrent?: number;
    /** 预取超时时间（毫秒） */
    timeout?: number;
    /** 是否启用预测性预取 */
    enablePredictive?: boolean;
    /** 预测窗口大小 */
    predictionWindow?: number;
    /** 最小置信度阈值 */
    minConfidence?: number;
    /** 是否在空闲时预取 */
    prefetchOnIdle?: boolean;
    /** 空闲时间阈值（毫秒） */
    idleThreshold?: number;
}
/**
 * 智能预取器
 *
 * 实现缓存预热、预测性预取和智能缓存策略
 */
export declare class Prefetcher {
    private readonly options;
    private readonly rules;
    private readonly accessHistory;
    private readonly patterns;
    private readonly tasks;
    private readonly cache;
    private runningTasks;
    private idleTimer?;
    private lastAccessTime;
    constructor(cache: Map<string, any>, options?: PrefetcherOptions);
    /**
     * 添加预取规则
     */
    addRule(rule: PrefetchRule): void;
    /**
     * 移除预取规则
     */
    removeRule(id: string): void;
    /**
     * 记录访问
     */
    recordAccess(key: string): void;
    /**
     * 获取最近访问的键
     */
    private getRecentKeys;
    /**
     * 更新访问模式
     */
    private updatePatterns;
    /**
     * 清理旧的访问模式
     */
    private cleanupPatterns;
    /**
     * 预测性预取
     */
    private predictivePrefetch;
    /**
     * 预测下一个可能访问的键
     */
    private predictNextKeys;
    /**
     * 检查预取规则
     */
    private checkPrefetchRules;
    /**
     * 创建预取任务
     */
    private createTask;
    /**
     * 执行预取任务
     */
    private executeTasks;
    /**
     * 运行单个任务
     */
    private runTask;
    /**
     * 设置空闲检测
     */
    private setupIdleDetection;
    /**
     * 空闲时触发
     */
    private onIdle;
    /**
     * 预热常用键
     */
    private warmupFrequentKeys;
    /**
     * 手动预取
     */
    prefetch(keys: string[], fetcher: (key: string) => Promise<any>, options?: {
        priority?: number;
        strategy?: PrefetchStrategy;
    }): Promise<void>;
    /**
     * 获取预取统计
     */
    getStats(): {
        totalTasks: number;
        pendingTasks: number;
        runningTasks: number;
        completedTasks: number;
        failedTasks: number;
        patterns: number;
        predictions: Array<{
            key: string;
            confidence: number;
        }>;
    };
    /**
     * 清理
     */
    dispose(): void;
}
/**
 * 创建预取装饰器
 */
export declare function withPrefetching<T extends {
    get: any;
    set: any;
    has: any;
}>(cache: T, options?: PrefetcherOptions): T & {
    prefetcher: Prefetcher;
};
