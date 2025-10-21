export interface HeapNode<T = unknown> {
    priority: number;
    data: T;
}
export declare class MinHeap<T = unknown> {
    private heap;
    private indexMap;
    get size(): number;
    isEmpty(): boolean;
    insert(priority: number, data: T): void;
    peek(): HeapNode<T> | null;
    extract(): HeapNode<T> | null;
    remove(data: T): boolean;
    updatePriority(data: T, newPriority: number): boolean;
    has(data: T): boolean;
    clear(): void;
    toArray(): HeapNode<T>[];
    toSortedArray(): HeapNode<T>[];
    private bubbleUp;
    private bubbleDown;
    private swap;
    getStats(): {
        size: number;
        height: number;
        minPriority: number | null;
        maxPriority: number | null;
    };
}
export declare function createMinHeap<T = unknown>(): MinHeap<T>;
export declare function createMinHeapFromArray<T = unknown>(items: Array<{
    priority: number;
    data: T;
}>): MinHeap<T>;
//# sourceMappingURL=min-heap.d.ts.map