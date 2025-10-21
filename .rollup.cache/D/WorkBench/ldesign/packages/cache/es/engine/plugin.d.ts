/**
 * Cache Engine 插件
 *
 * 将 Cache 功能集成到 LDesign Engine 中，提供统一的缓存管理体验
 */
import type { CacheOptions } from '../types';
interface Plugin {
    name: string;
    version?: string;
    install?: (app: any, options?: any) => void;
    destroy?: (app: any) => void;
}
/**
 * Cache Engine 插件配置选项
 */
export interface CacheEnginePluginOptions extends CacheOptions {
    /** 插件名称 */
    name?: string;
    /** 插件版本 */
    version?: string;
    /** 插件描述 */
    description?: string;
    /** 插件依赖 */
    dependencies?: string[];
    /** 是否自动安装到 Vue 应用 */
    autoInstall?: boolean;
    /** 全局属性名称 */
    globalPropertyName?: string;
    /** 是否注册组合式 API */
    registerComposables?: boolean;
    /** 是否启用性能监控 */
    enablePerformanceMonitoring?: boolean;
    /** 是否启用调试模式 */
    debug?: boolean;
    /** 缓存配置 */
    cacheConfig?: CacheOptions;
}
/**
 * 创建 Cache Engine 插件
 *
 * 将 Cache 功能集成到 LDesign Engine 中，提供统一的缓存管理体验
 *
 * @param options 插件配置选项
 * @returns Engine 插件实例
 *
 * @example
 * ```typescript
 * import { createCacheEnginePlugin } from '@ldesign/cache'
 *
 * const cachePlugin = createCacheEnginePlugin({
 *   cacheConfig: {
 *     defaultEngine: 'localStorage',
 *     enableEncryption: true,
 *     maxSize: 50 * 1024 * 1024 // 50MB
 *   },
 *   globalPropertyName: '$cache',
 *   enablePerformanceMonitoring: true
 * })
 *
 * await engine.use(cachePlugin)
 * ```
 */
export declare function createCacheEnginePlugin(options?: CacheEnginePluginOptions): Plugin;
/**
 * 导出默认插件实例创建函数
 */
export default createCacheEnginePlugin;
