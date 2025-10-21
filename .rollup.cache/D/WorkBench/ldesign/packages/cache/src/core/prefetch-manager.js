/**
 * 智能预取和缓存预热管理器
 */
/**
 * 访问模式分析器
 */
class AccessPatternAnalyzer {
    constructor() {
        Object.defineProperty(this, "accessHistory", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        Object.defineProperty(this, "accessCount", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        Object.defineProperty(this, "sequenceMap", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        Object.defineProperty(this, "maxHistorySize", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 1000
        });
        Object.defineProperty(this, "maxSequenceSize", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 100
        });
    }
    /**
     * 记录访问
     */
    recordAccess(key) {
        // 更新访问历史
        this.accessHistory.push(key);
        if (this.accessHistory.length > this.maxHistorySize) {
            this.accessHistory.shift();
        }
        // 更新访问计数
        this.accessCount.set(key, (this.accessCount.get(key) || 0) + 1);
        // 更新序列模式
        if (this.accessHistory.length >= 2) {
            const prevKey = this.accessHistory[this.accessHistory.length - 2];
            const sequences = this.sequenceMap.get(prevKey) || new Map();
            sequences.set(key, (sequences.get(key) || 0) + 1);
            // 限制序列大小
            if (sequences.size > this.maxSequenceSize) {
                const sorted = Array.from(sequences.entries()).sort((a, b) => b[1] - a[1]);
                sequences.clear();
                sorted.slice(0, this.maxSequenceSize).forEach(([k, v]) => sequences.set(k, v));
            }
            this.sequenceMap.set(prevKey, sequences);
        }
    }
    /**
     * 预测下一个访问的键
     */
    predictNext(currentKey, topN = 5) {
        const sequences = this.sequenceMap.get(currentKey);
        if (!sequences || sequences.size === 0) {
            return this.getMostFrequent(topN);
        }
        // 按概率排序
        const sorted = Array.from(sequences.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, topN)
            .map(([key]) => key);
        // 如果预测结果不足，用高频键补充
        if (sorted.length < topN) {
            const frequent = this.getMostFrequent(topN - sorted.length, new Set(sorted));
            sorted.push(...frequent);
        }
        return sorted;
    }
    /**
     * 获取最频繁访问的键
     */
    getMostFrequent(topN, exclude = new Set()) {
        return Array.from(this.accessCount.entries())
            .filter(([key]) => !exclude.has(key))
            .sort((a, b) => b[1] - a[1])
            .slice(0, topN)
            .map(([key]) => key);
    }
    /**
     * 获取访问模式统计
     */
    getStats() {
        const totalAccess = Array.from(this.accessCount.values()).reduce((a, b) => a + b, 0);
        const hotKeys = Array.from(this.accessCount.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([key, count]) => ({ key, count }));
        const patterns = [];
        for (const [from, toMap] of this.sequenceMap.entries()) {
            for (const [to, count] of toMap.entries()) {
                patterns.push({ sequence: [from, to], count });
            }
        }
        patterns.sort((a, b) => b.count - a.count);
        return {
            totalAccess,
            uniqueKeys: this.accessCount.size,
            hotKeys,
            patterns: patterns.slice(0, 10)
        };
    }
    /**
     * 清空历史
     */
    clear() {
        this.accessHistory = [];
        this.accessCount.clear();
        this.sequenceMap.clear();
    }
}
/**
 * 马尔可夫链预测策略
 */
class MarkovChainStrategy {
    constructor() {
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 'markov'
        });
        Object.defineProperty(this, "analyzer", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new AccessPatternAnalyzer()
        });
    }
    predict(currentKey, _history) {
        return this.analyzer.predictNext(currentKey);
    }
    updateHistory(key) {
        this.analyzer.recordAccess(key);
    }
    clear() {
        this.analyzer.clear();
    }
}
/**
 * LRU预测策略 - 预取最近最常使用的键
 */
