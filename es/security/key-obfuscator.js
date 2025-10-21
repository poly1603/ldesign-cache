/*!
 * ***********************************
 * @ldesign/cache v0.1.1           *
 * Built with rollup               *
 * Build time: 2024-10-21 14:32:03 *
 * Build mode: production          *
 * Minified: No                    *
 * ***********************************
 */
class KeyObfuscator {
  constructor(config) {
    Object.defineProperty(this, "config", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "keyMap", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: /* @__PURE__ */ new Map()
    });
    Object.defineProperty(this, "reverseKeyMap", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: /* @__PURE__ */ new Map()
    });
    this.config = {
      enabled: config.enabled,
      prefix: config.prefix || "ld_",
      algorithm: config.algorithm || "hash",
      customObfuscate: config.customObfuscate,
      customDeobfuscate: config.customDeobfuscate
    };
  }
  /**
   * 检查混淆功能是否可用
   */
  isAvailable() {
    return true;
  }
  /**
   * 混淆键名
   */
  async obfuscate(key) {
    if (!this.config?.enabled) {
      return key;
    }
    if (this.keyMap.has(key)) {
      return this.keyMap.get(key);
    }
    let obfuscatedKey;
    if (this.config?.customObfuscate) {
      obfuscatedKey = this.config?.customObfuscate(key);
      const finalKey2 = obfuscatedKey;
      this.keyMap.set(key, finalKey2);
      this.reverseKeyMap.set(finalKey2, key);
      return finalKey2;
    } else {
      switch (this.config?.algorithm) {
        case "hash":
          obfuscatedKey = await this.hashObfuscate(key);
          break;
        case "base64":
          obfuscatedKey = this.base64Obfuscate(key);
          break;
        default:
          obfuscatedKey = await this.hashObfuscate(key);
      }
    }
    const finalKey = `${this.config?.prefix}${obfuscatedKey}`;
    this.keyMap.set(key, finalKey);
    this.reverseKeyMap.set(finalKey, key);
    return finalKey;
  }
  /**
   * 反混淆键名
   */
  async deobfuscate(obfuscatedKey) {
    if (!this.config?.enabled) {
      return obfuscatedKey;
    }
    if (this.reverseKeyMap.has(obfuscatedKey)) {
      return this.reverseKeyMap.get(obfuscatedKey);
    }
    const prefix = this.config?.prefix || "ld_";
    if (!obfuscatedKey.startsWith(prefix)) {
      return obfuscatedKey;
    }
    const keyWithoutPrefix = obfuscatedKey.slice(prefix.length);
    if (this.config?.customDeobfuscate) {
      const originalKey = this.config?.customDeobfuscate(keyWithoutPrefix);
      this.reverseKeyMap.set(obfuscatedKey, originalKey);
      this.keyMap.set(originalKey, obfuscatedKey);
      return originalKey;
    }
    return obfuscatedKey;
  }
  /**
   * 哈希混淆
   */
  async hashObfuscate(key) {
    if (typeof window !== "undefined" && window.crypto && window.crypto.subtle) {
      try {
        const encoder = new TextEncoder();
        const data = encoder.encode(key);
        const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
        const hashArray = new Uint8Array(hashBuffer);
        return Array.from(hashArray).map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 16);
      } catch (error) {
        console.warn("Web Crypto API hash failed, falling back to simple hash:", error);
      }
    }
    return this.simpleHash(key);
  }
  /**
   * Base64 混淆
   */
  base64Obfuscate(key) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(key);
      const binary = Array.from(data, (byte) => String.fromCharCode(byte)).join("");
      return btoa(binary).replace(/[+/=]/g, (match) => {
        switch (match) {
          case "+":
            return "-";
          case "/":
            return "_";
          case "=":
            return "";
          default:
            return match;
        }
      });
    } catch (error) {
      console.error("Base64 obfuscation failed:", error);
      return key;
    }
  }
  /**
   * 简单哈希算法（回退方案）
   */
  simpleHash(str) {
    let hash = 0;
    if (str.length === 0) {
      return hash.toString();
    }
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }
  /**
   * 清理缓存的映射关系
   */
  clearCache() {
    this.keyMap.clear();
    this.reverseKeyMap.clear();
  }
  /**
   * 获取映射统计
   */
  getStats() {
    return {
      totalMappings: this.keyMap.size,
      cacheHitRate: this.keyMap.size > 0 ? 1 : 0
      // 简化的命中率计算
    };
  }
  /**
   * 导出键映射（用于持久化）
   */
  exportKeyMappings() {
    const mappings = {};
    for (const [original, obfuscated] of this.keyMap) {
      mappings[original] = obfuscated;
    }
    return mappings;
  }
  /**
   * 导入键映射（用于恢复）
   */
  importKeyMappings(mappings) {
    this.keyMap.clear();
    this.reverseKeyMap.clear();
    for (const [original, obfuscated] of Object.entries(mappings)) {
      this.keyMap.set(original, obfuscated);
      this.reverseKeyMap.set(obfuscated, original);
    }
  }
  /**
   * 更新配置
   */
  updateConfig(config) {
    this.config = {
      ...this.config,
      ...config
    };
    if (config.algorithm && config.algorithm !== this.config?.algorithm) {
      this.clearCache();
    }
  }
  /**
   * 获取配置
   */
  getConfig() {
    return {
      ...this.config
    };
  }
}

export { KeyObfuscator };
/*! End of @ldesign/cache | Powered by @ldesign/builder */
//# sourceMappingURL=key-obfuscator.js.map
