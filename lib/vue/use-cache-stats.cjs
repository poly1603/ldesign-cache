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
var index = require('../utils/index.cjs');
var cacheProvider = require('./cache-provider.cjs');

function useCacheStats(options) {
  const cacheManager = cacheProvider.useCacheManager();
  const stats = vue.ref(null);
  const loading = vue.ref(false);
  const error = vue.ref(null);
  let refreshTimer;
  const loadStats = async () => {
    loading.value = true;
    error.value = null;
    try {
      stats.value = await cacheManager.getStats();
    } catch (err) {
      error.value = err;
      console.error("Failed to load cache stats:", err);
    } finally {
      loading.value = false;
    }
  };
  const startAutoRefresh = (interval) => {
    if (refreshTimer) {
      clearInterval(refreshTimer);
    }
    refreshTimer = window.setInterval(() => {
      loadStats().catch(console.error);
    }, interval);
  };
  const stopAutoRefresh = () => {
    if (refreshTimer) {
      clearInterval(refreshTimer);
      refreshTimer = void 0;
    }
  };
  const formattedStats = vue.computed(() => {
    if (!stats.value) {
      return null;
    }
    return {
      ...stats.value,
      totalSizeFormatted: index.formatBytes(stats.value.totalSize),
      hitRatePercentage: (stats.value.hitRate * 100).toFixed(2),
      engines: Object.fromEntries(Object.entries(stats.value.engines).map(([engine, engineStats]) => [engine, {
        ...engineStats,
        sizeFormatted: index.formatBytes(engineStats.size),
        hitRate: engineStats.hits + engineStats.misses > 0 ? (engineStats.hits / (engineStats.hits + engineStats.misses) * 100).toFixed(2) : "0.00"
      }]))
    };
  });
  const engineUsage = vue.computed(() => {
    if (!stats.value) {
      return [];
    }
    return Object.entries(stats.value.engines).map(([engine, engineStats]) => ({
      engine,
      itemCount: engineStats.itemCount,
      size: engineStats.size,
      sizeFormatted: index.formatBytes(engineStats.size),
      available: engineStats.available,
      usage: stats.value.totalSize > 0 ? (engineStats.size / stats.value.totalSize * 100).toFixed(2) : "0.00"
    }));
  });
  const performanceMetrics = vue.computed(() => {
    if (!stats.value) {
      return null;
    }
    const totalRequests = Object.values(stats.value.engines).reduce((sum, engine) => sum + engine.hits + engine.misses, 0);
    return {
      totalRequests,
      hitRate: stats.value.hitRate,
      hitRatePercentage: (stats.value.hitRate * 100).toFixed(2),
      missRate: 1 - stats.value.hitRate,
      missRatePercentage: ((1 - stats.value.hitRate) * 100).toFixed(2),
      averageItemSize: stats.value.totalItems > 0 ? index.formatBytes(stats.value.totalSize / stats.value.totalItems) : "0 Bytes"
    };
  });
  const refresh = async () => {
    return loadStats();
  };
  const cleanupAndRefresh = async () => {
    loading.value = true;
    error.value = null;
    try {
      await cacheManager.cleanup();
      await loadStats();
    } catch (err) {
      error.value = err;
      throw err;
    } finally {
      loading.value = false;
    }
  };
  vue.onMounted(() => {
    if (options?.immediate !== false) {
      loadStats().catch(console.error);
    }
    if (options?.refreshInterval && options.refreshInterval > 0) {
      startAutoRefresh(options.refreshInterval);
    }
  });
  vue.onUnmounted(() => {
    stopAutoRefresh();
  });
  return {
    // 原始统计数据
    stats: vue.computed(() => stats.value),
    // 格式化统计数据
    formattedStats,
    // 引擎使用情况
    engineUsage,
    // 性能指标
    performanceMetrics,
    // 状态
    loading: vue.computed(() => loading.value),
    error: vue.computed(() => error.value),
    // 方法
    refresh,
    cleanupAndRefresh,
    startAutoRefresh,
    stopAutoRefresh,
    // 缓存管理器实例
    manager: cacheManager
  };
}

exports.useCacheStats = useCacheStats;
/*! End of @ldesign/cache | Powered by @ldesign/builder */
//# sourceMappingURL=use-cache-stats.cjs.map
