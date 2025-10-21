/**
 * 重试策略
 */
export type RetryStrategy = 'exponential' | 'linear' | 'fixed' | 'fibonacci';
/**
 * 重试配置
 */
export interface RetryOptions {
    /** 最大重试次数 */
    maxAttempts?: number;
    /** 初始延迟（毫秒） */
    initialDelay?: number;
    /** 最大延迟（毫秒） */
    maxDelay?: number;
    /** 延迟因子 */
    factor?: number;
    /** 重试策略 */
    strategy?: RetryStrategy;
    /** 是否在重试时添加抖动 */
    jitter?: boolean;
    /** 判断是否应该重试的函数 */
    shouldRetry?: (error: Error, attempt: number) => boolean;
    /** 重试前的回调 */
    onRetry?: (error: Error, attempt: number) => void;
    /** 超时时间（毫秒） */
    timeout?: number;
}
/**
 * 重试结果
 */
export interface RetryResult<T> {
    /** 是否成功 */
    success: boolean;
    /** 返回值 */
    data?: T;
    /** 错误 */
    error?: Error;
    /** 尝试次数 */
    attempts: number;
    /** 总耗时 */
    totalDuration: number;
}
/**
 * 断路器状态
 */
export type CircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';
/**
 * 断路器配置
 */
export interface CircuitBreakerOptions {
    /** 失败阈值 */
    failureThreshold?: number;
    /** 成功阈值（半开状态） */
    successThreshold?: number;
    /** 超时时间（毫秒） */
    timeout?: number;
    /** 重置时间（毫秒） */
    resetTimeout?: number;
    /** 监控窗口大小 */
    windowSize?: number;
}
/**
 * 重试管理器
 *
 * 提供自动重试、断路器、降级等容错机制
 */
export declare class RetryManager {
    private readonly defaultOptions;
    /**
     * 执行带重试的操作
     */
    retry<T>(fn: () => Promise<T>, options?: RetryOptions): Promise<RetryResult<T>>;
    /**
     * 计算重试延迟
     */
    private calculateDelay;
    /**
     * 斐波那契数列
     */
    private fibonacci;
    /**
     * 添加超时
     */
    private withTimeout;
    /**
     * 休眠
     */
    private sleep;
}
/**
 * 断路器
 *
 * 防止故障级联，提供快速失败机制
 */
export declare class CircuitBreaker {
    private state;
    private failureCount;
    private successCount;
    private lastFailureTime?;
    private readonly requests;
    private readonly options;
    constructor(options?: CircuitBreakerOptions);
    /**
     * 执行操作
     */
    execute<T>(fn: () => Promise<T>): Promise<T>;
    /**
     * 成功处理
     */
    private onSuccess;
    /**
     * 失败处理
     */
    private onFailure;
    /**
     * 记录请求
     */
    private recordRequest;
    /**
     * 获取失败率
     */
    private getFailureRate;
    /**
     * 是否应该尝试重置
     */
    private shouldAttemptReset;
    /**
     * 触发断路器
     */
    private trip;
    /**
     * 重置断路器
     */
    private reset;
    /**
     * 添加超时
     */
    private withTimeout;
    /**
     * 获取状态
     */
    getState(): CircuitBreakerState;
    /**
     * 获取统计信息
     */
    getStats(): {
        state: CircuitBreakerState;
        failureCount: number;
        successCount: number;
        failureRate: number;
    };
}
/**
 * 降级处理器
 *
 * 提供降级策略，当主服务不可用时使用备用方案
 */
export declare class FallbackHandler<T> {
    private fallbacks;
    /**
     * 添加降级方案
     */
    addFallback(fallback: () => Promise<T>): this;
    /**
     * 执行操作，失败时尝试降级
     */
    execute(primary: () => Promise<T>, options?: {
        onFallback?: (level: number, error: Error) => void;
    }): Promise<T>;
}
/**
 * 创建带重试的函数
 */
export declare function withRetry<T extends (...args: any[]) => Promise<any>>(fn: T, options?: RetryOptions): T;
/**
 * 创建带断路器的函数
 */
export declare function withCircuitBreaker<T extends (...args: any[]) => Promise<any>>(fn: T, options?: CircuitBreakerOptions): T;
/**
 * 创建带降级的函数
 */
export declare function withFallback<T>(primary: () => Promise<T>, ...fallbacks: Array<() => Promise<T>>): () => Promise<T>;
