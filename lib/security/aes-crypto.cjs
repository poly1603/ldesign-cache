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

class AESCrypto {
  constructor(config) {
    Object.defineProperty(this, "config", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "cryptoKey", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: null
    });
    this.config = {
      enabled: config.enabled,
      algorithm: config.algorithm || "AES",
      secretKey: config.secretKey || "ldesign-cache-default-key",
      customEncrypt: config.customEncrypt,
      customDecrypt: config.customDecrypt
    };
  }
  /**
   * 检查加密功能是否可用
   */
  isAvailable() {
    return typeof window !== "undefined" && "crypto" in window && "subtle" in window.crypto;
  }
  /**
   * 初始化加密密钥
   */
  async initializeKey() {
    if (this.cryptoKey || !this.isAvailable()) {
      return;
    }
    try {
      const keyData = new TextEncoder().encode(this.config?.secretKey);
      const hashBuffer = await window.crypto.subtle.digest("SHA-256", keyData);
      this.cryptoKey = await window.crypto.subtle.importKey("raw", hashBuffer, {
        name: "AES-GCM"
      }, false, ["encrypt", "decrypt"]);
    } catch (error) {
      console.error("Failed to initialize crypto key:", error);
      throw new Error("Failed to initialize encryption key");
    }
  }
  /**
   * 加密数据
   */
  async encrypt(data) {
    if (!this.config?.enabled) {
      return data;
    }
    if (this.config?.customEncrypt) {
      return this.config?.customEncrypt(data);
    }
    if (this.config?.algorithm === "AES") {
      return this.encryptAES(data);
    }
    return this.encodeBase64(data);
  }
  /**
   * 解密数据
   */
  async decrypt(data) {
    if (!this.config?.enabled) {
      return data;
    }
    if (this.config?.customDecrypt) {
      return this.config?.customDecrypt(data);
    }
    if (this.config?.algorithm === "AES") {
      return this.decryptAES(data);
    }
    return this.decodeBase64(data);
  }
  /**
   * AES-GCM 加密
   */
  async encryptAES(data) {
    if (!this.isAvailable()) {
      throw new Error("Web Crypto API is not available");
    }
    await this.initializeKey();
    if (!this.cryptoKey) {
      throw new Error("Crypto key is not initialized");
    }
    try {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const encryptedBuffer = await window.crypto.subtle.encrypt({
        name: "AES-GCM",
        iv
      }, this.cryptoKey, dataBuffer);
      const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encryptedBuffer), iv.length);
      return this.arrayBufferToBase64(combined.buffer);
    } catch (error) {
      console.error("AES encryption failed:", error);
      throw new Error("AES encryption failed");
    }
  }
  /**
   * AES-GCM 解密
   *
   * @param data - 需要解密的Base64编码数据
   * @returns 解密后的原始字符串
   * @throws {Error} 当数据格式无效或解密失败时抛出错误
   */
  async decryptAES(data) {
    if (!this.isAvailable()) {
      throw new Error("Web Crypto API is not available");
    }
    await this.initializeKey();
    if (!this.cryptoKey) {
      throw new Error("Crypto key is not initialized");
    }
    try {
      if (!data || typeof data !== "string") {
        throw new Error("Invalid encrypted data format");
      }
      const combined = new Uint8Array(this.base64ToArrayBuffer(data));
      if (combined.length < 13) {
        throw new Error("Encrypted data is too small - minimum 13 bytes required (12 bytes IV + 1 byte data)");
      }
      const iv = combined.slice(0, 12);
      const encryptedData = combined.slice(12);
      if (encryptedData.length === 0) {
        throw new Error("No encrypted data found after IV");
      }
      const decryptedBuffer = await window.crypto.subtle.decrypt({
        name: "AES-GCM",
        iv
      }, this.cryptoKey, encryptedData);
      const decoder = new TextDecoder();
      return decoder.decode(decryptedBuffer);
    } catch (error) {
      console.error("AES decryption failed:", error);
      if (error instanceof Error) {
        if (error.message.includes("too small")) {
          throw new Error(`AES decryption failed: ${error.message}`);
        }
        if (error.name === "OperationError") {
          throw new Error("AES decryption failed: Invalid encrypted data or wrong key");
        }
      }
      throw new Error(`AES decryption failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
  /**
   * Base64 编码 - 使用更安全的方法
   */
  encodeBase64(data) {
    try {
      const encoder = new TextEncoder();
      const bytes = encoder.encode(data);
      let binary = "";
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
    } catch (error) {
      console.error("Base64 encoding failed:", error);
      try {
        return btoa(unescape(encodeURIComponent(data)));
      } catch (fallbackError) {
        console.error("Fallback Base64 encoding failed:", fallbackError);
        return data;
      }
    }
  }
  /**
   * Base64 解码 - 使用更安全的方法
   */
  decodeBase64(data) {
    try {
      const binary = atob(data);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const decoder = new TextDecoder();
      return decoder.decode(bytes);
    } catch (error) {
      console.error("Base64 decoding failed:", error);
      try {
        return decodeURIComponent(escape(atob(data)));
      } catch (fallbackError) {
        console.error("Fallback Base64 decoding failed:", fallbackError);
        return data;
      }
    }
  }
  /**
   * ArrayBuffer 转 Base64
   */
  arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
  /**
   * Base64 转 ArrayBuffer
   */
  base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
  /**
   * 更新加密配置
   */
  updateConfig(config) {
    this.config = {
      ...this.config,
      ...config
    };
    this.cryptoKey = null;
  }
  /**
   * 获取加密配置
   */
  getConfig() {
    return {
      ...this.config
    };
  }
}

exports.AESCrypto = AESCrypto;
/*! End of @ldesign/cache | Powered by @ldesign/builder */
//# sourceMappingURL=aes-crypto.cjs.map
