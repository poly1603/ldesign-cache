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

var cacheManager = require('../core/cache-manager.cjs');
var factory = require('../engines/factory.cjs');
var cacheProvider = require('../vue/cache-provider.cjs');

const defaultConfig = {
  name: "cache",
  version: "1.0.0",
  description: "LDesign Cache Engine Plugin",
  dependencies: [],
  autoInstall: true,
  globalPropertyName: "$cache",
  registerComposables: true,
  enablePerformanceMonitoring: false,
  debug: false,
  cacheConfig: {
    defaultEngine: "localStorage",
    defaultTTL: 24 * 60 * 60 * 1e3,
    // 24小时
    security: {
      encryption: {
        enabled: false
      },
      obfuscation: {
        enabled: false
      }
    },
    engines: {
      memory: {
        maxSize: 10 * 1024 * 1024
      }
      // 10MB
    }
  }
};
function createGlobalCacheInstance(options) {
  const cacheManager$1 = new cacheManager.CacheManager(options?.cacheConfig || defaultConfig.cacheConfig);
  return {
    // 核心功能
    manager: cacheManager$1,
    // 便捷方法
    get: cacheManager$1.get.bind(cacheManager$1),
    set: cacheManager$1.set.bind(cacheManager$1),
    delete: cacheManager$1.remove.bind(cacheManager$1),
    clear: cacheManager$1.clear.bind(cacheManager$1),
    has: cacheManager$1.has.bind(cacheManager$1),
    keys: cacheManager$1.keys.bind(cacheManager$1),
    size: async () => (await cacheManager$1.getStats()).totalItems,
    // 工厂方法
    factory: factory.StorageEngineFactory,
    // 配置
    config: options?.cacheConfig || defaultConfig.cacheConfig
  };
}
function createCacheEnginePlugin(options = {}) {
  const config = {
    ...defaultConfig,
    ...options
  };
  const {
    name = "cache",
    version = "1.0.0",
    autoInstall = true,
    enablePerformanceMonitoring = false,
    debug = false
  } = config;
  if (debug) {
    console.warn("[Cache Plugin] createCacheEnginePlugin called with options:", options);
  }
  return {
    name,
    version,
    async install(context) {
      try {
        if (debug) {
          console.warn("[Cache Plugin] install method called with context:", context);
        }
        const engine = context.engine || context;
        if (debug) {
          console.warn("[Cache Plugin] engine instance:", !!engine);
        }
        const performInstall = async () => {
          engine.logger?.info("[Cache Plugin] performInstall called");
          const vueApp2 = engine.getApp();
          if (!vueApp2) {
            throw new Error("Vue app not found. Make sure the engine has created a Vue app before installing cache plugin.");
          }
          engine.logger?.info("[Cache Plugin] Vue app found, proceeding with installation");
          engine.logger?.info(`Installing ${name} plugin...`, {
            version,
            enablePerformanceMonitoring
          });
          const globalCache = createGlobalCacheInstance(config);
          if (engine.state) {
            engine.state.set("cache:instance", globalCache);
            engine.state.set("cache:config", config.cacheConfig);
            engine.state.set("cache:manager", globalCache.manager);
          }
          if (autoInstall) {
            vueApp2.provide(cacheProvider.CACHE_MANAGER_KEY, globalCache.manager);
            if (config.globalPropertyName) {
              ;
              vueApp2.config.globalProperties[config.globalPropertyName] = globalCache;
            }
            vueApp2.component("CacheProvider", cacheProvider.CacheProvider);
            if (debug) {
              console.warn("[Cache Plugin] Vue integration installed successfully");
            }
          } else {
            vueApp2.provide("cache", globalCache);
            vueApp2.provide("cacheConfig", config.cacheConfig);
            vueApp2.provide("cacheManager", globalCache.manager);
          }
          if (enablePerformanceMonitoring) {
            engine.logger?.info("[Cache Plugin] Performance monitoring enabled");
          }
          engine.logger?.info(`${name} plugin installed successfully`, {
            version,
            globalPropertyName: config.globalPropertyName,
            autoInstall
          });
          if (debug) {
            console.warn("[Cache Plugin] Installation completed successfully");
          }
        };
        const vueApp = engine.getApp();
        if (!vueApp) {
          engine.logger?.info("[Cache Plugin] Vue app not found, registering event listener");
          await new Promise((resolve, reject) => {
            engine.events?.once("app:created", async () => {
              try {
                engine.logger?.info("[Cache Plugin] app:created event received, installing now");
                await performInstall();
                resolve();
              } catch (error) {
                engine.logger?.error("[Cache Plugin] Failed to install after app creation:", error);
                reject(error);
              }
            });
          });
        } else {
          await performInstall();
        }
      } catch (error) {
        const errorMessage = `Failed to install ${name} plugin: ${error instanceof Error ? error.message : String(error)}`;
        if (debug) {
          console.error("[Cache Plugin] Installation failed:", error);
        }
        const engine = context.engine || context;
        engine.logger?.error(errorMessage, {
          error
        });
        throw new Error(errorMessage);
      }
    },
    // 卸载方法（可选）
    destroy(context) {
      try {
        if (debug) {
          console.warn("[Cache Plugin] destroy method called");
        }
        const engine = context.engine || context;
        if (engine.state) {
          engine.state.delete("cache:instance");
          engine.state.delete("cache:config");
          engine.state.delete("cache:manager");
        }
        engine.logger?.info(`${name} plugin uninstalled successfully`);
        if (debug) {
          console.warn("[Cache Plugin] Uninstallation completed successfully");
        }
      } catch (error) {
        const errorMessage = `Failed to uninstall ${name} plugin: ${error instanceof Error ? error.message : String(error)}`;
        if (debug) {
          console.error("[Cache Plugin] Uninstallation failed:", error);
        }
        const engine = context.engine || context;
        engine.logger?.error(errorMessage, {
          error
        });
        throw new Error(errorMessage);
      }
    }
  };
}

exports.createCacheEnginePlugin = createCacheEnginePlugin;
exports.default = createCacheEnginePlugin;
/*! End of @ldesign/cache | Powered by @ldesign/builder */
//# sourceMappingURL=plugin.cjs.map
