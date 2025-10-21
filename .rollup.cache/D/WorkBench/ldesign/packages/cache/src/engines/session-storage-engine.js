import { BaseStorageEngine } from './base-engine';
/**
 * sessionStorage 存储引擎
 */
export class SessionStorageEngine extends BaseStorageEngine {
    constructor(config) {
        super();
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 'sessionStorage'
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
        this.maxSize = config?.maxSize || 5 * 1024 * 1024; // 默认 5MB
        this.keyPrefix = config?.keyPrefix || 'ldesign_cache_session_';
        // 初始化时计算已使用大小
        this.updateUsedSize().catch(console.error);
    }
    get available() {
        try {
            if (typeof window === 'undefined' || !window.sessionStorage) {
                return false;
            }
            // 测试是否可以写入
            const testKey = '__ldesign_cache_session_test__';
            window.sessionStorage.setItem(testKey, 'test');
            window.sessionStorage.removeItem(testKey);
            return true;
        }
        catch {
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
        return fullKey.startsWith(this.keyPrefix)
            ? fullKey.slice(this.keyPrefix.length)
            : fullKey;
    }
    /**
     * 设置缓存项
     */
    async setItem(key, value, ttl) {
        if (!this.available) {
            throw new Error('sessionStorage is not available');
        }
        const fullKey = this.getFullKey(key);
        const data = this.createTTLData(value, ttl);
        const dataSize = this.calculateSize(fullKey) + this.calculateSize(data);
        // 检查存储空间
        if (!this.checkStorageSpace(dataSize)) {
            // 尝试清理过期项
            await this.cleanup();
            // 再次检查
            if (!this.checkStorageSpace(dataSize)) {
                throw new Error('Insufficient storage space in sessionStorage');
            }
        }
        try {
            window.sessionStorage.setItem(fullKey, data);
            await this.updateUsedSize();
        }
        catch (error) {
            if (error instanceof DOMException
                && error.name === 'QuotaExceededError') {
                throw new Error('sessionStorage quota exceeded');
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
            const data = window.sessionStorage.getItem(fullKey);
            if (!data) {
                return null;
            }
            const { value, expired } = this.parseTTLData(data);
            if (expired) {
                await this.removeItem(key);
                return null;
            }
            return value;
        }
        catch (error) {
            console.warn('Error getting item from sessionStorage:', error);
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
        window.sessionStorage.removeItem(fullKey);
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
            window.sessionStorage.removeItem(fullKey);
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
        for (let i = 0; i < window.sessionStorage.length; i++) {
            const fullKey = window.sessionStorage.key(i);
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
//# sourceMappingURL=session-storage-engine.js.map