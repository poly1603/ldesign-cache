export interface ThrottleConfig {
    batchSize?: number;
    flushInterval?: number;
    enabled?: boolean;
}
export interface BatchEventData<T = unknown> {
    events: T[];
    timestamp: number;
    size: number;
}
export type EventHandler<T = unknown> = (data: T) => void | Promise<void>;
export type BatchEventHandler<T = unknown> = (batch: BatchEventData<T>) => void | Promise<void>;
export declare class ThrottledEventEmitter<EventMap extends Record<string, unknown> = Record<string, unknown>> {
    private listeners;
    private batchListeners;
    private queues;
    private timers;
    private config;
    constructor(config?: ThrottleConfig);
    on<K extends keyof EventMap>(event: K & string, handler: EventHandler<EventMap[K]>): void;
    onBatch<K extends keyof EventMap>(event: K & string, handler: BatchEventHandler<EventMap[K]>): void;
    off<K extends keyof EventMap>(event: K & string, handler?: EventHandler<EventMap[K]>): void;
    offBatch<K extends keyof EventMap>(event: K & string, handler?: BatchEventHandler<EventMap[K]>): void;
    emit<K extends keyof EventMap>(event: K & string, data: EventMap[K]): void;
    flush(event: string): void;
    flushAll(): void;
    private scheduleFlush;
    private triggerListeners;
    private triggerBatchListeners;
    clear(): void;
    getStats(): {
        listeners: number;
        batchListeners: number;
        queuedEvents: number;
        activeTimers: number;
    };
    updateConfig(config: Partial<ThrottleConfig>): void;
    getConfig(): Readonly<Required<ThrottleConfig>>;
    destroy(): void;
}
export declare function createThrottledEmitter<EventMap extends Record<string, unknown> = Record<string, unknown>>(config?: ThrottleConfig): ThrottledEventEmitter<EventMap>;
export declare function throttle<T>(fn: (batch: T[]) => void | Promise<void>, options?: ThrottleConfig): (item: T) => void;
export declare function debounce<T extends (...args: unknown[]) => unknown>(fn: T, delay: number): (...args: Parameters<T>) => void;
//# sourceMappingURL=event-throttle.d.ts.map