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

const PERFORMANCE_PRESETS = {
  /**
   * 低性能模式 - 最小化内存使用和CPU开销
   * 适用于资源受限的环境
   */
  low: {
    serializationCache: {
      maxSize: 100,
      ttl: 3e3,
      enableStats: false
    },
    eventThrottle: {
      batchSize: 20,
      flushInterval: 200,
      enabled: true
    },
    batchOptimization: true,
    memoryOptimization: true,
    performanceMonitoring: false
  },
  /**
   * 平衡模式 - 性能和资源使用的平衡
   * 适用于大多数应用场景（默认）
   */
  balanced: {
    serializationCache: {
      maxSize: 500,
      ttl: 5e3,
      enableStats: true
    },
    eventThrottle: {
      batchSize: 10,
      flushInterval: 100,
      enabled: true
    },
    batchOptimization: true,
    memoryOptimization: true,
    performanceMonitoring: true
  },
  /**
   * 高性能模式 - 优先考虑性能
   * 适用于性能关键型应用
   */
  high: {
    serializationCache: {
      maxSize: 1e3,
      ttl: 1e4,
      enableStats: true
    },
    eventThrottle: {
      batchSize: 5,
      flushInterval: 50,
      enabled: true
    },
    batchOptimization: true,
    memoryOptimization: true,
    performanceMonitoring: true
  },
  /**
   * 极致性能模式 - 最大化性能，不考虑资源开销
   * 适用于高性能计算场景
   */
  extreme: {
    serializationCache: {
      maxSize: 5e3,
      ttl: 3e4,
      enableStats: true
    },
    eventThrottle: {
      batchSize: 1,
      flushInterval: 10,
      enabled: true
    },
    batchOptimization: true,
    memoryOptimization: false,
    // 极致性能下不限制内存
    performanceMonitoring: true
  }
};
const DEFAULT_PERFORMANCE_CONFIG = PERFORMANCE_PRESETS.balanced;
class PerformanceConfigManager {
  constructor(config) {
    Object.defineProperty(this, "config", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    if (typeof config === "string") {
      this.config = {
        ...PERFORMANCE_PRESETS[config]
      };
    } else if (config) {
      this.config = {
        ...DEFAULT_PERFORMANCE_CONFIG,
        ...config
      };
    } else {
      this.config = {
        ...DEFAULT_PERFORMANCE_CONFIG
      };
    }
  }
  /**
   * 获取当前配置
   */
  getConfig() {
    return {
      ...this.config
    };
  }
  /**
   * 更新配置
   */
  updateConfig(config) {
    this.config = {
      ...this.config,
      ...config
    };
  }
  /**
   * 应用预设
   */
  applyPreset(preset) {
    this.config = {
      ...PERFORMANCE_PRESETS[preset]
    };
  }
  /**
   * 重置为默认配置
   */
  reset() {
    this.config = {
      ...DEFAULT_PERFORMANCE_CONFIG
    };
  }
  /**
   * 获取序列化缓存配置
   */
  getSerializationCacheConfig() {
    return this.config?.serializationCache;
  }
  /**
   * 获取事件节流配置
   */
  getEventThrottleConfig() {
    return this.config?.eventThrottle;
  }
  /**
   * 检查是否启用批量操作优化
   */
  isBatchOptimizationEnabled() {
    return this.config?.batchOptimization ?? true;
  }
  /**
   * 检查是否启用内存优化
   */
  isMemoryOptimizationEnabled() {
    return this.config?.memoryOptimization ?? true;
  }
  /**
   * 检查是否启用性能监控
   */
  isPerformanceMonitoringEnabled() {
    return this.config?.performanceMonitoring ?? true;
  }
  /**
   * 根据环境自动选择预设
   */
  autoSelectPreset() {
    const isBrowser = typeof window !== "undefined";
    const isNode = typeof globalThis !== "undefined" && typeof globalThis.process?.versions === "object";
    if (isBrowser) {
      const memory = performance.memory;
      if (memory) {
        const usedMemoryPercent = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
        if (usedMemoryPercent > 0.8) {
          return "low";
        }
      }
      const cores = navigator.hardwareConcurrency || 1;
      if (cores >= 8) {
        return "high";
      } else if (cores >= 4) {
        return "balanced";
      } else {
        return "low";
      }
    } else if (isNode) {
      try {
        const os = globalThis.require?.("node:os");
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        const cpuCount = os.cpus().length;
        const memoryUsage = 1 - freeMemory / totalMemory;
        if (cpuCount >= 8 && memoryUsage < 0.7) {
          return "extreme";
        } else if (cpuCount >= 4 && memoryUsage < 0.8) {
          return "high";
        } else if (cpuCount >= 2) {
          return "balanced";
        } else {
          return "low";
        }
      } catch {
        return "balanced";
      }
    }
    return "balanced";
  }
  /**
   * 导出配置为JSON
   */
  toJSON() {
    return JSON.stringify(this.config, null, 2);
  }
  /**
   * 从JSON加载配置
   */
  fromJSON(json) {
    try {
      const config = JSON.parse(json);
      this.config = {
        ...DEFAULT_PERFORMANCE_CONFIG,
        ...config
      };
    } catch (error) {
      console.error("Failed to load performance config from JSON:", error);
    }
  }
}
function createPerformanceConfig(config) {
  return new PerformanceConfigManager(config);
}
const globalPerformanceConfig = createPerformanceConfig();
function getPerformanceConfig() {
  return globalPerformanceConfig.getConfig();
}
function updatePerformanceConfig(config) {
  globalPerformanceConfig.updateConfig(config);
}
function applyPerformancePreset(preset) {
  globalPerformanceConfig.applyPreset(preset);
}
function autoConfigurePerformance() {
  const preset = globalPerformanceConfig.autoSelectPreset();
  globalPerformanceConfig.applyPreset(preset);
  return preset;
}

exports.DEFAULT_PERFORMANCE_CONFIG = DEFAULT_PERFORMANCE_CONFIG;
exports.PERFORMANCE_PRESETS = PERFORMANCE_PRESETS;
exports.PerformanceConfigManager = PerformanceConfigManager;
exports.applyPerformancePreset = applyPerformancePreset;
exports.autoConfigurePerformance = autoConfigurePerformance;
exports.createPerformanceConfig = createPerformanceConfig;
exports.getPerformanceConfig = getPerformanceConfig;
exports.globalPerformanceConfig = globalPerformanceConfig;
exports.updatePerformanceConfig = updatePerformanceConfig;
/*! End of @ldesign/cache | Powered by @ldesign/builder */
//# sourceMappingURL=performance-config.cjs.map
