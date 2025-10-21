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

require('../utils/error-handler.cjs');
var eventEmitter = require('../utils/event-emitter.cjs');
require('../utils/object-pool.cjs');
require('../utils/performance-profiler.cjs');
require('../utils/serialization-cache.cjs');
require('../utils/validator.cjs');

class SyncManager {
  constructor(manager, options = {}) {
    Object.defineProperty(this, "manager", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: manager
    });
    Object.defineProperty(this, "options", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: options
    });
    Object.defineProperty(this, "channel", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "storageHandler", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "sourceId", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "emitter", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: new eventEmitter.EventEmitter()
    });
    Object.defineProperty(this, "syncTimer", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    this.sourceId = this.generateSourceId();
    if (options.enabled !== false) {
      this.initialize();
    }
  }
  /**
   * 生成唯一源ID
   */
  generateSourceId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  /**
   * 初始化同步
   */
  initialize() {
    if (this.supportsBroadcastChannel()) {
      this.initBroadcastChannel();
    } else if (this.supportsStorageEvent()) {
      this.initStorageEvent();
    }
    this.setupLocalListeners();
  }
  /**
   * 检查是否支持 BroadcastChannel
   */
  supportsBroadcastChannel() {
    return typeof BroadcastChannel !== "undefined";
  }
  /**
   * 检查是否支持 storage 事件
   */
  supportsStorageEvent() {
    return typeof window !== "undefined" && "storage" in window;
  }
  /**
   * 初始化 BroadcastChannel
   */
  initBroadcastChannel() {
    const channelName = this.options.channel || "ldesign-cache-sync";
    this.channel = new BroadcastChannel(channelName);
    this.channel.onmessage = (event) => {
      this.handleSyncMessage(event.data);
    };
  }
  /**
   * 初始化 storage 事件监听
   */
  initStorageEvent() {
    if (typeof window === "undefined") {
      return;
    }
    this.storageHandler = (e) => {
      if (!e.key?.startsWith("__sync__")) {
        return;
      }
      try {
        const message = JSON.parse(e.newValue || "{}");
        this.handleSyncMessage(message);
      } catch (error) {
        console.warn("Failed to parse sync message:", error);
      }
    };
    window.addEventListener("storage", this.storageHandler);
  }
  /**
   * 设置本地缓存事件监听
   */
  setupLocalListeners() {
    const events = this.options.events || ["set", "remove", "clear"];
    events.forEach((event) => {
      this.manager.on(event, (e) => {
        if (this.shouldSync(e.engine)) {
          this.broadcastMessage({
            type: event,
            key: e.key,
            value: e.value,
            timestamp: e.timestamp,
            source: this.sourceId
          });
        }
      });
    });
  }
  /**
   * 判断是否需要同步
   */
  shouldSync(engine) {
    if (!this.options.engines) {
      return engine === "localStorage" || engine === "sessionStorage";
    }
    return this.options.engines.includes(engine);
  }
  /**
   * 广播同步消息
   */
  broadcastMessage(message) {
    if (this.options.debounce) {
      if (this.syncTimer) {
        clearTimeout(this.syncTimer);
      }
      this.syncTimer = window.setTimeout(() => {
        this.sendMessage(message);
      }, this.options.debounce);
    } else {
      this.sendMessage(message);
    }
  }
  /**
   * 发送消息
   */
  sendMessage(message) {
    if (this.channel) {
      this.channel.postMessage(message);
    } else if (typeof window !== "undefined" && window.localStorage) {
      const key = `__sync__${Date.now()}`;
      try {
        window.localStorage.setItem(key, JSON.stringify(message));
        window.localStorage.removeItem(key);
      } catch (error) {
        console.warn("Failed to send sync message:", error);
      }
    }
    this.emitter.emit("sync", message);
  }
  /**
   * 处理同步消息
   */
  async handleSyncMessage(message) {
    if (message.source === this.sourceId) {
      return;
    }
    try {
      switch (message.type) {
        case "set":
          if (message.key && message.value !== void 0) {
            await this.manager.set(message.key, message.value, message.options);
          }
          break;
        case "remove":
          if (message.key) {
            await this.manager.remove(message.key);
          }
          break;
        case "clear":
          await this.manager.clear();
          break;
        case "sync":
          await this.handleSyncRequest();
          break;
        case "ping":
          this.sendMessage({
            type: "ping",
            timestamp: Date.now(),
            source: this.sourceId
          });
          break;
      }
    } catch (error) {
      console.error("Failed to handle sync message:", error);
    }
  }
  /**
   * 处理同步请求
   */
  async handleSyncRequest() {
    const keys = await this.manager.keys();
    for (const key of keys) {
      const value = await this.manager.get(key);
      if (value !== null) {
        this.broadcastMessage({
          type: "set",
          key,
          value,
          timestamp: Date.now(),
          source: this.sourceId
        });
      }
    }
  }
  /**
   * 请求全量同步
   */
  async requestSync() {
    this.sendMessage({
      type: "sync",
      timestamp: Date.now(),
      source: this.sourceId
    });
  }
  /**
   * 发送心跳
   */
  ping() {
    this.sendMessage({
      type: "ping",
      timestamp: Date.now(),
      source: this.sourceId
    });
  }
  /**
   * 监听同步事件
   */
  on(event, listener) {
    this.emitter.on(event, listener);
  }
  /**
   * 移除监听器
   */
  off(event, listener) {
    this.emitter.off(event, listener);
  }
  /**
   * 销毁同步管理器
   */
  destroy() {
    if (this.channel) {
      this.channel.close();
      this.channel = void 0;
    }
    if (this.storageHandler && typeof window !== "undefined") {
      window.removeEventListener("storage", this.storageHandler);
      this.storageHandler = void 0;
    }
    if (this.syncTimer) {
      clearTimeout(this.syncTimer);
      this.syncTimer = void 0;
    }
    this.emitter.removeAllListeners();
  }
}

exports.SyncManager = SyncManager;
/*! End of @ldesign/cache | Powered by @ldesign/builder */
//# sourceMappingURL=sync-manager.cjs.map
