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

Object.defineProperty(exports, '__esModule', { value: true });

var cacheManager = require('./core/cache-manager.cjs');

const lazyModules = {
  // 性能监控 - 按需加载
  async loadPerformanceMonitor() {
    const {
      PerformanceMonitor
    } = await Promise.resolve().then(function () { return require('./core/performance-monitor.cjs'); });
    return {
      PerformanceMonitor
    };
  },
  // 同步管理 - 按需加载
  async loadSyncManager() {
    const {
      SyncManager
    } = await Promise.resolve().then(function () { return require('./core/sync-manager.cjs'); });
    return {
      SyncManager
    };
  },
  // 预热管理 - 按需加载
  async loadWarmupManager() {
    const {
      WarmupManager,
      createWarmupManager
    } = await Promise.resolve().then(function () { return require('./core/warmup-manager.cjs'); });
    return {
      WarmupManager,
      createWarmupManager
    };
  },
  // 缓存分析 - 按需加载
  async loadCacheAnalyzer() {
    const {
      CacheAnalyzer,
      createCacheAnalyzer
    } = await Promise.resolve().then(function () { return require('./core/cache-analyzer.cjs'); });
    return {
      CacheAnalyzer,
      createCacheAnalyzer
    };
  },
  // 命名空间管理 - 按需加载
  async loadNamespaceManager() {
    const {
      CacheNamespace,
      createNamespace
    } = await Promise.resolve().then(function () { return require('./core/namespace-manager.cjs'); });
    return {
      CacheNamespace,
      createNamespace
    };
  },
  // 存储引擎 - 按需加载
  async loadEngines() {
    const [{
      MemoryEngine
    }, {
      LocalStorageEngine
    }, {
      SessionStorageEngine
    }, {
      IndexedDBEngine
    }, {
      CookieEngine
    }] = await Promise.all([Promise.resolve().then(function () { return require('./engines/memory-engine.cjs'); }), Promise.resolve().then(function () { return require('./engines/local-storage-engine.cjs'); }), Promise.resolve().then(function () { return require('./engines/session-storage-engine.cjs'); }), Promise.resolve().then(function () { return require('./engines/indexeddb-engine.cjs'); }), Promise.resolve().then(function () { return require('./engines/cookie-engine.cjs'); })]);
    return {
      MemoryEngine,
      LocalStorageEngine,
      SessionStorageEngine,
      IndexedDBEngine,
      CookieEngine
    };
  },
  // 安全模块 - 按需加载
  async loadSecurity() {
    const [{
      SecurityManager
    }, {
      AESCrypto
    }, {
      KeyObfuscator
    }] = await Promise.all([Promise.resolve().then(function () { return require('./security/security-manager.cjs'); }), Promise.resolve().then(function () { return require('./security/aes-crypto.cjs'); }), Promise.resolve().then(function () { return require('./security/key-obfuscator.cjs'); })]);
    return {
      SecurityManager,
      AESCrypto,
      KeyObfuscator
    };
  },
  // 策略模块 - 按需加载
  async loadStrategies() {
    const [{
      StorageStrategy
    }, evictionStrategies] = await Promise.all([Promise.resolve().then(function () { return require('./strategies/storage-strategy.cjs'); }), Promise.resolve().then(function () { return require('./strategies/eviction-strategies.cjs'); })]);
    return {
      StorageStrategy,
      ...evictionStrategies
    };
  },
  // 工具模块 - 按需加载
  async loadUtils() {
    const utils = await Promise.resolve().then(function () { return require('./utils/index.cjs'); });
    return utils;
  },
  // Vue 集成 - 按需加载
  async loadVue() {
    const [{
      useCache
    }, {
      useCacheStats
    }, vueHelpers, {
      CacheProvider
    }] = await Promise.all([Promise.resolve().then(function () { return require('./vue/use-cache.cjs'); }), Promise.resolve().then(function () { return require('./vue/use-cache-stats.cjs'); }), Promise.resolve().then(function () { return require('./vue/use-cache-helpers.cjs'); }), Promise.resolve().then(function () { return require('./vue/cache-provider.cjs'); })]);
    return {
      useCache,
      useCacheStats,
      ...vueHelpers,
      CacheProvider
    };
  },
  // 预设配置 - 按需加载
  async loadPresets() {
    const presets = await Promise.resolve().then(function () { return require('./presets.cjs'); });
    return presets;
  }
};
async function createLazyCacheManager(options) {
  const {
    CacheManager: CacheManager2
  } = await Promise.resolve().then(function () { return require('./core/cache-manager.cjs'); });
  return new CacheManager2(options);
}
async function loadCommonModules() {
  const [engines, utils] = await Promise.all([lazyModules.loadEngines(), lazyModules.loadUtils()]);
  return {
    ...engines,
    ...utils
  };
}
async function loadAdvancedModules() {
  const [performanceMonitor, syncManager, warmupManager, cacheAnalyzer] = await Promise.all([lazyModules.loadPerformanceMonitor(), lazyModules.loadSyncManager(), lazyModules.loadWarmupManager(), lazyModules.loadCacheAnalyzer()]);
  return {
    ...performanceMonitor,
    ...syncManager,
    ...warmupManager,
    ...cacheAnalyzer
  };
}
async function loadAllModules() {
  const [engines, security, strategies, utils, vue, presets, advanced] = await Promise.all([lazyModules.loadEngines(), lazyModules.loadSecurity(), lazyModules.loadStrategies(), lazyModules.loadUtils(), lazyModules.loadVue(), lazyModules.loadPresets(), loadAdvancedModules()]);
  return {
    ...engines,
    ...security,
    ...strategies,
    ...utils,
    ...vue,
    ...presets,
    ...advanced
  };
}

exports.CacheManager = cacheManager.CacheManager;
exports.createLazyCacheManager = createLazyCacheManager;
exports.default = lazyModules;
exports.lazyModules = lazyModules;
exports.loadAdvancedModules = loadAdvancedModules;
exports.loadAllModules = loadAllModules;
exports.loadCommonModules = loadCommonModules;
/*! End of @ldesign/cache | Powered by @ldesign/builder */
//# sourceMappingURL=index-lazy.cjs.map
