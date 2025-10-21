/*!
 * ***********************************
 * @ldesign/cache v0.1.1           *
 * Built with rollup               *
 * Build time: 2024-10-21 14:32:03 *
 * Build mode: production          *
 * Minified: No                    *
 * ***********************************
 */
'use strict';

var performance = require('../constants/performance.cjs');

class ThrottledEventEmitter {
  /**
   * 构造函数
   */
  constructor(config = {}) {
    Object.defineProperty(this, "listeners", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "batchListeners", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "queues", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "timers", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "config", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    this.listeners = /* @__PURE__ */ new Map();
    this.batchListeners = /* @__PURE__ */ new Map();
    this.queues = /* @__PURE__ */ new Map();
    this.timers = /* @__PURE__ */ new Map();
    this.config = {
      batchSize: config.batchSize ?? performance.BATCH_CONFIG.DEFAULT_SIZE,
      flushInterval: config.flushInterval ?? performance.TIME_INTERVALS.EVENT_FLUSH_DEFAULT,
      enabled: config.enabled ?? true
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
      this.listeners.set(event, /* @__PURE__ */ new Set());
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
      this.batchListeners.set(event, /* @__PURE__ */ new Set());
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
    } else {
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
    } else {
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
      this.triggerListeners(event, data);
      return;
    }
    if (!this.queues.has(event)) {
      this.queues.set(event, []);
    }
    this.queues.get(event).push(data);
    if (this.queues.get(event).length >= this.config?.batchSize) {
      this.flush(event);
    } else {
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
    const timer = this.timers.get(event);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(event);
    }
    const batch = {
      events: [...queue],
      timestamp: Date.now(),
      size: queue.length
    };
    queue.length = 0;
    this.triggerBatchListeners(event, batch);
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
          result.catch((error) => {
            console.error(`Error in event handler for "${event}":`, error);
          });
        }
      } catch (error) {
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
          result.catch((error) => {
            console.error(`Error in batch event handler for "${event}":`, error);
          });
        }
      } catch (error) {
        console.error(`Error in batch event handler for "${event}":`, error);
      }
    }
  }
  /**
   * 清理所有监听器和队列
   */
  clear() {
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
      activeTimers: this.timers.size
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
    return {
      ...this.config
    };
  }
  /**
   * 销毁
   */
  destroy() {
    this.flushAll();
    this.clear();
  }
}
function createThrottledEmitter(config) {
  return new ThrottledEventEmitter(config);
}
function throttle(fn, options = {}) {
  const queue = [];
  let timer = null;
  const batchSize = options.batchSize ?? performance.BATCH_CONFIG.DEFAULT_SIZE;
  const flushInterval = options.flushInterval ?? performance.TIME_INTERVALS.EVENT_FLUSH_DEFAULT;
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
        result.catch((error) => {
          console.error("Error in throttled function:", error);
        });
      }
    } catch (error) {
      console.error("Error in throttled function:", error);
    }
  };
  return (item) => {
    queue.push(item);
    if (queue.length >= batchSize) {
      flush();
    } else if (!timer) {
      timer = setTimeout(flush, flushInterval);
    }
  };
}
function debounce(fn, delay) {
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

exports.ThrottledEventEmitter = ThrottledEventEmitter;
exports.createThrottledEmitter = createThrottledEmitter;
exports.debounce = debounce;
exports.throttle = throttle;
/*! End of @ldesign/cache | Powered by @ldesign/builder */
//# sourceMappingURL=event-throttle.cjs.map
