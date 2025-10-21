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

var aesCrypto = require('./aes-crypto.cjs');
var keyObfuscator = require('./key-obfuscator.cjs');

class SecurityManager {
  constructor(config) {
    Object.defineProperty(this, "encryption", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "obfuscation", {
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
    this.config = {
      encryption: {
        enabled: false,
        algorithm: "AES",
        secretKey: "ldesign-cache-default-key",
        ...config?.encryption
      },
      obfuscation: {
        enabled: false,
        prefix: "ld_",
        algorithm: "hash",
        ...config?.obfuscation
      }
    };
    this.encryption = new aesCrypto.AESCrypto(this.config?.encryption);
    this.obfuscation = new keyObfuscator.KeyObfuscator(this.config?.obfuscation);
  }
  /**
   * 加密数据
   */
  async encrypt(data) {
    if (!this.config?.encryption.enabled) {
      return data;
    }
    try {
      return await this.encryption.encrypt(data);
    } catch (error) {
      console.error("Encryption failed:", error);
      throw new Error("Failed to encrypt data");
    }
  }
  /**
   * 解密数据
   */
  async decrypt(data) {
    if (!this.config?.encryption.enabled) {
      return data;
    }
    try {
      return await this.encryption.decrypt(data);
    } catch (error) {
      console.error("Decryption failed:", error);
      throw new Error("Failed to decrypt data");
    }
  }
  /**
   * 混淆键名
   */
  async obfuscateKey(key) {
    if (!this.config?.obfuscation.enabled) {
      return key;
    }
    try {
      return await this.obfuscation.obfuscate(key);
    } catch (error) {
      console.error("Key obfuscation failed:", error);
      throw new Error("Failed to obfuscate key");
    }
  }
  /**
   * 反混淆键名
   */
  async deobfuscateKey(key) {
    if (!this.config?.obfuscation.enabled) {
      return key;
    }
    try {
      return await this.obfuscation.deobfuscate(key);
    } catch (error) {
      console.error("Key deobfuscation failed:", error);
      throw new Error("Failed to deobfuscate key");
    }
  }
  /**
   * 检查数据是否需要加密
   */
  shouldEncrypt(data, options) {
    if (options?.encrypt !== void 0) {
      return options.encrypt;
    }
    return this.config?.encryption.enabled;
  }
  /**
   * 检查键名是否需要混淆
   */
  shouldObfuscateKey(options) {
    if (options?.obfuscateKey !== void 0) {
      return options.obfuscateKey;
    }
    return this.config?.obfuscation.enabled;
  }
  /**
   * 生成安全的随机键
   */
  generateSecureKey(length = 32) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    if (typeof window !== "undefined" && window.crypto && window.crypto.getRandomValues) {
      const array = new Uint8Array(length);
      window.crypto.getRandomValues(array);
      for (let i = 0; i < length; i++) {
        result += chars[array[i] % chars.length];
      }
    } else {
      for (let i = 0; i < length; i++) {
        result += chars[Math.floor(Math.random() * chars.length)];
      }
    }
    return result;
  }
  /**
   * 验证数据完整性
   *
   * 通过比较原始数据和存储数据来验证数据完整性
   * 如果启用了加密，会先解密存储数据再进行比较
   *
   * @param originalData - 原始数据
   * @param storedData - 存储的数据（可能已加密）
   * @returns 数据完整性验证结果
   *
   * @example
   * ```typescript
   * const isValid = await securityManager.verifyIntegrity('original', 'stored')
   *  // true 或 false
   * ```
   */
  async verifyIntegrity(originalData, storedData) {
    try {
      if (typeof originalData !== "string" || typeof storedData !== "string") {
        console.warn("Invalid data types for integrity verification");
        return false;
      }
      if (!originalData && !storedData) {
        return true;
      }
      if (!originalData || !storedData) {
        return false;
      }
      if (this.config?.encryption.enabled) {
        try {
          const decrypted = await this.decrypt(storedData);
          return decrypted === originalData;
        } catch (error) {
          console.warn("Decryption failed during integrity verification:", error instanceof Error ? error.message : "Unknown error");
          return false;
        }
      }
      return storedData === originalData;
    } catch (error) {
      console.error("Integrity verification failed:", error instanceof Error ? error.message : "Unknown error");
      return false;
    }
  }
  /**
   * 获取安全配置
   */
  getConfig() {
    return {
      ...this.config
    };
  }
  /**
   * 更新安全配置
   */
  updateConfig(config) {
    this.config = {
      ...this.config,
      ...config,
      encryption: {
        ...this.config?.encryption,
        ...config.encryption
      },
      obfuscation: {
        ...this.config?.obfuscation,
        ...config.obfuscation
      }
    };
    this.encryption = new aesCrypto.AESCrypto(this.config?.encryption);
    this.obfuscation = new keyObfuscator.KeyObfuscator(this.config?.obfuscation);
  }
  /**
   * 检查安全功能是否可用
   */
  isSecurityAvailable() {
    return {
      encryption: this.encryption.isAvailable(),
      obfuscation: this.obfuscation.isAvailable(),
      webCrypto: typeof window !== "undefined" && "crypto" in window && "subtle" in window.crypto
    };
  }
}

exports.SecurityManager = SecurityManager;
/*! End of @ldesign/cache | Powered by @ldesign/builder */
//# sourceMappingURL=security-manager.cjs.map
