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

class CookieEngine extends baseEngine.BaseStorageEngine {
  constructor(config) {
    super();
    Object.defineProperty(this, "name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "cookie"
    });
    Object.defineProperty(this, "maxSize", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: 4 * 1024
    });
    Object.defineProperty(this, "domain", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "path", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "secure", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "sameSite", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "httpOnly", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    this.domain = config?.domain;
    this.path = config?.path || "/";
    this.secure = config?.secure || false;
    this.sameSite = config?.sameSite || "lax";
    this.httpOnly = config?.httpOnly || false;
    this.updateUsedSize().catch(console.error);
  }
  get available() {
    try {
      if (typeof document === "undefined") {
        return false;
      }
      const testKey = "__ldesign_cache_cookie_test__";
      document.cookie = `${testKey}=test; path=${this.path}`;
      const canRead = document.cookie.includes(`${testKey}=test`);
      document.cookie = `${testKey}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${this.path}`;
      return canRead;
    } catch {
      return false;
    }
  }
  /**
   * 设置缓存项
   */
  async setItem(key, value, ttl) {
    if (!this.available) {
      throw new Error("Cookie storage is not available");
    }
    const dataSize = this.calculateSize(key) + this.calculateSize(value);
    if (dataSize > this.maxSize) {
      throw new Error(`Cookie data too large: ${dataSize} bytes (max: ${this.maxSize} bytes)`);
    }
    let cookieString = `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
    if (ttl) {
      const expiresDate = new Date(Date.now() + ttl);
      cookieString += `; expires=${expiresDate.toUTCString()}`;
    }
    cookieString += `; path=${this.path}`;
    if (this.domain) {
      cookieString += `; domain=${this.domain}`;
    }
    if (this.secure) {
      cookieString += "; secure";
    }
    if (this.httpOnly) {
      cookieString += "; httpOnly";
    }
    cookieString += `; samesite=${this.sameSite}`;
    try {
      document.cookie = cookieString;
      await this.updateUsedSize();
    } catch (error) {
      throw new Error(`Failed to set cookie: ${error}`);
    }
  }
  /**
   * 获取缓存项
   */
  async getItem(key) {
    if (!this.available) {
      return null;
    }
    try {
      const cookies = document.cookie.split(";");
      const encodedKey = encodeURIComponent(key);
      for (const cookie of cookies) {
        const [cookieKey, cookieValue] = cookie.trim().split("=");
        if (cookieKey === encodedKey && cookieValue) {
          return decodeURIComponent(cookieValue);
        }
      }
      return null;
    } catch (error) {
      console.warn("Error getting cookie:", error);
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
    try {
      let cookieString = `${encodeURIComponent(key)}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${this.path}`;
      if (this.domain) {
        cookieString += `; domain=${this.domain}`;
      }
      document.cookie = cookieString;
      await this.updateUsedSize();
    } catch (error) {
      console.warn("Error removing cookie:", error);
    }
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
      await this.removeItem(key);
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
    try {
      const cookies = document.cookie.split(";");
      const keys = [];
      for (const cookie of cookies) {
        const [cookieKey] = cookie.trim().split("=");
        if (cookieKey) {
          try {
            keys.push(decodeURIComponent(cookieKey));
          } catch {
          }
        }
      }
      return keys;
    } catch (error) {
      console.warn("Error getting cookie keys:", error);
      return [];
    }
  }
  /**
   * 获取缓存项数量
   */
  async length() {
    const keys = await this.keys();
    return keys.length;
  }
  /**
   * 清理过期项（Cookie 会自动过期，这里主要是更新统计）
   */
  async cleanup() {
    await this.updateUsedSize();
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

exports.CookieEngine = CookieEngine;
/*! End of @ldesign/cache | Powered by @ldesign/builder */
//# sourceMappingURL=cookie-engine.cjs.map
