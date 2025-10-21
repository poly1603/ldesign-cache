export type RetryStrategy = 'exponential' | 'linear' | 'fixed' | 'fibonacci';
export interface RetryOptions {
    maxAttempts?: number;
    initialDelay?: number;
    maxDelay?: number;
    factor?: number;
    strategy?: RetryStrategy;
    jitter?: boolean;
    shouldRetry?: (error: Error, attempt: number) => boolean;
    onRetry?: (error: Error, attempt: number) => void;
    timeout?: number;
}
export interface RetryResult<T> {
    success: boolean;
    data?: T;
    error?: Error;
    attempts: number;
    totalDuration: number;
}
export type CircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';
export interface CircuitBreakerOptions {
    failureThreshold?: number;
    successThreshold?: number;
    timeout?: number;
    resetTimeout?: number;
    windowSize?: number;
}
export declare class RetryManager {
    private readonly defaultOptions;
    retry<T>(fn: () => Promise<T>, options?: RetryOptions): Promise<RetryResult<T>>;
    private calculateDelay;
    private fibonacci;
    private withTimeout;
    private sleep;
}
export declare class CircuitBreaker {
    private state;
    private failureCount;
    private successCount;
    private lastFailureTime?;
    private readonly requests;
    private readonly options;
    constructor(options?: CircuitBreakerOptions);
    execute<T>(fn: () => Promise<T>): Promise<T>;
    private onSuccess;
    private onFailure;
    private recordRequest;
    private getFailureRate;
    private shouldAttemptReset;
    private trip;
    private reset;
    private withTimeout;
    getState(): CircuitBreakerState;
    getStats(): {
        state: CircuitBreakerState;
        failureCount: number;
        successCount: number;
        failureRate: number;
    };
}
export declare class FallbackHandler<T> {
    private fallbacks;
    addFallback(fallback: () => Promise<T>): this;
    execute(primary: () => Promise<T>, options?: {
        onFallback?: (level: number, error: Error) => void;
    }): Promise<T>;
}
export declare function withRetry<T extends (...args: any[]) => Promise<any>>(fn: T, options?: RetryOptions): T;
export declare function withCircuitBreaker<T extends (...args: any[]) => Promise<any>>(fn: T, options?: CircuitBreakerOptions): T;
export declare function withFallback<T>(primary: () => Promise<T>, ...fallbacks: Array<() => Promise<T>>): () => Promise<T>;
//# sourceMappingURL=retry-manager.d.ts.map