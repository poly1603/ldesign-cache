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

var vue = require('vue');
var useCache = require('./use-cache.cjs');

function useCacheList(key, defaultValue = [], options) {
  const {
    useReactiveCache
  } = useCache.useCache();
  const cache = useReactiveCache(key, defaultValue);
  return {
    list: cache.value,
    loading: cache.loading,
    error: cache.error,
    exists: cache.exists,
    // 列表操作方法
    add: async (item) => {
      const current = cache.value.value || [];
      await cache.set([...current, item], options?.ttl ? {
        ttl: options.ttl
      } : void 0);
    },
    remove: async (index) => {
      const current = cache.value.value || [];
      const newList = current.filter((_, i) => i !== index);
      await cache.set(newList, options?.ttl ? {
        ttl: options.ttl
      } : void 0);
    },
    removeItem: async (item) => {
      const current = cache.value.value || [];
      const newList = current.filter((i) => i !== item);
      await cache.set(newList, options?.ttl ? {
        ttl: options.ttl
      } : void 0);
    },
    update: async (index, item) => {
      const current = cache.value.value || [];
      const newList = [...current];
      newList[index] = item;
      await cache.set(newList, options?.ttl ? {
        ttl: options.ttl
      } : void 0);
    },
    insert: async (index, item) => {
      const current = cache.value.value || [];
      const newList = [...current];
      newList.splice(index, 0, item);
      await cache.set(newList, options?.ttl ? {
        ttl: options.ttl
      } : void 0);
    },
    clear: async () => {
      await cache.set([], options?.ttl ? {
        ttl: options.ttl
      } : void 0);
    },
    refresh: cache.refresh,
    // 便捷的计算属性
    length: vue.computed(() => cache.value.value?.length || 0),
    isEmpty: vue.computed(() => (cache.value.value?.length || 0) === 0),
    first: vue.computed(() => cache.value.value?.[0] || null),
    last: vue.computed(() => {
      const list = cache.value.value;
      return list && list.length > 0 ? list[list.length - 1] : null;
    })
  };
}
function useCacheObject(key, defaultValue = {}, options) {
  const {
    useReactiveCache
  } = useCache.useCache();
  const cache = useReactiveCache(key, defaultValue);
  return {
    object: cache.value,
    loading: cache.loading,
    error: cache.error,
    exists: cache.exists,
    // 对象操作方法
    setProperty: async (prop, value) => {
      const current = cache.value.value || {};
      const newObject = {
        ...current,
        [prop]: value
      };
      await cache.set(newObject, options?.ttl ? {
        ttl: options.ttl
      } : void 0);
    },
    removeProperty: async (prop) => {
      const current = cache.value.value || {};
      const newObject = {
        ...current
      };
      delete newObject[prop];
      await cache.set(newObject, options?.ttl ? {
        ttl: options.ttl
      } : void 0);
    },
    merge: async (updates) => {
      const current = cache.value.value || {};
      const newObject = {
        ...current,
        ...updates
      };
      await cache.set(newObject, options?.ttl ? {
        ttl: options.ttl
      } : void 0);
    },
    clear: async () => {
      await cache.set({}, options?.ttl ? {
        ttl: options.ttl
      } : void 0);
    },
    refresh: cache.refresh,
    // 便捷的计算属性
    keys: vue.computed(() => Object.keys(cache.value.value || {})),
    values: vue.computed(() => Object.values(cache.value.value || {})),
    entries: vue.computed(() => Object.entries(cache.value.value || {})),
    isEmpty: vue.computed(() => Object.keys(cache.value.value || {}).length === 0),
    size: vue.computed(() => Object.keys(cache.value.value || {}).length)
  };
}
function useCacheCounter(key, defaultValue = 0, options) {
  const {
    useReactiveCache
  } = useCache.useCache();
  const cache = useReactiveCache(key, defaultValue);
  const {
    min = Number.MIN_SAFE_INTEGER,
    max = Number.MAX_SAFE_INTEGER
  } = options || {};
  return {
    count: cache.value,
    loading: cache.loading,
    error: cache.error,
    exists: cache.exists,
    // 计数器操作方法
    increment: async (step = 1) => {
      const current = cache.value.value || 0;
      const newValue = Math.min(max, current + step);
      await cache.set(newValue, options?.ttl ? {
        ttl: options.ttl
      } : void 0);
    },
    decrement: async (step = 1) => {
      const current = cache.value.value || 0;
      const newValue = Math.max(min, current - step);
      await cache.set(newValue, options?.ttl ? {
        ttl: options.ttl
      } : void 0);
    },
    reset: async () => {
      await cache.set(defaultValue, options?.ttl ? {
        ttl: options.ttl
      } : void 0);
    },
    set: async (value) => {
      const clampedValue = Math.max(min, Math.min(max, value));
      await cache.set(clampedValue, options?.ttl ? {
        ttl: options.ttl
      } : void 0);
    },
    refresh: cache.refresh,
    // 便捷的计算属性
    isAtMin: vue.computed(() => (cache.value.value || 0) <= min),
    isAtMax: vue.computed(() => (cache.value.value || 0) >= max),
    isZero: vue.computed(() => (cache.value.value || 0) === 0),
    isPositive: vue.computed(() => (cache.value.value || 0) > 0),
    isNegative: vue.computed(() => (cache.value.value || 0) < 0)
  };
}
function useCacheBoolean(key, defaultValue = false, options) {
  const {
    useReactiveCache
  } = useCache.useCache();
  const cache = useReactiveCache(key, defaultValue);
  return {
    value: cache.value,
    loading: cache.loading,
    error: cache.error,
    exists: cache.exists,
    // 布尔值操作方法
    toggle: async () => {
      const current = cache.value.value || false;
      await cache.set(!current, options?.ttl ? {
        ttl: options.ttl
      } : void 0);
    },
    setTrue: async () => {
      await cache.set(true, options?.ttl ? {
        ttl: options.ttl
      } : void 0);
    },
    setFalse: async () => {
      await cache.set(false, options?.ttl ? {
        ttl: options.ttl
      } : void 0);
    },
    refresh: cache.refresh,
    // 便捷的计算属性
    isTrue: vue.computed(() => cache.value.value === true),
    isFalse: vue.computed(() => cache.value.value === false)
  };
}
function useCacheAsync(key, fetcher, options) {
  const {
    useReactiveCache
  } = useCache.useCache();
  const cache = useReactiveCache(key);
  let refreshTimer;
  const fetchData = async (forceRefresh = false) => {
    try {
      if (options?.staleWhileRevalidate && !forceRefresh && cache.value.value !== null) {
        fetcher().then((data2) => {
          cache.set(data2, options?.ttl ? {
            ttl: options.ttl
          } : void 0);
        }).catch(console.error);
        return cache.value.value;
      }
      const data = await fetcher();
      await cache.set(data, options?.ttl ? {
        ttl: options.ttl
      } : void 0);
      return data;
    } catch (error) {
      console.error("Failed to fetch data:", error);
      throw error;
    }
  };
  if (options?.refreshInterval) {
    refreshTimer = window.setInterval(() => {
      fetchData(true).catch(console.error);
    }, options.refreshInterval);
  }
  if (options?.immediate !== false) {
    fetchData().catch(console.error);
  }
  return {
    data: cache.value,
    loading: cache.loading,
    error: cache.error,
    exists: cache.exists,
    // 异步操作方法
    fetch: async () => fetchData(true),
    refresh: async () => fetchData(true),
    // 清理函数
    cleanup: () => {
      if (refreshTimer) {
        clearInterval(refreshTimer);
        refreshTimer = void 0;
      }
    }
  };
}

exports.useCacheAsync = useCacheAsync;
exports.useCacheBoolean = useCacheBoolean;
exports.useCacheCounter = useCacheCounter;
exports.useCacheList = useCacheList;
exports.useCacheObject = useCacheObject;
/*! End of @ldesign/cache | Powered by @ldesign/builder */
//# sourceMappingURL=use-cache-helpers.cjs.map
