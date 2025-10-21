/*!
 * ***********************************
 * @ldesign/cache v0.1.1           *
 * Built with rollup               *
 * Build time: 2024-10-21 14:32:03 *
 * Build mode: production          *
 * Minified: No                    *
 * ***********************************
 */
import { CookieEngine } from './cookie-engine.js';
import { IndexedDBEngine } from './indexeddb-engine.js';
import { LocalStorageEngine } from './local-storage-engine.js';
import { MemoryEngine } from './memory-engine.js';
import { SessionStorageEngine } from './session-storage-engine.js';

class StorageEngineFactory {
  /**
   * 创建存储引擎实例
   */
  static async create(type, config) {
    switch (type) {
      case "localStorage":
        return new LocalStorageEngine(config);
      case "sessionStorage":
        return new SessionStorageEngine(config);
      case "cookie":
        return new CookieEngine(config);
      case "indexedDB":
        return IndexedDBEngine.create(config);
      case "memory":
        return new MemoryEngine(config);
      default:
        throw new Error(`Unsupported storage engine: ${type}`);
    }
  }
  /**
   * 检查存储引擎是否可用
   */
  static isAvailable(type) {
    try {
      switch (type) {
        case "localStorage":
          return typeof window !== "undefined" && "localStorage" in window && window.localStorage !== null;
        case "sessionStorage":
          return typeof window !== "undefined" && "sessionStorage" in window && window.sessionStorage !== null;
        case "cookie":
          return typeof document !== "undefined" && "cookie" in document;
        case "indexedDB":
          return typeof window !== "undefined" && "indexedDB" in window && window.indexedDB !== null;
        case "memory":
          return true;
        default:
          return false;
      }
    } catch {
      return false;
    }
  }
  /**
   * 获取所有可用的存储引擎
   */
  static getAvailableEngines() {
    const engines = ["localStorage", "sessionStorage", "cookie", "indexedDB", "memory"];
    return engines.filter((engine) => this.isAvailable(engine));
  }
  /**
   * 获取推荐的存储引擎
   */
  static getRecommendedEngine() {
    const available = this.getAvailableEngines();
    const priority = ["localStorage", "sessionStorage", "indexedDB", "memory", "cookie"];
    for (const engine of priority) {
      if (available.includes(engine)) {
        return engine;
      }
    }
    return "memory";
  }
}

export { StorageEngineFactory };
/*! End of @ldesign/cache | Powered by @ldesign/builder */
//# sourceMappingURL=factory.js.map
