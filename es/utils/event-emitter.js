/*!
 * ***********************************
 * @ldesign/cache v0.1.1           *
 * Built with rollup               *
 * Build time: 2024-10-21 14:32:03 *
 * Build mode: production          *
 * Minified: No                    *
 * ***********************************
 */
class EventEmitter {
  constructor() {
    Object.defineProperty(this, "listeners", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: /* @__PURE__ */ new Map()
    });
  }
  /**
   * 添加事件监听器
   *
   * @param event - 事件名称
   * @param listener - 事件监听器函数
   *
   * @example
   * ```typescript
   * emitter.on('data', (event) => )
   * ```
   */
  on(event, listener) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, /* @__PURE__ */ new Set());
    }
    this.listeners.get(event).add(listener);
  }
  /**
   * 移除事件监听器
   *
   * @param event - 事件名称
   * @param listener - 要移除的事件监听器函数
   *
   * @example
   * ```typescript
   * const handler = (event) =>
   * emitter.on('data', handler)
   * emitter.off('data', handler) // 移除特定监听器
   * ```
   */
  off(event, listener) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(listener);
      if (eventListeners.size === 0) {
        this.listeners.delete(event);
      }
    }
  }
  /**
   * 添加一次性事件监听器
   *
   * 监听器在第一次触发后会自动移除
   *
   * @param event - 事件名称
   * @param listener - 事件监听器函数
   *
   * @example
   * ```typescript
   * emitter.once('init', (event) => {
   *
   *   // 这个监听器只会执行一次
   * })
   * ```
   */
  once(event, listener) {
    const onceListener = (eventData) => {
      listener(eventData);
      this.off(event, onceListener);
    };
    this.on(event, onceListener);
  }
  /**
   * 触发事件
   *
   * 向所有注册的监听器发送事件数据
   *
   * @param event - 事件名称
   * @param data - 事件数据
   *
   * @example
   * ```typescript
   * emitter.emit('data', { message: 'Hello World' })
   * ```
   */
  emit(event, data) {
    const eventListeners = this.listeners.get(event);
    if (!eventListeners || eventListeners.size === 0) {
      return;
    }
    const listenersArray = Array.from(eventListeners);
    for (let i = 0; i < listenersArray.length; i++) {
      try {
        listenersArray[i](data);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error instanceof Error ? error.message : "Unknown error");
      }
    }
  }
  /**
   * 移除所有监听器
   *
   * @param event - 可选的事件名称，如果提供则只移除该事件的监听器，否则移除所有监听器
   *
   * @example
   * ```typescript
   * // 移除特定事件的所有监听器
   * emitter.removeAllListeners('data')
   *
   * // 移除所有事件的所有监听器
   * emitter.removeAllListeners()
   * ```
   */
  removeAllListeners(event) {
    if (event !== void 0) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }
  /**
   * 获取指定事件的监听器数量
   *
   * @param event - 事件名称
   * @returns 监听器数量
   *
   * @example
   * ```typescript
   * const count = emitter.listenerCount('data')
   *
   * ```
   */
  listenerCount(event) {
    const eventListeners = this.listeners.get(event);
    return eventListeners ? eventListeners.size : 0;
  }
  /**
   * 获取所有已注册的事件名称
   *
   * @returns 事件名称数组
   *
   * @example
   * ```typescript
   * const events = emitter.eventNames()
   *
   * ```
   */
  eventNames() {
    return Array.from(this.listeners.keys());
  }
  /**
   * 检查是否有监听器
   *
   * @param event - 可选的事件名称，如果提供则检查该事件是否有监听器，否则检查是否有任何监听器
   * @returns 是否有监听器
   *
   * @example
   * ```typescript
   * // 检查特定事件是否有监听器
   * if (emitter.hasListeners('data')) {
   *
   * }
   *
   * // 检查是否有任何监听器
   * if (emitter.hasListeners()) {
   *
   * }
   * ```
   */
  hasListeners(event) {
    if (event !== void 0) {
      return this.listeners.has(event) && this.listeners.get(event).size > 0;
    }
    return this.listeners.size > 0;
  }
  /**
   * 获取指定事件的所有监听器
   *
   * @param event - 事件名称
   * @returns 监听器数组的只读副本
   *
   * @example
   * ```typescript
   * const listeners = emitter.getListeners('data')
   *
   * ```
   */
  getListeners(event) {
    const eventListeners = this.listeners.get(event);
    return eventListeners ? Array.from(eventListeners) : [];
  }
  /**
   * 获取事件发射器的统计信息
   *
   * @returns 统计信息对象
   *
   * @example
   * ```typescript
   * const stats = emitter.getStats()
   *
   * ```
   */
  getStats() {
    const events = {};
    let totalListeners = 0;
    for (const [eventName, listeners] of this.listeners) {
      const count = listeners.size;
      events[eventName] = count;
      totalListeners += count;
    }
    return {
      eventCount: this.listeners.size,
      listenerCount: totalListeners,
      events
    };
  }
}

export { EventEmitter };
/*! End of @ldesign/cache | Powered by @ldesign/builder */
//# sourceMappingURL=event-emitter.js.map
