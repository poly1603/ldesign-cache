/**
 * 缓存标签管理器
 *
 * 支持为缓存项添加标签，并按标签批量操作
 *
 * @example
 * ```typescript
 * const tagManager = new TagManager(cache)
 *
 * // 设置带标签的缓存
 * await tagManager.set('user:1', userData, { tags: ['user', 'active'] })
 * await tagManager.set('user:2', userData2, { tags: ['user', 'inactive'] })
 *
 * // 按标签获取所有键
 * const userKeys = await tagManager.getKeysByTag('user')
 *
 * // 按标签清除缓存
 * await tagManager.clearByTag('inactive')
 *
 * // 按多个标签查询（交集）
 * const activeUsers = await tagManager.getKeysByTags(['user', 'active'])
 * ```
 */
export class TagManager {
    constructor(cache, config = {}) {
        Object.defineProperty(this, "cache", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: cache
        });
        Object.defineProperty(this, "tagPrefix", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "autoCleanup", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "TAG_INDEX_KEY", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: '__tag_index__'
        });
        this.tagPrefix = config.tagPrefix || '__tag__';
        this.autoCleanup = config.autoCleanup ?? true;
    }
    /**
     * 设置带标签的缓存项
     */
    async set(key, value, options) {
        const { tags, ...cacheOptions } = options || {};
        // 设置缓存值
        await this.cache.set(key, value, cacheOptions);
        // 添加标签
        if (tags && tags.length > 0) {
            await this.addTags(key, tags);
        }
    }
    /**
     * 为已存在的键添加标签
     */
    async addTags(key, tags) {
        for (const tag of tags) {
            const tagKey = this.getTagKey(tag);
            const keys = await this.getTagKeys(tagKey);
            if (!keys.includes(key)) {
                keys.push(key);
                await this.cache.set(tagKey, keys);
            }
        }
        // 更新键的标签索引
        await this.updateKeyTags(key, tags, 'add');
    }
    /**
     * 移除键的标签
     */
    async removeTags(key, tags) {
        for (const tag of tags) {
            const tagKey = this.getTagKey(tag);
            const keys = await this.getTagKeys(tagKey);
            const index = keys.indexOf(key);
            if (index > -1) {
                keys.splice(index, 1);
                if (keys.length === 0 && this.autoCleanup) {
                    // 删除空标签
                    await this.cache.remove(tagKey);
                }
                else {
                    await this.cache.set(tagKey, keys);
                }
            }
        }
        // 更新键的标签索引
        await this.updateKeyTags(key, tags, 'remove');
    }
    /**
     * 获取键的所有标签
     */
    async getKeyTags(key) {
        const indexKey = this.getKeyIndexKey(key);
        const tags = await this.cache.get(indexKey);
        return tags || [];
    }
    /**
     * 获取标签下的所有键
     */
    async getKeysByTag(tag) {
        const tagKey = this.getTagKey(tag);
        return this.getTagKeys(tagKey);
    }
    /**
     * 获取多个标签的交集键
     */
    async getKeysByTags(tags, mode = 'and') {
        if (tags.length === 0) {
            return [];
        }
        const keySets = await Promise.all(tags.map(async (tag) => this.getKeysByTag(tag)));
        if (mode === 'and') {
            // 交集
            return keySets.reduce((acc, keys) => {
                return acc.filter(key => keys.includes(key));
            });
        }
        else {
            // 并集
            const allKeys = new Set();
            keySets.forEach((keys) => {
                keys.forEach(key => allKeys.add(key));
            });
            return Array.from(allKeys);
        }
    }
    /**
     * 按标签清除缓存
     */
    async clearByTag(tag) {
        const keys = await this.getKeysByTag(tag);
        // 删除所有键
        await Promise.all(keys.map(async (key) => this.cache.remove(key)));
        // 删除标签索引
        const tagKey = this.getTagKey(tag);
        await this.cache.remove(tagKey);
        // 清理键的标签索引
        await Promise.all(keys.map(async (key) => this.removeKeyTagIndex(key)));
    }
    /**
     * 按多个标签清除缓存
     */
    async clearByTags(tags, mode = 'and') {
        const keys = await this.getKeysByTags(tags, mode);
        // 删除所有键
        await Promise.all(keys.map(async (key) => this.cache.remove(key)));
        // 如果是 AND 模式，只清理这些键的标签索引
        // 如果是 OR 模式，清理所有相关标签
        if (mode === 'or') {
            await Promise.all(tags.map(async (tag) => {
                const tagKey = this.getTagKey(tag);
                return this.cache.remove(tagKey);
            }));
        }
        // 清理键的标签索引
        await Promise.all(keys.map(async (key) => this.removeKeyTagIndex(key)));
    }
    /**
     * 获取所有标签
     */
    async getAllTags() {
        const allKeys = await this.cache.keys();
        const tags = [];
        for (const key of allKeys) {
            if (key.startsWith(this.tagPrefix)) {
                const tag = key.substring(this.tagPrefix.length);
                tags.push(tag);
            }
        }
        return tags;
    }
    /**
     * 获取标签统计信息
     */
    async getTagStats() {
        const tags = await this.getAllTags();
        const stats = {};
        for (const tag of tags) {
            const keys = await this.getKeysByTag(tag);
            stats[tag] = keys.length;
        }
        return stats;
    }
    /**
     * 清理空标签
     */
    async cleanupEmptyTags() {
        const tags = await this.getAllTags();
        let cleaned = 0;
        for (const tag of tags) {
            const keys = await this.getKeysByTag(tag);
            if (keys.length === 0) {
                const tagKey = this.getTagKey(tag);
                await this.cache.remove(tagKey);
                cleaned++;
            }
        }
        return cleaned;
    }
    /**
     * 重命名标签
     */
    async renameTag(oldTag, newTag) {
        const keys = await this.getKeysByTag(oldTag);
        // 为所有键添加新标签
        await Promise.all(keys.map(async (key) => this.addTags(key, [newTag])));
        // 移除旧标签
        await this.clearByTag(oldTag);
    }
    /**
     * 获取标签键
     */
    getTagKey(tag) {
        return `${this.tagPrefix}${tag}`;
    }
    /**
     * 获取键的标签索引键
     */
    getKeyIndexKey(key) {
        return `${this.TAG_INDEX_KEY}:${key}`;
    }
    /**
     * 获取标签下的键列表
     */
    async getTagKeys(tagKey) {
        const keys = await this.cache.get(tagKey);
        return keys || [];
    }
    /**
     * 更新键的标签索引
     */
    async updateKeyTags(key, tags, action) {
        const indexKey = this.getKeyIndexKey(key);
        const currentTags = await this.cache.get(indexKey) || [];
        let updatedTags;
        if (action === 'add') {
            updatedTags = Array.from(new Set([...currentTags, ...tags]));
        }
        else {
            updatedTags = currentTags.filter(t => !tags.includes(t));
        }
        if (updatedTags.length === 0) {
            await this.cache.remove(indexKey);
        }
        else {
            await this.cache.set(indexKey, updatedTags);
        }
    }
    /**
     * 移除键的标签索引
     */
    async removeKeyTagIndex(key) {
        const indexKey = this.getKeyIndexKey(key);
        await this.cache.remove(indexKey);
    }
}
/**
 * 创建标签管理器
 */
export function createTagManager(cache, config) {
    return new TagManager(cache, config);
}
//# sourceMappingURL=tag-manager.js.map