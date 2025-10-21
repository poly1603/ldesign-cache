import { BaseStorageEngine } from './base-engine';
/**
 * IndexedDB 存储引擎
 */
export class IndexedDBEngine extends BaseStorageEngine {
    constructor(config) {
        super();
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 'indexedDB'
        });
        Object.defineProperty(this, "maxSize", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 50 * 1024 * 1024
        }); // 默认 50MB
        Object.defineProperty(this, "db", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "dbName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "version", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "storeName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.dbName = config?.dbName || 'ldesign_cache_db';
        this.version = config?.version || 1;
        this.storeName = config?.storeName || 'cache_store';
    }
    /**
     * 创建 IndexedDB 引擎实例
     */
    static async create(config) {
        const engine = new IndexedDBEngine(config);
        await engine.initialize();
        return engine;
    }
    get available() {
        return (typeof window !== 'undefined'
            && 'indexedDB' in window
            && window.indexedDB !== null
            && this.db !== null);
    }
    /**
     * 初始化数据库
     */
    async initialize() {
        if (typeof window === 'undefined' || !window.indexedDB) {
            return;
        }
        return new Promise((resolve, reject) => {
            const request = window.indexedDB.open(this.dbName, this.version);
            request.onerror = () => {
                reject(new Error(`Failed to open IndexedDB: ${request.error}`));
            };
            request.onsuccess = () => {
                this.db = request.result;
                this.updateUsedSize()
                    .then(() => resolve())
                    .catch(console.error);
            };
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                // 创建对象存储
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const store = db.createObjectStore(this.storeName, { keyPath: 'key' });
                    store.createIndex('expiresAt', 'expiresAt', { unique: false });
                    store.createIndex('createdAt', 'createdAt', { unique: false });
                }
            };
        });
    }
    /**
     * 获取事务
     */
    getTransaction(mode = 'readonly') {
        if (!this.db) {
            throw new Error('IndexedDB is not initialized');
        }
        return this.db.transaction([this.storeName], mode);
    }
    /**
     * 获取对象存储
     */
    getStore(mode = 'readonly') {
        const transaction = this.getTransaction(mode);
        return transaction.objectStore(this.storeName);
    }
    /**
     * 执行 IndexedDB 请求
     */
    async executeRequest(request) {
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    /**
     * 设置缓存项
     */
    async setItem(key, value, ttl) {
        if (!this.available) {
            throw new Error('IndexedDB is not available');
        }
        const store = this.getStore('readwrite');
        const now = Date.now();
        const item = {
            key,
            value,
            createdAt: now,
            expiresAt: ttl ? now + ttl : undefined,
        };
        await this.executeRequest(store.put(item));
        await this.updateUsedSize();
    }
    /**
     * 获取缓存项
     */
    async getItem(key) {
        if (!this.available) {
            return null;
        }
        try {
            const store = this.getStore('readonly');
            const item = await this.executeRequest(store.get(key));
            if (!item) {
                return null;
            }
            // 检查是否过期
            if (item.expiresAt && Date.now() > item.expiresAt) {
                await this.removeItem(key);
                return null;
            }
            return item.value;
        }
        catch (error) {
            console.warn('Error getting item from IndexedDB:', error);
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
            const store = this.getStore('readwrite');
            await this.executeRequest(store.delete(key));
            await this.updateUsedSize();
        }
        catch (error) {
            console.warn('Error removing item from IndexedDB:', error);
        }
    }
    /**
     * 清空所有缓存项
     */
    async clear() {
        if (!this.available) {
            return;
        }
        try {
            const store = this.getStore('readwrite');
            await this.executeRequest(store.clear());
            this._usedSize = 0;
        }
        catch (error) {
            console.warn('Error clearing IndexedDB:', error);
        }
    }
    /**
     * 获取所有键名
     */
    async keys() {
        if (!this.available) {
            return [];
        }
        try {
            const store = this.getStore('readonly');
            const keys = await this.executeRequest(store.getAllKeys());
            return keys.map(key => String(key));
        }
        catch (error) {
            console.warn('Error getting keys from IndexedDB:', error);
            return [];
        }
    }
    /**
     * 获取缓存项数量
     */
    async length() {
        if (!this.available) {
            return 0;
        }
        try {
            const store = this.getStore('readonly');
            return await this.executeRequest(store.count());
        }
        catch (error) {
            console.warn('Error getting count from IndexedDB:', error);
            return 0;
        }
    }
    /**
     * 清理过期项
     */
    async cleanup() {
        if (!this.available) {
            return;
        }
        try {
            const store = this.getStore('readwrite');
            const index = store.index('expiresAt');
            const now = Date.now();
            // 获取所有过期项
            const range = IDBKeyRange.upperBound(now);
            const cursor = await this.executeRequest(index.openCursor(range));
            const deletePromises = [];
            if (cursor) {
                ;
                cursor.onsuccess = (event) => {
                    const cursor = event.target.result;
                    if (cursor) {
                        deletePromises.push(this.executeRequest(store.delete(cursor.primaryKey)));
                        cursor.continue();
                    }
                };
            }
            await Promise.all(deletePromises);
            await this.updateUsedSize();
        }
        catch (error) {
            console.warn('Error cleaning up IndexedDB:', error);
        }
    }
    /**
     * 获取数据库大小估算
     */
    async getDatabaseSize() {
        if (!this.available) {
            return 0;
        }
        try {
            const store = this.getStore('readonly');
            const items = await this.executeRequest(store.getAll());
            let totalSize = 0;
            for (const item of items) {
                const itemSize = this.calculateSize(JSON.stringify(item));
                totalSize += itemSize;
            }
            return totalSize;
        }
        catch (error) {
            console.warn('Error calculating IndexedDB size:', error);
            return 0;
        }
    }
    /**
     * 更新使用大小
     */
    async updateUsedSize() {
        this._usedSize = await this.getDatabaseSize();
    }
}
//# sourceMappingURL=indexeddb-engine.js.map