class LRUPrefetchStrategy {
    constructor() {
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 'lru'
        });
        Object.defineProperty(this, "recentKeys", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        Object.defineProperty(this, "maxSize", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 100
        });
    }
    predict(currentKey, _history) {
        // 返回最近访问的键（排除当前键）
        return this.recentKeys
            .filter(key => key !== currentKey)
            .slice(0, 5);
    }
    updateHistory(key) {
        // 移除已存在的键
        const index = this.recentKeys.indexOf(key);
        if (index > -1) {
            this.recentKeys.splice(index, 1);
        }
        // 添加到最前面
        this.recentKeys.unshift(key);
        // 限制大小
        if (this.recentKeys.length > this.maxSize) {
            this.recentKeys.pop();
        }
    }
    clear() {
        this.recentKeys = [];
    }
}
/**
 * 关联规则预测策略
 */
class AssociationRuleStrategy {
    constructor() {
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 'association'
        });
        Object.defineProperty(this, "rules", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        Object.defineProperty(this, "coOccurrence", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
    }
    predict(currentKey, _history) {
        const associated = this.rules.get(currentKey);
        if (!associated || associated.size === 0) {
            return [];
        }
        // 根据关联强度排序
        const coMap = this.coOccurrence.get(currentKey);
        if (!coMap) {
            return Array.from(associated).slice(0, 5);
        }
        return Array.from(associated)
            .sort((a, b) => (coMap.get(b) || 0) - (coMap.get(a) || 0))
            .slice(0, 5);
    }
    updateHistory(_key) {
        // 简化实现：记录键之间的关联
        // 实际应用中可以根据时间窗口或会话来建立关联
    }
    /**
     * 添加关联规则
     */
    addRule(key, associatedKeys) {
        const set = this.rules.get(key) || new Set();
        associatedKeys.forEach(k => set.add(k));
        this.rules.set(key, set);
        // 更新共现计数
        const coMap = this.coOccurrence.get(key) || new Map();
        associatedKeys.forEach(k => {
            coMap.set(k, (coMap.get(k) || 0) + 1);
        });
        this.coOccurrence.set(key, coMap);
    }
    clear() {
        this.rules.clear();
        this.coOccurrence.clear();
    }
}
/**
 * 智能预取管理器
 */
