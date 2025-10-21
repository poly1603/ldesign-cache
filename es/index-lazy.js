/*!
 * ***********************************
 * @ldesign/cache v0.1.1           *
 * Built with rollup               *
 * Build time: 2024-10-21 14:32:03 *
 * Build mode: production          *
 * Minified: No                    *
 * ***********************************
 */
export { CacheManager } from './core/cache-manager.js';

const lazyModules = {
  // 性能监控 - 按需加载
  async loadPerformanceMonitor() {
    const {
      PerformanceMonitor
    } = await import('./core/performance-monitor.js');
    return {
      PerformanceMonitor
    };
  },
  // 同步管理 - 按需加载
  async loadSyncManager() {
    const {
      SyncManager
    } = await import('./core/sync-manager.js');
    return {
      SyncManager
    };
  },
  // 预热管理 - 按需加载
  async loadWarmupManager() {
    const {
      WarmupManager,
      createWarmupManager
    } = await import('./core/warmup-manager.js');
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
    } = await import('./core/cache-analyzer.js');
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
    } = await import('./core/namespace-manager.js');
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
    }] = await Promise.all([import('./engines/memory-engine.js'), import('./engines/local-storage-engine.js'), import('./engines/session-storage-engine.js'), import('./engines/indexeddb-engine.js'), import('./engines/cookie-engine.js')]);
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
    }] = await Promise.all([import('./security/security-manager.js'), import('./security/aes-crypto.js'), import('./security/key-obfuscator.js')]);
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
    }, evictionStrategies] = await Promise.all([import('./strategies/storage-strategy.js'), import('./strategies/eviction-strategies.js')]);
    return {
      StorageStrategy,
      ...evictionStrategies
    };
  },
  // 工具模块 - 按需加载
  async loadUtils() {
    const utils = await import('./utils/index.js');
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
    }] = await Promise.all([import('./vue/use-cache.js'), import('./vue/use-cache-stats.js'), import('./vue/use-cache-helpers.js'), import('./vue/cache-provider.js')]);
    return {
      useCache,
      useCacheStats,
      ...vueHelpers,
      CacheProvider
    };
  },
  // 预设配置 - 按需加载
  async loadPresets() {
    const presets = await import('./presets.js');
    return presets;
  }
};
async function createLazyCacheManager(options) {
  const {
    CacheManager: CacheManager2
  } = await import('./core/cache-manager.js');
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

export { createLazyCacheManager, lazyModules as default, lazyModules, loadAdvancedModules, loadAllModules, loadCommonModules };
/*! End of @ldesign/cache | Powered by @ldesign/builder */
//# sourceMappingURL=index-lazy.js.map
