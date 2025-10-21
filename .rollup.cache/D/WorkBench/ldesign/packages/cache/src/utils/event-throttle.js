import { BATCH_CONFIG, TIME_INTERVALS } from '../constants/performance';
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
export class ThrottledEventEmitter {
    /**
     * 构造函数
     */
    constructor(config = {}) {
        /** 事件监听器映射 */
        Object.defineProperty(this, "listeners", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        /** 批量事件监听器映射 */
        Object.defineProperty(this, "batchListeners", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        /** 事件队列映射 */
        Object.defineProperty(this, "queues", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        /** 刷新定时器映射 */
        Object.defineProperty(this, "timers", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        /** 配置 */
        Object.defineProperty(this, "config", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.listeners = new Map();
        this.batchListeners = new Map();
        this.queues = new Map();
        this.timers = new Map();
        this.config = {
            batchSize: config.batchSize ?? BATCH_CONFIG.DEFAULT_SIZE,
            flushInterval: config.flushInterval ?? TIME_INTERVALS.EVENT_FLUSH_DEFAULT,
            enabled: config.enabled ?? true,
        };
    }
    /**
     * 注册单个事件监听器
     *
     * @param event - 事件名称
     * @param handler - 事件处理器
     */
    on(event, handler) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(handler);
    }
    /**
     * 注册批量事件监听器
     *
     * @param event - 事件名称
     * @param handler - 批量事件处理器
     */
    onBatch(event, handler) {
        if (!this.batchListeners.has(event)) {
            this.batchListeners.set(event, new Set());
        }
        this.batchListeners.get(event).add(handler);
    }
    /**
     * 移除事件监听器
     *
     * @param event - 事件名称
     * @param handler - 事件处理器
     */
    off(event, handler) {
        if (handler) {
            this.listeners.get(event)?.delete(handler);
        }
        else {
            this.listeners.delete(event);
        }
    }
    /**
     * 移除批量事件监听器
     *
     * @param event - 事件名称
     * @param handler - 批量事件处理器
     */
    offBatch(event, handler) {
        if (handler) {
            this.batchListeners.get(event)?.delete(handler);
        }
        else {
            this.batchListeners.delete(event);
        }
    }
    /**
     * 发射事件
     *
     * @param event - 事件名称
     * @param data - 事件数据
     */
    emit(event, data) {
        if (!this.config?.enabled) {
            // 如果未启用节流，直接触发
            this.triggerListeners(event, data);
            return;
        }
        // 添加到队列
        if (!this.queues.has(event)) {
            this.queues.set(event, []);
        }
        this.queues.get(event).push(data);
        // 检查是否需要立即刷新
        if (this.queues.get(event).length >= this.config?.batchSize) {
            this.flush(event);
        }
        else {
            // 设置定时刷新
            this.scheduleFlush(event);
        }
    }
    /**
     * 立即刷新指定事件的队列
     *
     * @param event - 事件名称
     */
    flush(event) {
        const queue = this.queues.get(event);
        if (!queue || queue.length === 0) {
            return;
        }
        // 清除定时器
        const timer = this.timers.get(event);
        if (timer) {
            clearTimeout(timer);
            this.timers.delete(event);
        }
        // 创建批次数据
        const batch = {
            events: [...queue],
            timestamp: Date.now(),
            size: queue.length,
        };
        // 清空队列
        queue.length = 0;
        // 触发批量监听器
        this.triggerBatchListeners(event, batch);
        // 如果没有批量监听器，触发单个监听器
        if (!this.batchListeners.has(event) || this.batchListeners.get(event).size === 0) {
            for (const eventData of batch.events) {
                this.triggerListeners(event, eventData);
            }
        }
    }
    /**
     * 刷新所有事件队列
     */
    flushAll() {
        for (const event of this.queues.keys()) {
            this.flush(event);
        }
    }
    /**
     * 安排刷新任务
     *
     * @param event - 事件名称
     */
    scheduleFlush(event) {
        // 如果已有定时器，不重复设置
        if (this.timers.has(event)) {
            return;
        }
        const timer = setTimeout(() => {
            this.flush(event);
        }, this.config?.flushInterval);
        this.timers.set(event, timer);
    }
    /**
     * 触发单个事件监听器
     *
     * @param event - 事件名称
     * @param data - 事件数据
     */
    triggerListeners(event, data) {
        const handlers = this.listeners.get(event);
        if (!handlers || handlers.size === 0) {
            return;
        }
        for (const handler of handlers) {
            try {
                const result = handler(data);
                if (result instanceof Promise) {
                    result.catch(error => {
                        console.error(`Error in event handler for "${event}":`, error);
                    });
                }
            }
            catch (error) {
                console.error(`Error in event handler for "${event}":`, error);
            }
        }
    }
    /**
     * 触发批量事件监听器
     *
     * @param event - 事件名称
     * @param batch - 批量事件数据
     */
    triggerBatchListeners(event, batch) {
        const handlers = this.batchListeners.get(event);
        if (!handlers || handlers.size === 0) {
            return;
        }
        for (const handler of handlers) {
            try {
                const result = handler(batch);
                if (result instanceof Promise) {
                    result.catch(error => {
                        console.error(`Error in batch event handler for "${event}":`, error);
                    });
                }
            }
            catch (error) {
                console.error(`Error in batch event handler for "${event}":`, error);
            }
        }
    }
    /**
     * 清理所有监听器和队列
     */
    clear() {
        // 清理所有定时器
        for (const timer of this.timers.values()) {
            clearTimeout(timer);
        }
        this.listeners.clear();
        this.batchListeners.clear();
        this.queues.clear();
        this.timers.clear();
    }
    /**
     * 获取统计信息
     */
    getStats() {
        let totalListeners = 0;
        for (const handlers of this.listeners.values()) {
            totalListeners += handlers.size;
        }
        let totalBatchListeners = 0;
        for (const handlers of this.batchListeners.values()) {
            totalBatchListeners += handlers.size;
        }
        let totalQueued = 0;
        for (const queue of this.queues.values()) {
            totalQueued += queue.length;
        }
        return {
            listeners: totalListeners,
            batchListeners: totalBatchListeners,
            queuedEvents: totalQueued,
            activeTimers: this.timers.size,
        };
    }
    /**
     * 更新配置
     *
     * @param config - 新配置
     */
    updateConfig(config) {
        Object.assign(this.config, config);
    }
    /**
     * 获取当前配置
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * 销毁
     */
    destroy() {
        this.flushAll();
        this.clear();
    }
}
/**
 * 创建节流事件发射器
 *
 * @param config - 配置选项
 * @returns 节流事件发射器实例
 */
export function createThrottledEmitter(config) {
    return new ThrottledEventEmitter(config);
}
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
export function throttle(fn, options = {}) {
    const queue = [];
    let timer = null;
    const batchSize = options.batchSize ?? BATCH_CONFIG.DEFAULT_SIZE;
    const flushInterval = options.flushInterval ?? TIME_INTERVALS.EVENT_FLUSH_DEFAULT;
    const flush = () => {
        if (queue.length === 0) {
            return;
        }
        if (timer) {
            clearTimeout(timer);
            timer = null;
        }
        const batch = [...queue];
        queue.length = 0;
        try {
            const result = fn(batch);
            if (result instanceof Promise) {
                result.catch(error => {
                    console.error('Error in throttled function:', error);
                });
            }
        }
        catch (error) {
            console.error('Error in throttled function:', error);
        }
    };
    return (item) => {
        queue.push(item);
        if (queue.length >= batchSize) {
            flush();
        }
        else if (!timer) {
            timer = setTimeout(flush, flushInterval);
        }
    };
}
/**
 * 防抖函数
 *
 * 在指定时间内只执行一次
 *
 * @param fn - 要防抖的函数
 * @param delay - 延迟时间（毫秒）
 * @returns 防抖后的函数
 */
export function debounce(fn, delay) {
    let timer = null;
    return (...args) => {
        if (timer) {
            clearTimeout(timer);
        }
        timer = setTimeout(() => {
            fn(...args);
            timer = null;
        }, delay);
    };
}
//# sourceMappingURL=event-throttle.js.map