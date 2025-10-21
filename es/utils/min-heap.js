/*!
 * ***********************************
 * @ldesign/cache v0.1.1           *
 * Built with rollup               *
 * Build time: 2024-10-21 14:32:03 *
 * Build mode: production          *
 * Minified: No                    *
 * ***********************************
 */
class MinHeap {
  constructor() {
    Object.defineProperty(this, "heap", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: []
    });
    Object.defineProperty(this, "indexMap", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: /* @__PURE__ */ new Map()
    });
  }
  /**
   * 获取堆大小
   */
  get size() {
    return this.heap.length;
  }
  /**
   * 检查堆是否为空
   */
  isEmpty() {
    return this.heap.length === 0;
  }
  /**
   * 插入元素
   *
   * @param priority - 优先级（越小越优先）
   * @param data - 数据
   *
   * 时间复杂度: O(log n)
   */
  insert(priority, data) {
    const node = {
      priority,
      data
    };
    this.heap.push(node);
    this.indexMap.set(data, this.heap.length - 1);
    this.bubbleUp(this.heap.length - 1);
  }
  /**
   * 查看堆顶元素（不删除）
   *
   * @returns 堆顶元素，如果堆为空则返回 null
   *
   * 时间复杂度: O(1)
   */
  peek() {
    return this.heap.length > 0 ? this.heap[0] : null;
  }
  /**
   * 提取堆顶元素（删除并返回）
   *
   * @returns 堆顶元素，如果堆为空则返回 null
   *
   * 时间复杂度: O(log n)
   */
  extract() {
    if (this.heap.length === 0) {
      return null;
    }
    if (this.heap.length === 1) {
      const node = this.heap.pop();
      this.indexMap.delete(node.data);
      return node;
    }
    const min = this.heap[0];
    this.indexMap.delete(min.data);
    const last = this.heap.pop();
    this.heap[0] = last;
    this.indexMap.set(last.data, 0);
    this.bubbleDown(0);
    return min;
  }
  /**
   * 删除指定数据的节点
   *
   * @param data - 要删除的数据
   * @returns 是否成功删除
   *
   * 时间复杂度: O(log n)
   */
  remove(data) {
    const index = this.indexMap.get(data);
    if (index === void 0) {
      return false;
    }
    if (index === this.heap.length - 1) {
      this.heap.pop();
      this.indexMap.delete(data);
      return true;
    }
    const last = this.heap.pop();
    this.indexMap.delete(data);
    if (index < this.heap.length) {
      this.heap[index] = last;
      this.indexMap.set(last.data, index);
      this.bubbleUp(index);
      this.bubbleDown(index);
    }
    return true;
  }
  /**
   * 更新元素的优先级
   *
   * @param data - 要更新的数据
   * @param newPriority - 新优先级
   * @returns 是否成功更新
   *
   * 时间复杂度: O(log n)
   */
  updatePriority(data, newPriority) {
    const index = this.indexMap.get(data);
    if (index === void 0) {
      return false;
    }
    const oldPriority = this.heap[index].priority;
    this.heap[index].priority = newPriority;
    if (newPriority < oldPriority) {
      this.bubbleUp(index);
    } else if (newPriority > oldPriority) {
      this.bubbleDown(index);
    }
    return true;
  }
  /**
   * 检查是否包含指定数据
   *
   * @param data - 要检查的数据
   * @returns 是否包含
   *
   * 时间复杂度: O(1)
   */
  has(data) {
    return this.indexMap.has(data);
  }
  /**
   * 清空堆
   */
  clear() {
    this.heap = [];
    this.indexMap.clear();
  }
  /**
   * 获取所有元素（按堆顺序，非排序）
   *
   * @returns 所有节点的副本
   */
  toArray() {
    return [...this.heap];
  }
  /**
   * 获取所有元素（已排序）
   *
   * @returns 按优先级排序的节点数组
   *
   * 时间复杂度: O(n log n)
   */
  toSortedArray() {
    const sorted = [];
    const copy = new MinHeap();
    for (const node of this.heap) {
      copy.insert(node.priority, node.data);
    }
    while (!copy.isEmpty()) {
      const node = copy.extract();
      if (node) {
        sorted.push(node);
      }
    }
    return sorted;
  }
  /**
   * 向上冒泡（用于插入后调整）
   *
   * @param index - 起始索引
   */
  bubbleUp(index) {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.heap[index].priority >= this.heap[parentIndex].priority) {
        break;
      }
      this.swap(index, parentIndex);
      index = parentIndex;
    }
  }
  /**
   * 向下冒泡（用于删除后调整）
   *
   * @param index - 起始索引
   */
  bubbleDown(index) {
    const length = this.heap.length;
    while (true) {
      let smallest = index;
      const leftChild = 2 * index + 1;
      const rightChild = 2 * index + 2;
      if (leftChild < length && this.heap[leftChild].priority < this.heap[smallest].priority) {
        smallest = leftChild;
      }
      if (rightChild < length && this.heap[rightChild].priority < this.heap[smallest].priority) {
        smallest = rightChild;
      }
      if (smallest === index) {
        break;
      }
      this.swap(index, smallest);
      index = smallest;
    }
  }
  /**
   * 交换两个节点
   *
   * @param i - 索引 1
   * @param j - 索引 2
   */
  swap(i, j) {
    const temp = this.heap[i];
    this.heap[i] = this.heap[j];
    this.heap[j] = temp;
    this.indexMap.set(this.heap[i].data, i);
    this.indexMap.set(this.heap[j].data, j);
  }
  /**
   * 获取统计信息
   */
  getStats() {
    if (this.heap.length === 0) {
      return {
        size: 0,
        height: 0,
        minPriority: null,
        maxPriority: null
      };
    }
    const height = Math.ceil(Math.log2(this.heap.length + 1));
    const minPriority = this.heap[0].priority;
    let maxPriority = this.heap[0].priority;
    for (const node of this.heap) {
      if (node.priority > maxPriority) {
        maxPriority = node.priority;
      }
    }
    return {
      size: this.heap.length,
      height,
      minPriority,
      maxPriority
    };
  }
}
function createMinHeap() {
  return new MinHeap();
}
function createMinHeapFromArray(items) {
  const heap = new MinHeap();
  for (const item of items) {
    heap.insert(item.priority, item.data);
  }
  return heap;
}

export { MinHeap, createMinHeap, createMinHeapFromArray };
/*! End of @ldesign/cache | Powered by @ldesign/builder */
//# sourceMappingURL=min-heap.js.map
