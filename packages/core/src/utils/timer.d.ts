/**
 * 定时器工具函数
 * @module @ldesign/cache/core/utils/timer
 */
/**
 * 定时器管理器
 */
export declare class TimerManager {
    private timers;
    /**
     * 设置定时器
     * @param id - 定时器 ID
     * @param callback - 回调函数
     * @param delay - 延迟时间（毫秒）
     */
    set(id: string, callback: () => void, delay: number): void;
    /**
     * 清除定时器
     * @param id - 定时器 ID
     */
    clear(id: string): void;
    /**
     * 清除所有定时器
     */
    clearAll(): void;
    /**
     * 获取定时器数量
     */
    get size(): number;
}
/**
 * 延迟执行
 * @param ms - 延迟时间（毫秒）
 * @returns Promise
 */
export declare function delay(ms: number): Promise<void>;
/**
 * 测量函数执行时间
 * @param fn - 要测量的函数
 * @returns 执行时间（毫秒）和函数返回值
 */
export declare function measureTime<T>(fn: () => T | Promise<T>): Promise<{
    time: number;
    result: T;
}>;
