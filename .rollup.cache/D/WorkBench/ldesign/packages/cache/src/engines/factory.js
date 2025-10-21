import { CookieEngine } from './cookie-engine';
import { IndexedDBEngine } from './indexeddb-engine';
import { LocalStorageEngine } from './local-storage-engine';
import { MemoryEngine } from './memory-engine';
import { SessionStorageEngine } from './session-storage-engine';
/**
 * 存储引擎工厂
 */
export class StorageEngineFactory {
    /**
     * 创建存储引擎实例
     */
    static async create(type, config) {
        switch (type) {
            case 'localStorage':
                return new LocalStorageEngine(config);
            case 'sessionStorage':
                return new SessionStorageEngine(config);
            case 'cookie':
                return new CookieEngine(config);
            case 'indexedDB':
                return IndexedDBEngine.create(config);
            case 'memory':
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
                case 'localStorage':
                    return (typeof window !== 'undefined'
                        && 'localStorage' in window
                        && window.localStorage !== null);
                case 'sessionStorage':
                    return (typeof window !== 'undefined'
                        && 'sessionStorage' in window
                        && window.sessionStorage !== null);
                case 'cookie':
                    return typeof document !== 'undefined' && 'cookie' in document;
                case 'indexedDB':
                    return (typeof window !== 'undefined'
                        && 'indexedDB' in window
                        && window.indexedDB !== null);
                case 'memory':
                    return true;
                default:
                    return false;
            }
        }
        catch {
            return false;
        }
    }
    /**
     * 获取所有可用的存储引擎
     */
    static getAvailableEngines() {
        const engines = [
            'localStorage',
            'sessionStorage',
            'cookie',
            'indexedDB',
            'memory',
        ];
        return engines.filter(engine => this.isAvailable(engine));
    }
    /**
     * 获取推荐的存储引擎
     */
    static getRecommendedEngine() {
        const available = this.getAvailableEngines();
        // 优先级：localStorage > sessionStorage > indexedDB > memory > cookie
        const priority = [
            'localStorage',
            'sessionStorage',
            'indexedDB',
            'memory',
            'cookie',
        ];
        for (const engine of priority) {
            if (available.includes(engine)) {
                return engine;
            }
        }
        return 'memory'; // 最后的回退选项
    }
}
//# sourceMappingURL=factory.js.map