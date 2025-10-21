import { computed, inject, onUnmounted, ref, watch } from 'vue';
import { TIME_INTERVALS } from '../constants/performance';
import { CacheManager } from '../core/cache-manager';
import { CACHE_MANAGER_KEY } from './cache-provider';
/**
 * Vue 3 缓存组合式函数
 */
export function useCache(options) {
    // 优先使用由 CacheProvider 注入的全局管理器；若不存在则本地创建
    const injectedManager = inject(CACHE_MANAGER_KEY, null);
    const cacheManager = injectedManager ?? new CacheManager(options);
    // 响应式状态
    const loading = ref(false);
    const error = ref(null);
    const stats = ref(null);
    /**
     * 设置缓存项
     */
    const set = async (key, value, setOptions) => {
        loading.value = true;
        error.value = null;
        try {
            await cacheManager.set(key, value, setOptions);
        }
        catch (err) {
            error.value = err;
            throw err;
        }
        finally {
            loading.value = false;
        }
    };
    /**
     * 获取缓存项
     */
    const get = async (key) => {
        loading.value = true;
        error.value = null;
        try {
            return await cacheManager.get(key);
        }
        catch (err) {
            error.value = err;
            throw err;
        }
        finally {
            loading.value = false;
        }
    };
    /**
     * 删除缓存项
     */
    const remove = async (key) => {
        loading.value = true;
        error.value = null;
        try {
            await cacheManager.remove(key);
        }
        catch (err) {
            error.value = err;
            throw err;
        }
        finally {
            loading.value = false;
        }
    };
    /**
     * 清空缓存
     */
    const clear = async (engine) => {
        loading.value = true;
        error.value = null;
        try {
            await cacheManager.clear(engine);
        }
        catch (err) {
            error.value = err;
            throw err;
        }
        finally {
            loading.value = false;
        }
    };
    /**
     * 检查键是否存在
     */
    const has = async (key) => {
        try {
            return await cacheManager.has(key);
        }
        catch (err) {
            error.value = err;
            return false;
        }
    };
    /**
     * 获取所有键名
     */
    const keys = async (engine) => {
        try {
            return await cacheManager.keys(engine);
        }
        catch (err) {
            error.value = err;
            return [];
        }
    };
    /**
     * 获取缓存统计
     */
    const getStats = async () => {
        try {
            const result = await cacheManager.getStats();
            stats.value = result;
            return result;
        }
        catch (err) {
            error.value = err;
            throw err;
        }
    };
    /**
     * 刷新统计信息
     */
    const refreshStats = async () => {
        try {
            stats.value = await cacheManager.getStats();
        }
        catch (err) {
            error.value = err;
        }
    };
    /**
     * 清理过期项
     */
    const cleanup = async () => {
        try {
            await cacheManager.cleanup();
            await refreshStats(); // 更新统计信息
        }
        catch (err) {
            error.value = err;
        }
    };
    /**
     * 创建响应式缓存
     *
     * 提供响应式的缓存值管理，支持自动加载、保存和错误处理
     *
     * @template T - 缓存值的类型
     * @param key - 缓存键
     * @param defaultValue - 默认值
     * @returns 响应式缓存对象
     *
     * @example
     * ```typescript
     * const userCache = useReactiveCache<User>('user:123', { name: '', age: 0 })
     *
     * // 响应式访问缓存值
     *  // 当前缓存值
     *  // 是否正在加载
     *
     * // 设置新值
     * await userCache.set({ name: 'John', age: 30 })
     *
     * // 刷新缓存
     * await userCache.refresh()
     * ```
     */
    const useReactiveCache = (key, defaultValue) => {
        const value = ref(defaultValue ?? null);
        const isLoading = ref(false);
        const cacheError = ref(null);
        /**
         * 从缓存加载数据
         */
        const load = async () => {
            isLoading.value = true;
            cacheError.value = null;
            try {
                const cached = await get(key);
                value.value = cached !== null ? cached : (defaultValue ?? null);
            }
            catch (err) {
                cacheError.value = err instanceof Error ? err : new Error(String(err));
                value.value = defaultValue ?? null;
            }
            finally {
                isLoading.value = false;
            }
        };
        /**
         * 保存值到缓存
         */
        const save = async (newValue, setOptions) => {
            isLoading.value = true;
            cacheError.value = null;
            try {
                await set(key, newValue, setOptions);
                value.value = newValue;
            }
            catch (err) {
                cacheError.value = err instanceof Error ? err : new Error(String(err));
                throw err;
            }
            finally {
                isLoading.value = false;
            }
        };
        /**
         * 启用自动保存（带节流和防抖）
         */
        const enableAutoSave = (opts) => {
            const throttleMs = opts?.throttle ?? TIME_INTERVALS.AUTO_SAVE_THROTTLE_DEFAULT;
            const debounceMs = opts?.debounce ?? TIME_INTERVALS.AUTO_SAVE_DEBOUNCE_DEFAULT;
            let pending = false;
            let throttleTimer;
            let debounceTimer;
            let lastSaveTime = 0;
            const performSave = async (val) => {
                try {
                    await save(val, opts?.ttl ? { ttl: opts.ttl } : undefined);
                    lastSaveTime = Date.now();
                }
                catch (error) {
                    console.error('Auto-save failed:', error);
                }
                finally {
                    pending = false;
                }
            };
            const stop = watch(() => value.value, (val) => {
                if (val === null || pending) {
                    return;
                }
                // 清除之前的防抖定时器
                if (debounceTimer !== undefined) {
                    clearTimeout(debounceTimer);
                    debounceTimer = undefined;
                }
                // 防抖：延迟执行
                debounceTimer = setTimeout(() => {
                    const now = Date.now();
                    const timeSinceLastSave = now - lastSaveTime;
                    // 节流：如果距离上次保存时间太短，延迟执行
                    if (timeSinceLastSave < throttleMs) {
                        if (throttleTimer !== undefined) {
                            clearTimeout(throttleTimer);
                        }
                        throttleTimer = setTimeout(() => {
                            pending = true;
                            performSave(val).catch(console.error);
                        }, throttleMs - timeSinceLastSave);
                    }
                    else {
                        // 立即执行
                        pending = true;
                        performSave(val).catch(console.error);
                    }
                }, debounceMs);
            }, {
                deep: true,
                immediate: opts?.immediate ?? false,
            });
            return () => {
                stop();
                if (throttleTimer !== undefined) {
                    clearTimeout(throttleTimer);
                    throttleTimer = undefined;
                }
                if (debounceTimer !== undefined) {
                    clearTimeout(debounceTimer);
                    debounceTimer = undefined;
                }
            };
        };
        /**
         * 从缓存中移除值
         */
        const removeValue = async () => {
            isLoading.value = true;
            cacheError.value = null;
            try {
                await remove(key);
                value.value = defaultValue ?? null;
            }
            catch (err) {
                cacheError.value = err instanceof Error ? err : new Error(String(err));
                throw err;
            }
            finally {
                isLoading.value = false;
            }
        };
        // 初始化时加载数据
        if (options?.immediate !== false) {
            load().catch(console.error);
        }
        // 计算属性
        const valueComputed = computed(() => value.value);
        const loadingComputed = computed(() => isLoading.value);
        const errorComputed = computed(() => cacheError.value);
        const existsComputed = computed(() => value.value !== null && value.value !== undefined);
        // 扩展的计算属性
        const isEmptyComputed = computed(() => {
            const val = value.value;
            if (val === null || val === undefined) {
                return true;
            }
            if (typeof val === 'string') {
                return val === '';
            }
            if (Array.isArray(val)) {
                return val.length === 0;
            }
            if (typeof val === 'object') {
                return Object.keys(val).length === 0;
            }
            return false;
        });
        const isValidComputed = computed(() => value.value !== null && value.value !== undefined);
        const hasErrorComputed = computed(() => cacheError.value !== null);
        const isReadyComputed = computed(() => !isLoading.value && cacheError.value === null);
        // 便捷方法
        const setWithCallback = async (newValue, options, onSuccess, onError) => {
            try {
                await save(newValue, options);
                onSuccess?.();
            }
            catch (error) {
                onError?.(error instanceof Error ? error : new Error(String(error)));
                throw error;
            }
        };
        const refreshWithCallback = async (onSuccess, onError) => {
            try {
                await load();
                onSuccess?.();
            }
            catch (error) {
                onError?.(error instanceof Error ? error : new Error(String(error)));
                throw error;
            }
        };
        return {
            value: valueComputed,
            loading: loadingComputed,
            error: errorComputed,
            exists: existsComputed,
            isEmpty: isEmptyComputed,
            isValid: isValidComputed,
            hasError: hasErrorComputed,
            isReady: isReadyComputed,
            set: save,
            setWithCallback,
            refresh: load,
            refreshWithCallback,
            remove: removeValue,
            enableAutoSave,
        };
    };
    // 组件卸载时清理（仅在本地创建管理器时执行，避免销毁全局实例）
    const createdLocally = !injectedManager;
    if (createdLocally && options?.cleanupOnUnmount !== false) {
        onUnmounted(async () => {
            try {
                await cacheManager.destroy();
            }
            catch (err) {
                console.error('Failed to cleanup cache manager:', err);
            }
        });
    }
    // 便捷的组合式函数
    /**
     * 简单值缓存 - 用于缓存单个值
     */
    const useCacheValue = (key, defaultValue, options) => {
        const cache = useReactiveCache(key, defaultValue);
        // 提供更简洁的API
        return {
            value: cache.value,
            loading: cache.loading,
            error: cache.error,
            exists: cache.exists,
            set: async (value) => cache.set(value, options?.ttl ? { ttl: options.ttl } : undefined),
            refresh: cache.refresh,
            remove: cache.remove,
            // 便捷的计算属性
            isEmpty: computed(() => {
                const val = cache.value.value;
                return val === null || val === undefined || val === '' || (Array.isArray(val) && val.length === 0);
            }),
            isValid: computed(() => cache.value.value !== null && cache.value.value !== undefined),
        };
    };
    /**
     * 双向绑定缓存 - 支持v-model
     */
    const useCacheSync = (key, defaultValue, options) => {
        const cache = useReactiveCache(key, defaultValue);
        const _throttleMs = options?.throttle ?? TIME_INTERVALS.AUTO_SAVE_THROTTLE_DEFAULT;
        // 创建可写的计算属性用于双向绑定
        const syncValue = computed({
            get: () => cache.value.value,
            set: (newValue) => {
                if (newValue !== null) {
                    // 使用节流避免频繁写入
                    cache.set(newValue, options?.ttl ? { ttl: options.ttl } : undefined);
                }
            },
        });
        return {
            value: syncValue,
            loading: cache.loading,
            error: cache.error,
            exists: cache.exists,
            refresh: cache.refresh,
            remove: cache.remove,
        };
    };
    // 计算属性
    const isReady = computed(() => !loading.value && !error.value);
    const hasError = computed(() => error.value !== null);
    return {
        // 基础方法
        set,
        get,
        remove,
        clear,
        has,
        keys,
        cleanup,
        // 统计信息
        getStats,
        refreshStats,
        stats: computed(() => stats.value),
        // 状态
        loading: computed(() => loading.value),
        error: computed(() => error.value),
        isReady,
        hasError,
        // 响应式缓存
        useReactiveCache,
        // 便捷的组合式函数
        useCacheValue,
        useCacheSync,
        // 缓存管理器实例
        manager: cacheManager,
    };
}
//# sourceMappingURL=use-cache.js.map