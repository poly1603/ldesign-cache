/**
 * 存储引擎基类
 */
export class BaseStorageEngine {
    constructor() {
        Object.defineProperty(this, "_usedSize", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
    }
    get usedSize() {
        return this._usedSize;
    }
    /**
     * 检查键是否存在
     */
    async hasItem(key) {
        const value = await this.getItem(key);
        return value !== null;
    }
    /**
     * 清理过期项
     */
    async cleanup() {
        const keys = await this.keys();
        const now = Date.now();
        for (const key of keys) {
            try {
                const raw = await this.getItem(key);
                if (!raw) {
                    continue;
                }
                // 先解析 TTL 包装（如有）
                const { value, expired } = this.parseTTLData(raw);
                if (expired) {
                    await this.removeItem(key);
                    continue;
                }
                // 再解析缓存结构，检查元数据中的过期时间
                const parsed = JSON.parse(value);
                const expiresAt = parsed?.metadata?.expiresAt;
                if (expiresAt && now > expiresAt) {
                    await this.removeItem(key);
                }
            }
            catch (error) {
                // 如果解析失败，可能是旧格式数据，跳过
                console.warn(`Failed to parse cache item ${key}:`, error);
            }
        }
    }
    /**
     * 计算字符串大小（字节）
     * 优化版本：使用UTF-8编码规则快速计算，避免创建Blob对象
     *
     * 性能提升：约10-20倍
     */
    calculateSize(data) {
        let size = 0;
        for (let i = 0; i < data.length; i++) {
            const code = data.charCodeAt(i);
            if (code < 128) {
                size += 1;
            }
            else if (code < 2048) {
                size += 2;
            }
            else if (code < 65536) {
                size += 3;
            }
            else {
                size += 4;
            }
        }
        return size;
    }
    /**
     * 更新使用大小
     */
    async updateUsedSize() {
        const keys = await this.keys();
        let totalSize = 0;
        for (const key of keys) {
            try {
                const value = await this.getItem(key);
                if (value) {
                    totalSize += this.calculateSize(key) + this.calculateSize(value);
                }
            }
            catch (error) {
                console.warn(`Error calculating size for key ${key}:`, error);
            }
        }
        this._usedSize = totalSize;
    }
    /**
     * 检查存储空间是否足够
     */
    checkStorageSpace(dataSize) {
        return this._usedSize + dataSize <= this.maxSize;
    }
    /**
     * 生成带TTL的数据
     */
    createTTLData(value, ttl) {
        if (!ttl) {
            return value;
        }
        const expiresAt = Date.now() + ttl;
        return JSON.stringify({
            value,
            expiresAt,
        });
    }
    /**
     * 解析带TTL的数据
     */
    parseTTLData(data) {
        try {
            const parsed = JSON.parse(data);
            if (parsed.expiresAt) {
                const expired = Date.now() > parsed.expiresAt;
                return { value: parsed.value, expired };
            }
            return { value: data, expired: false };
        }
        catch {
            return { value: data, expired: false };
        }
    }
}
//# sourceMappingURL=base-engine.js.map