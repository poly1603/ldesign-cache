export type EventListener<T = unknown> = (event: T) => void;
export declare class EventEmitter<T = unknown> {
    private readonly listeners;
    on(event: string, listener: EventListener<T>): void;
    off(event: string, listener: EventListener<T>): void;
    once(event: string, listener: EventListener<T>): void;
    emit(event: string, data: T): void;
    removeAllListeners(event?: string): void;
    listenerCount(event: string): number;
    eventNames(): readonly string[];
    hasListeners(event?: string): boolean;
    getListeners(event: string): readonly EventListener<T>[];
    getStats(): {
        eventCount: number;
        listenerCount: number;
        events: Record<string, number>;
    };
}
//# sourceMappingURL=event-emitter.d.ts.map