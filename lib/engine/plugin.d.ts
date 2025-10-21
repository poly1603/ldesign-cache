import type { CacheOptions } from '../types';
interface Plugin {
    name: string;
    version?: string;
    install?: (app: any, options?: any) => void;
    destroy?: (app: any) => void;
}
export interface CacheEnginePluginOptions extends CacheOptions {
    name?: string;
    version?: string;
    description?: string;
    dependencies?: string[];
    autoInstall?: boolean;
    globalPropertyName?: string;
    registerComposables?: boolean;
    enablePerformanceMonitoring?: boolean;
    debug?: boolean;
    cacheConfig?: CacheOptions;
}
export declare function createCacheEnginePlugin(options?: CacheEnginePluginOptions): Plugin;
export default createCacheEnginePlugin;
//# sourceMappingURL=plugin.d.ts.map