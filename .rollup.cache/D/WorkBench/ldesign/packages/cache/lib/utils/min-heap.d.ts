/**
 * 最小堆数据结构
 *
 * 用于高效管理过期队列，提供 O(log n) 的插入和删除操作
 */
/**
 * 堆节点接口
 */
export interface HeapNode<T = unknown> {
    /** 优先级（用于排序） */
    priority: number;
    /** 节点数据 */
    data: T;
}
/**
 * 最小堆类
 *
 * 提供高效的优先队列实现
 *
 * @example
 * ```typescript
 * const heap = new MinHeap<string>()
 * heap.insert(5, 'five')
 * heap.insert(3, 'three')
 * heap.insert(7, 'seven')
 *
 * ) // { priority: 3, data: 'three' }
 * ) // { priority: 3, data: 'three' }
 * ```
 */
export declare class MinHeap<T = unknown> {
    /** 堆数组 */
    private heap;
    /** 数据到索引的映射（用于快速查找） */
    private indexMap;
    /**
     * 获取堆大小
     */
    get size(): number;
    /**
     * 检查堆是否为空
     */
    isEmpty(): boolean;
    /**
     * 插入元素
     *
     * @param priority - 优先级（越小越优先）
     * @param data - 数据
     *
     * 时间复杂度: O(log n)
     */
    insert(priority: number, data: T): void;
    /**
     * 查看堆顶元素（不删除）
     *
     * @returns 堆顶元素，如果堆为空则返回 null
     *
     * 时间复杂度: O(1)
     */
    peek(): HeapNode<T> | null;
    /**
     * 提取堆顶元素（删除并返回）
     *
     * @returns 堆顶元素，如果堆为空则返回 null
     *
     * 时间复杂度: O(log n)
     */
    extract(): HeapNode<T> | null;
    /**
     * 删除指定数据的节点
     *
     * @param data - 要删除的数据
     * @returns 是否成功删除
     *
     * 时间复杂度: O(log n)
     */
    remove(data: T): boolean;
    /**
     * 更新元素的优先级
     *
     * @param data - 要更新的数据
     * @param newPriority - 新优先级
     * @returns 是否成功更新
     *
     * 时间复杂度: O(log n)
     */
    updatePriority(data: T, newPriority: number): boolean;
    /**
     * 检查是否包含指定数据
     *
     * @param data - 要检查的数据
     * @returns 是否包含
     *
     * 时间复杂度: O(1)
     */
    has(data: T): boolean;
    /**
     * 清空堆
     */
    clear(): void;
    /**
     * 获取所有元素（按堆顺序，非排序）
     *
     * @returns 所有节点的副本
     */
    toArray(): HeapNode<T>[];
    /**
     * 获取所有元素（已排序）
     *
     * @returns 按优先级排序的节点数组
     *
     * 时间复杂度: O(n log n)
     */
    toSortedArray(): HeapNode<T>[];
    /**
     * 向上冒泡（用于插入后调整）
     *
     * @param index - 起始索引
     */
    private bubbleUp;
    /**
     * 向下冒泡（用于删除后调整）
     *
     * @param index - 起始索引
     */
    private bubbleDown;
    /**
     * 交换两个节点
     *
     * @param i - 索引 1
     * @param j - 索引 2
     */
    private swap;
    /**
     * 获取统计信息
     */
    getStats(): {
        size: number;
        height: number;
        minPriority: number | null;
        maxPriority: number | null;
    };
}
/**
 * 创建最小堆
 *
 * @returns 最小堆实例
 */
export declare function createMinHeap<T = unknown>(): MinHeap<T>;
/**
 * 从数组创建最小堆
 *
 * @param items - 初始项目数组
 * @returns 最小堆实例
 *
 * @example
 * ```typescript
 * const heap = createMinHeapFromArray([
 *   { priority: 5, data: 'five' },
 *   { priority: 3, data: 'three' },
 *   { priority: 7, data: 'seven' }
 * ])
 * ```
 */
export declare function createMinHeapFromArray<T = unknown>(items: Array<{
    priority: number;
    data: T;
}>): MinHeap<T>;
