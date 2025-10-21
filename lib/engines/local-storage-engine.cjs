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

var baseEngine = require('./base-engine.cjs');

class LocalStorageEngine extends baseEngine.BaseStorageEngine {
  constructor(config) {
    super();
    Object.defineProperty(this, "name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "localStorage"
    });
    Object.defineProperty(this, "maxSize", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "keyPrefix", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    this.maxSize = config?.maxSize || 5 * 1024 * 1024;
    this.keyPrefix = config?.keyPrefix || "ldesign_cache_";
    if (this.available) {
      this.updateUsedSize().catch(console.error);
    }
  }
  get available() {
    try {
      if (typeof window === "undefined" || !window.localStorage) {
        return false;
      }
      const testKey = "__ldesign_cache_test__";
      window.localStorage.setItem(testKey, "test");
      window.localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }
  /**
   * 生成完整键名
   */
  getFullKey(key) {
    return `${this.keyPrefix}${key}`;
  }
  /**
   * 从完整键名提取原始键名
   */
  extractKey(fullKey) {
    return fullKey.startsWith(this.keyPrefix) ? fullKey.slice(this.keyPrefix.length) : fullKey;
  }
  /**
   * 设置缓存项
   */
  async setItem(key, value, ttl) {
    if (!this.available) {
      throw new Error("localStorage is not available");
    }
    const fullKey = this.getFullKey(key);
    const data = this.createTTLData(value, ttl);
    const dataSize = this.calculateSize(fullKey) + this.calculateSize(data);
    if (!this.checkStorageSpace(dataSize)) {
      await this.cleanup();
      if (!this.checkStorageSpace(dataSize)) {
        throw new Error("Insufficient storage space in localStorage");
      }
    }
    try {
      window.localStorage.setItem(fullKey, data);
      await this.updateUsedSize();
    } catch (error) {
      if (error instanceof DOMException && error.name === "QuotaExceededError") {
        throw new Error("localStorage quota exceeded");
      }
      throw error;
    }
  }
  /**
   * 获取缓存项
   */
  async getItem(key) {
    if (!this.available) {
      return null;
    }
    const fullKey = this.getFullKey(key);
    try {
      const data = window.localStorage.getItem(fullKey);
      if (!data) {
        return null;
      }
      const {
        value,
        expired
      } = this.parseTTLData(data);
      if (expired) {
        await this.removeItem(key);
        return null;
      }
      return value;
    } catch (error) {
      console.warn("Error getting item from localStorage:", error);
      return null;
    }
  }
  /**
   * 删除缓存项
   */
  async removeItem(key) {
    if (!this.available) {
      return;
    }
    const fullKey = this.getFullKey(key);
    window.localStorage.removeItem(fullKey);
    await this.updateUsedSize();
  }
  /**
   * 清空所有缓存项
   */
  async clear() {
    if (!this.available) {
      return;
    }
    const keys = await this.keys();
    for (const key of keys) {
      const fullKey = this.getFullKey(key);
      window.localStorage.removeItem(fullKey);
    }
    this._usedSize = 0;
  }
  /**
   * 获取所有键名
   */
  async keys() {
    if (!this.available) {
      return [];
    }
    const keys = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const fullKey = window.localStorage.key(i);
      if (fullKey && fullKey.startsWith(this.keyPrefix)) {
        keys.push(this.extractKey(fullKey));
      }
    }
    return keys;
  }
  /**
   * 获取缓存项数量
   */
  async length() {
    const keys = await this.keys();
    return keys.length;
  }
  /**
   * 获取剩余存储空间
   */
  getRemainingSpace() {
    return Math.max(0, this.maxSize - this._usedSize);
  }
  /**
   * 获取存储使用率
   */
  getUsageRatio() {
    return this._usedSize / this.maxSize;
  }
}

exports.LocalStorageEngine = LocalStorageEngine;
/*! End of @ldesign/cache | Powered by @ldesign/builder */
//# sourceMappingURL=local-storage-engine.cjs.map
