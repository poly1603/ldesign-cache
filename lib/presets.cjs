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

var cacheManager = require('./core/cache-manager.cjs');

const PRESET_CONFIG_MAP = {
  // 浏览器环境预设 - 使用localStorage作为主存储
  browser: {
    defaultEngine: "localStorage",
    debug: false,
    engines: {
      memory: {
        enabled: true
      },
      localStorage: {
        enabled: true
      }
    },
    strategy: {
      enabled: true,
      enginePriority: ["localStorage", "sessionStorage", "indexedDB", "memory", "cookie"],
      sizeThresholds: {
        small: 8 * 1024,
        medium: 64 * 1024,
        large: 512 * 1024
      },
      ttlThresholds: {
        short: 6e4,
        medium: 36e5,
        long: 864e5
      }
    },
    cleanupInterval: 6e4
  },
  // SSR环境预设 - 仅使用内存存储
  ssr: {
    defaultEngine: "memory",
    debug: false,
    strategy: {
      enabled: false
    },
    cleanupInterval: 0
  },
  // Node.js环境预设 - 仅使用内存存储
  node: {
    defaultEngine: "memory",
    debug: false,
    strategy: {
      enabled: false
    },
    cleanupInterval: 6e4
  },
  // 离线优先预设 - 使用IndexedDB作为主存储
  offline: {
    defaultEngine: "indexedDB",
    debug: false,
    strategy: {
      enabled: true,
      enginePriority: ["indexedDB", "localStorage", "sessionStorage", "memory", "cookie"],
      sizeThresholds: {
        small: 16 * 1024,
        medium: 128 * 1024,
        large: 1024 * 1024
      },
      ttlThresholds: {
        short: 5 * 6e4,
        medium: 12 * 6e4,
        long: 7 * 24 * 6e4
      }
    },
    cleanupInterval: 12e4
  },
  // 纯内存预设 - 仅使用内存存储（最快）
  memory: {
    defaultEngine: "memory",
    engines: {
      memory: {
        enabled: true
      }
    },
    strategy: {
      enabled: false
    },
    cleanupInterval: 3e4
  },
  // 会话存储预设 - 使用sessionStorage
  session: {
    defaultEngine: "sessionStorage",
    engines: {
      memory: {
        enabled: true
      },
      sessionStorage: {
        enabled: true
      }
    },
    strategy: {
      enabled: false
    },
    cleanupInterval: 6e4
  }
};
function getPresetOptions(preset) {
  const config = PRESET_CONFIG_MAP[preset];
  if (!config) {
    throw new Error(`Unknown preset: ${preset}`);
  }
  return JSON.parse(JSON.stringify(config));
}
function createBrowserCache(overrides) {
  return new cacheManager.CacheManager({
    ...getPresetOptions("browser"),
    ...overrides
  });
}
function createSSRCache(overrides) {
  return new cacheManager.CacheManager({
    ...getPresetOptions("ssr"),
    ...overrides
  });
}
function createNodeCache(overrides) {
  return new cacheManager.CacheManager({
    ...getPresetOptions("node"),
    ...overrides
  });
}
function createOfflineCache(overrides) {
  return new cacheManager.CacheManager({
    ...getPresetOptions("offline"),
    ...overrides
  });
}

exports.createBrowserCache = createBrowserCache;
exports.createNodeCache = createNodeCache;
exports.createOfflineCache = createOfflineCache;
exports.createSSRCache = createSSRCache;
exports.getPresetOptions = getPresetOptions;
/*! End of @ldesign/cache | Powered by @ldesign/builder */
//# sourceMappingURL=presets.cjs.map