export class PrefetchManager {
    constructor(config) {
        Object.defineProperty(this, "strategies", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        Object.defineProperty(this, "activeStrategy", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "prefetchQueue", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Set()
        });
        Object.defineProperty(this, "prefetchInProgress", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        Object.defineProperty(this, "cacheGetter", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "cacheSetter", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "fetcher", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        // 初始化策略
        this.strategies.set('markov', new MarkovChainStrategy());
        this.strategies.set('lru', new LRUPrefetchStrategy());
        this.strategies.set('association', new AssociationRuleStrategy());
        // 设置活动策略
        this.activeStrategy = this.strategies.get(config?.strategy || 'markov');
        // 设置缓存操作函数
        this.cacheGetter = config?.cacheGetter;
        this.cacheSetter = config?.cacheSetter;
        this.fetcher = config?.fetcher;
    }
    /**
     * 记录访问并触发预取
     */
    async recordAccess(key) {
        // 更新策略历史
        this.activeStrategy.updateHistory(key);
        // 获取预测的键
        const predictedKeys = this.activeStrategy.predict(key, []);
        // 触发预取
        await this.prefetch(predictedKeys);
    }
    /**
     * 预取数据
     */
    async prefetch(keys) {
        if (!this.cacheGetter || !this.cacheSetter || !this.fetcher) {
            return;
        }
        const tasks = [];
        for (const key of keys) {
            // 跳过正在预取的键
            if (this.prefetchInProgress.has(key)) {
                continue;
            }
            // 检查缓存中是否已存在
            const existingPromise = this.cacheGetter(key).then(async (value) => {
                if (value === null) {
                    // 不存在，需要预取
                    await this.fetchAndCache(key);
                }
            });
            this.prefetchInProgress.set(key, existingPromise);
            tasks.push(existingPromise);
            // 清理完成的预取任务
            existingPromise.finally(() => {
                this.prefetchInProgress.delete(key);
            });
        }
        // 等待所有预取完成（不阻塞）
        Promise.all(tasks).catch(error => {
            console.warn('[PrefetchManager] Prefetch error:', error);
        });
    }
    /**
     * 获取并缓存数据
     */
    async fetchAndCache(key) {
        if (!this.fetcher || !this.cacheSetter) {
            return;
        }
        try {
            const value = await this.fetcher(key);
            await this.cacheSetter(key, value, { ttl: 3600000 }); // 默认1小时TTL
        }
        catch (error) {
            console.warn(`[PrefetchManager] Failed to fetch ${key}:`, error);
        }
    }
    /**
     * 预热缓存
     */
    async warmup(config) {
        const success = [];
        const failed = [];
        const concurrency = config.concurrency || 5;
        // 收集所有要预热的键
        const keysToWarmup = new Set(config.keys || []);
        // 根据模式添加键（简化实现）
        if (config.patterns) {
            // 这里应该根据实际的模式匹配逻辑来添加键
            // 暂时跳过模式匹配
        }
        // 批量预热
        const keys = Array.from(keysToWarmup);
        if (config.batchFetcher) {
            // 使用批量获取
            try {
                const batchSize = 50;
                for (let i = 0; i < keys.length; i += batchSize) {
                    const batch = keys.slice(i, i + batchSize);
                    const results = await config.batchFetcher(batch);
                    for (const [key, value] of results.entries()) {
                        if (this.cacheSetter) {
                            await this.cacheSetter(key, value);
                            success.push(key);
                        }
                    }
                }
            }
            catch (error) {
                failed.push({
                    key: 'batch',
                    error: error instanceof Error ? error : new Error(String(error))
                });
            }
        }
        else if (config.fetcher) {
            // 并发单个获取
            const tasks = keys.map(async (key) => {
                try {
                    const value = await this.retryFetch(() => config.fetcher(key), config.retryCount || 3);
                    if (this.cacheSetter) {
                        await this.cacheSetter(key, value);
                    }
                    success.push(key);
                }
                catch (error) {
                    failed.push({
                        key,
                        error: error instanceof Error ? error : new Error(String(error))
                    });
                }
            });
            // 控制并发
            await this.runConcurrent(tasks, concurrency);
        }
        return { success, failed };
    }
    /**
     * 重试获取
     */
    async retryFetch(fetcher, maxRetries) {
        let lastError;
        for (let i = 0; i <= maxRetries; i++) {
            try {
                return await fetcher();
            }
            catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                if (i < maxRetries) {
                    // 指数退避
                    await new Promise(resolve => setTimeout(resolve, 2 ** i * 100));
                }
            }
        }
        throw lastError || new Error('Fetch failed');
    }
    /**
     * 控制并发执行
     */
    async runConcurrent(tasks, concurrency) {
        const results = [];
        const executing = [];
        for (const task of tasks) {
            const promise = task.then(() => {
                executing.splice(executing.indexOf(promise), 1);
            });
            results.push(promise);
            executing.push(promise);
            if (executing.length >= concurrency) {
                await Promise.race(executing);
            }
        }
        await Promise.all(results);
    }
    /**
     * 切换预测策略
     */
    setStrategy(strategyName) {
        const strategy = this.strategies.get(strategyName);
        if (strategy) {
            this.activeStrategy = strategy;
        }
    }
    /**
     * 添加自定义策略
     */
    addStrategy(name, strategy) {
        this.strategies.set(name, strategy);
    }
    /**
     * 获取预取统计
     */
    getStats() {
        return {
            queueSize: this.prefetchQueue.size,
            inProgressCount: this.prefetchInProgress.size,
            strategy: this.activeStrategy.name
        };
    }
    /**
     * 清空预取队列和历史
     */
    clear() {
        this.prefetchQueue.clear();
        this.prefetchInProgress.clear();
        this.activeStrategy.clear();
    }
}
/**
 * 创建预取管理器
 */
export function createPrefetchManager(config) {
    return new PrefetchManager(config);
}
//# sourceMappingURL=prefetch-manager.js.map