/*!
 * ***********************************
 * @ldesign/cache v0.1.1           *
 * Built with rollup               *
 * Build time: 2024-10-21 14:32:03 *
 * Build mode: production          *
 * Minified: No                    *
 * ***********************************
 */
import { inject, ref, onUnmounted, computed, watch } from 'vue';
import { TIME_INTERVALS } from '../constants/performance.js';
import { CacheManager } from '../core/cache-manager.js';
import { CACHE_MANAGER_KEY } from './cache-provider.js';

function useCache(options) {
  const injectedManager = inject(CACHE_MANAGER_KEY, null);
  const cacheManager = injectedManager ?? new CacheManager(options);
  const loading = ref(false);
  const error = ref(null);
  const stats = ref(null);
  const set = async (key, value, setOptions) => {
    loading.value = true;
    error.value = null;
    try {
      await cacheManager.set(key, value, setOptions);
    } catch (err) {
      error.value = err;
      throw err;
    } finally {
      loading.value = false;
    }
  };
  const get = async (key) => {
    loading.value = true;
    error.value = null;
    try {
      return await cacheManager.get(key);
    } catch (err) {
      error.value = err;
      throw err;
    } finally {
      loading.value = false;
    }
  };
  const remove = async (key) => {
    loading.value = true;
    error.value = null;
    try {
      await cacheManager.remove(key);
    } catch (err) {
      error.value = err;
      throw err;
    } finally {
      loading.value = false;
    }
  };
  const clear = async (engine) => {
    loading.value = true;
    error.value = null;
    try {
      await cacheManager.clear(engine);
    } catch (err) {
      error.value = err;
      throw err;
    } finally {
      loading.value = false;
    }
  };
  const has = async (key) => {
    try {
      return await cacheManager.has(key);
    } catch (err) {
      error.value = err;
      return false;
    }
  };
  const keys = async (engine) => {
    try {
      return await cacheManager.keys(engine);
    } catch (err) {
      error.value = err;
      return [];
    }
  };
  const getStats = async () => {
    try {
      const result = await cacheManager.getStats();
      stats.value = result;
      return result;
    } catch (err) {
      error.value = err;
      throw err;
    }
  };
  const refreshStats = async () => {
    try {
      stats.value = await cacheManager.getStats();
    } catch (err) {
      error.value = err;
    }
  };
  const cleanup = async () => {
    try {
      await cacheManager.cleanup();
      await refreshStats();
    } catch (err) {
      error.value = err;
    }
  };
  const useReactiveCache = (key, defaultValue) => {
    const value = ref(defaultValue ?? null);
    const isLoading = ref(false);
    const cacheError = ref(null);
    const load = async () => {
      isLoading.value = true;
      cacheError.value = null;
      try {
        const cached = await get(key);
        value.value = cached !== null ? cached : defaultValue ?? null;
      } catch (err) {
        cacheError.value = err instanceof Error ? err : new Error(String(err));
        value.value = defaultValue ?? null;
      } finally {
        isLoading.value = false;
      }
    };
    const save = async (newValue, setOptions) => {
      isLoading.value = true;
      cacheError.value = null;
      try {
        await set(key, newValue, setOptions);
        value.value = newValue;
      } catch (err) {
        cacheError.value = err instanceof Error ? err : new Error(String(err));
        throw err;
      } finally {
        isLoading.value = false;
      }
    };
    const enableAutoSave = (opts) => {
      const throttleMs = opts?.throttle ?? TIME_INTERVALS.AUTO_SAVE_THROTTLE_DEFAULT;
      const debounceMs = opts?.debounce ?? TIME_INTERVALS.AUTO_SAVE_DEBOUNCE_DEFAULT;
      let pending = false;
      let throttleTimer;
      let debounceTimer;
      let lastSaveTime = 0;
      const performSave = async (val) => {
        try {
          await save(val, opts?.ttl ? {
            ttl: opts.ttl
          } : void 0);
          lastSaveTime = Date.now();
        } catch (error2) {
          console.error("Auto-save failed:", error2);
        } finally {
          pending = false;
        }
      };
      const stop = watch(() => value.value, (val) => {
        if (val === null || pending) {
          return;
        }
        if (debounceTimer !== void 0) {
          clearTimeout(debounceTimer);
          debounceTimer = void 0;
        }
        debounceTimer = setTimeout(() => {
          const now = Date.now();
          const timeSinceLastSave = now - lastSaveTime;
          if (timeSinceLastSave < throttleMs) {
            if (throttleTimer !== void 0) {
              clearTimeout(throttleTimer);
            }
            throttleTimer = setTimeout(() => {
              pending = true;
              performSave(val).catch(console.error);
            }, throttleMs - timeSinceLastSave);
          } else {
            pending = true;
            performSave(val).catch(console.error);
          }
        }, debounceMs);
      }, {
        deep: true,
        immediate: opts?.immediate ?? false
      });
      return () => {
        stop();
        if (throttleTimer !== void 0) {
          clearTimeout(throttleTimer);
          throttleTimer = void 0;
        }
        if (debounceTimer !== void 0) {
          clearTimeout(debounceTimer);
          debounceTimer = void 0;
        }
      };
    };
    const removeValue = async () => {
      isLoading.value = true;
      cacheError.value = null;
      try {
        await remove(key);
        value.value = defaultValue ?? null;
      } catch (err) {
        cacheError.value = err instanceof Error ? err : new Error(String(err));
        throw err;
      } finally {
        isLoading.value = false;
      }
    };
    if (options?.immediate !== false) {
      load().catch(console.error);
    }
    const valueComputed = computed(() => value.value);
    const loadingComputed = computed(() => isLoading.value);
    const errorComputed = computed(() => cacheError.value);
    const existsComputed = computed(() => value.value !== null && value.value !== void 0);
    const isEmptyComputed = computed(() => {
      const val = value.value;
      if (val === null || val === void 0) {
        return true;
      }
      if (typeof val === "string") {
        return val === "";
      }
      if (Array.isArray(val)) {
        return val.length === 0;
      }
      if (typeof val === "object") {
        return Object.keys(val).length === 0;
      }
      return false;
    });
    const isValidComputed = computed(() => value.value !== null && value.value !== void 0);
    const hasErrorComputed = computed(() => cacheError.value !== null);
    const isReadyComputed = computed(() => !isLoading.value && cacheError.value === null);
    const setWithCallback = async (newValue, options2, onSuccess, onError) => {
      try {
        await save(newValue, options2);
        onSuccess?.();
      } catch (error2) {
        onError?.(error2 instanceof Error ? error2 : new Error(String(error2)));
        throw error2;
      }
    };
    const refreshWithCallback = async (onSuccess, onError) => {
      try {
        await load();
        onSuccess?.();
      } catch (error2) {
        onError?.(error2 instanceof Error ? error2 : new Error(String(error2)));
        throw error2;
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
      enableAutoSave
    };
  };
  const createdLocally = !injectedManager;
  if (createdLocally && options?.cleanupOnUnmount !== false) {
    onUnmounted(async () => {
      try {
        await cacheManager.destroy();
      } catch (err) {
        console.error("Failed to cleanup cache manager:", err);
      }
    });
  }
  const useCacheValue = (key, defaultValue, options2) => {
    const cache = useReactiveCache(key, defaultValue);
    return {
      value: cache.value,
      loading: cache.loading,
      error: cache.error,
      exists: cache.exists,
      set: async (value) => cache.set(value, options2?.ttl ? {
        ttl: options2.ttl
      } : void 0),
      refresh: cache.refresh,
      remove: cache.remove,
      // 便捷的计算属性
      isEmpty: computed(() => {
        const val = cache.value.value;
        return val === null || val === void 0 || val === "" || Array.isArray(val) && val.length === 0;
      }),
      isValid: computed(() => cache.value.value !== null && cache.value.value !== void 0)
    };
  };
  const useCacheSync = (key, defaultValue, options2) => {
    const cache = useReactiveCache(key, defaultValue);
    options2?.throttle ?? TIME_INTERVALS.AUTO_SAVE_THROTTLE_DEFAULT;
    const syncValue = computed({
      get: () => cache.value.value,
      set: (newValue) => {
        if (newValue !== null) {
          cache.set(newValue, options2?.ttl ? {
            ttl: options2.ttl
          } : void 0);
        }
      }
    });
    return {
      value: syncValue,
      loading: cache.loading,
      error: cache.error,
      exists: cache.exists,
      refresh: cache.refresh,
      remove: cache.remove
    };
  };
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
    manager: cacheManager
  };
}

export { useCache };
/*! End of @ldesign/cache | Powered by @ldesign/builder */
//# sourceMappingURL=use-cache.js.map
