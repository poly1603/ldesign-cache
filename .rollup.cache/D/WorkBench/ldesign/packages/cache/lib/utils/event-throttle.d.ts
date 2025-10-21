/**
 * 事件节流优化工具
 *
 * 提供事件批量处理和节流功能，显著减少高频事件的性能开销
 */
/**
 * 节流事件配置
 */
export interface ThrottleConfig {
    /** 批量大小（达到此数量立即触发） */
    batchSize?: number;
    /** 刷新间隔（毫秒） */
    flushInterval?: number;
    /** 是否启用 */
    enabled?: boolean;
}
/**
 * 批量事件数据
 */
export interface BatchEventData<T = unknown> {
    /** 事件列表 */
    events: T[];
    /** 批次创建时间 */
    timestamp: number;
    /** 批次大小 */
    size: number;
}
/**
 * 事件处理器类型
 */
export type EventHandler<T = unknown> = (data: T) => void | Promise<void>;
/**
 * 批量事件处理器类型
 */
export type BatchEventHandler<T = unknown> = (batch: BatchEventData<T>) => void | Promise<void>;
/**
 * 节流事件发射器
 *
 * 将高频事件批量处理，减少事件监听器的调用次数
 *
 * @example
 * ```typescript
 * const emitter = new ThrottledEventEmitter({ batchSize: 10, flushInterval: 100 })
 *
 * emitter.on('data', (batch) => {
 *
 * })
 *
 * // 发送多个事件
 * for (let i = 0; i < 100; i++) {
 *   emitter.emit('data', { value: i })
 * }
 * ```
 */
export declare class ThrottledEventEmitter<EventMap extends Record<string, unknown> = Record<string, unknown>> {
    /** 事件监听器映射 */
    private listeners;
    /** 批量事件监听器映射 */
    private batchListeners;
    /** 事件队列映射 */
    private queues;
    /** 刷新定时器映射 */
    private timers;
    /** 配置 */
    private config;
    /**
     * 构造函数
     */
    constructor(config?: ThrottleConfig);
    /**
     * 注册单个事件监听器
     *
     * @param event - 事件名称
     * @param handler - 事件处理器
     */
    on<K extends keyof EventMap>(event: K & string, handler: EventHandler<EventMap[K]>): void;
    /**
     * 注册批量事件监听器
     *
     * @param event - 事件名称
     * @param handler - 批量事件处理器
     */
    onBatch<K extends keyof EventMap>(event: K & string, handler: BatchEventHandler<EventMap[K]>): void;
    /**
     * 移除事件监听器
     *
     * @param event - 事件名称
     * @param handler - 事件处理器
     */
    off<K extends keyof EventMap>(event: K & string, handler?: EventHandler<EventMap[K]>): void;
    /**
     * 移除批量事件监听器
     *
     * @param event - 事件名称
     * @param handler - 批量事件处理器
     */
    offBatch<K extends keyof EventMap>(event: K & string, handler?: BatchEventHandler<EventMap[K]>): void;
    /**
     * 发射事件
     *
     * @param event - 事件名称
     * @param data - 事件数据
     */
    emit<K extends keyof EventMap>(event: K & string, data: EventMap[K]): void;
    /**
     * 立即刷新指定事件的队列
     *
     * @param event - 事件名称
     */
    flush(event: string): void;
    /**
     * 刷新所有事件队列
     */
    flushAll(): void;
    /**
     * 安排刷新任务
     *
     * @param event - 事件名称
     */
    private scheduleFlush;
    /**
     * 触发单个事件监听器
     *
     * @param event - 事件名称
     * @param data - 事件数据
     */
    private triggerListeners;
    /**
     * 触发批量事件监听器
     *
     * @param event - 事件名称
     * @param batch - 批量事件数据
     */
    private triggerBatchListeners;
    /**
     * 清理所有监听器和队列
     */
    clear(): void;
    /**
     * 获取统计信息
     */
    getStats(): {
        listeners: number;
        batchListeners: number;
        queuedEvents: number;
        activeTimers: number;
    };
    /**
     * 更新配置
     *
     * @param config - 新配置
     */
    updateConfig(config: Partial<ThrottleConfig>): void;
    /**
     * 获取当前配置
     */
    getConfig(): Readonly<Required<ThrottleConfig>>;
    /**
     * 销毁
     */
    destroy(): void;
}
/**
 * 创建节流事件发射器
 *
 * @param config - 配置选项
 * @returns 节流事件发射器实例
 */
export declare function createThrottledEmitter<EventMap extends Record<string, unknown> = Record<string, unknown>>(config?: ThrottleConfig): ThrottledEventEmitter<EventMap>;
/**
 * 简单的事件节流函数
 *
 * 将函数调用批量处理，减少执行次数
 *
 * @param fn - 要节流的函数
 * @param options - 节流选项
 * @returns 节流后的函数
 *
 * @example
 * ```typescript
 * const throttled = throttle(
 *   (items) => ,
 *   { batchSize: 10, flushInterval: 100 }
 * )
 *
 * // 调用多次，但会批量处理
 * for (let i = 0; i < 100; i++) {
 *   throttled(i)
 * }
 * ```
 */
export declare function throttle<T>(fn: (batch: T[]) => void | Promise<void>, options?: ThrottleConfig): (item: T) => void;
/**
 * 防抖函数
 *
 * 在指定时间内只执行一次
 *
 * @param fn - 要防抖的函数
 * @param delay - 延迟时间（毫秒）
 * @returns 防抖后的函数
 */
export declare function debounce<T extends (...args: unknown[]) => unknown>(fn: T, delay: number): (...args: Parameters<T>) => void;
