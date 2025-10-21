/**
 * 缓存预热管理器
 *
 * 在应用启动时预加载重要数据到缓存中
 */
export class WarmupManager {
    constructor(cache, config = {}) {
        Object.defineProperty(this, "cache", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: cache
        });
        Object.defineProperty(this, "config", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: config
        });
        Object.defineProperty(this, "warmupItems", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        Object.defineProperty(this, "running", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        this.config = {
            concurrency: 5,
            timeout: 30000,
            retries: 3,
            retryDelay: 1000,
            continueOnError: true,
            ...config,
        };
    }
    /**
     * 注册预热项
     */
    register(item) {
        const items = Array.isArray(item) ? item : [item];
        for (const i of items) {
            this.warmupItems.set(i.key, i);
        }
    }
    /**
     * 注销预热项
     */
    unregister(key) {
        const keys = Array.isArray(key) ? key : [key];
        for (const k of keys) {
            this.warmupItems.delete(k);
        }
    }
    /**
     * 执行预热
     */
    async warmup(keys) {
        if (this.running) {
            throw new Error('Warmup is already running');
        }
        this.running = true;
        const startTime = Date.now();
        const result = {
            successful: [],
            failed: [],
            duration: 0,
            stats: {
                total: 0,
                success: 0,
                failed: 0,
                skipped: 0,
            },
        };
        try {
            // 获取要预热的项
            const itemsToWarmup = this.getItemsToWarmup(keys);
            result.stats.total = itemsToWarmup.length;
            // 按优先级排序
            const sortedItems = this.sortByPriority(itemsToWarmup);
            // 处理依赖关系
            const orderedItems = this.resolveDependencies(sortedItems);
            // 分批并发执行
            await this.processBatches(orderedItems, result);
            result.duration = Date.now() - startTime;
            return result;
        }
        finally {
            this.running = false;
        }
    }
    /**
     * 获取要预热的项
     */
    getItemsToWarmup(keys) {
        if (keys) {
            return keys
                .map(key => this.warmupItems.get(key))
                .filter((item) => item !== undefined);
        }
        return Array.from(this.warmupItems.values());
    }
    /**
     * 按优先级排序
     */
    sortByPriority(items) {
        return items.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    }
    /**
     * 解析依赖关系
     */
    resolveDependencies(items) {
        const resolved = [];
        const visited = new Set();
        const visiting = new Set();
        const visit = (item) => {
            if (visited.has(item.key)) {
                return;
            }
            if (visiting.has(item.key)) {
                throw new Error(`Circular dependency detected: ${item.key}`);
            }
            visiting.add(item.key);
            if (item.dependencies) {
                for (const dep of item.dependencies) {
                    const depItem = items.find(i => i.key === dep);
                    if (depItem) {
                        visit(depItem);
                    }
                }
            }
            visiting.delete(item.key);
            visited.add(item.key);
            resolved.push(item);
        };
        for (const item of items) {
            visit(item);
        }
        return resolved;
    }
    /**
     * 分批处理
     */
    async processBatches(items, result) {
        const concurrency = this.config?.concurrency || 5;
        for (let i = 0; i < items.length; i += concurrency) {
            const batch = items.slice(i, i + concurrency);
            await Promise.all(batch.map(async (item) => this.processItem(item, result)));
        }
    }
    /**
     * 处理单个预热项
     */
    async processItem(item, result) {
        let retries = 0;
        const maxRetries = this.config?.retries || 3;
        while (retries <= maxRetries) {
            try {
                // 检查是否已存在
                const existing = await this.cache.has(item.key);
                if (existing) {
                    result.stats.skipped++;
                    return;
                }
                // 带超时的数据获取
                const data = await this.fetchWithTimeout(item.fetcher);
                // 存入缓存
                await this.cache.set(item.key, data, item.options);
                result.successful.push(item.key);
                result.stats.success++;
                return;
            }
            catch (error) {
                retries++;
                if (retries > maxRetries) {
                    result.failed.push({
                        key: item.key,
                        error: error instanceof Error ? error : new Error(String(error)),
                        retries: retries - 1,
                    });
                    result.stats.failed++;
                    if (!this.config?.continueOnError) {
                        throw error;
                    }
                    return;
                }
                // 等待后重试
                await this.delay(this.config?.retryDelay || 1000);
            }
        }
    }
    /**
     * 带超时的数据获取
     */
    async fetchWithTimeout(fetcher) {
        const timeout = this.config?.timeout || 30000;
        return Promise.race([
            Promise.resolve(fetcher()),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Warmup timeout')), timeout)),
        ]);
    }
    /**
     * 延迟函数
     */
    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    /**
     * 获取预热状态
     */
    getStatus() {
        return {
            running: this.running,
            itemCount: this.warmupItems.size,
            items: Array.from(this.warmupItems.values()).map(item => ({
                key: item.key,
                priority: item.priority,
            })),
        };
    }
    /**
     * 清空所有预热项
     */
    clear() {
        this.warmupItems.clear();
    }
}
/**
 * 创建预热管理器
 */
export function createWarmupManager(cache, config) {
    return new WarmupManager(cache, config);
}
//# sourceMappingURL=warmup-manager.js.map