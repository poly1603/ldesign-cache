import type { CacheOptions } from './types';
import { CacheManager } from './core/cache-manager';
/**
 * 所有支持的缓存预设类型
 */
export type CachePreset = 'browser' | 'ssr' | 'node' | 'offline' | 'memory' | 'session';
/**
 * 获取预设配置选项
 *
 * @param preset - 预设类型
 * @returns 缓存配置选项
 */
export declare function getPresetOptions(preset: CachePreset): CacheOptions;
export declare function createBrowserCache(overrides?: Partial<CacheOptions>): CacheManager;
export declare function createSSRCache(overrides?: Partial<CacheOptions>): CacheManager;
export declare function createNodeCache(overrides?: Partial<CacheOptions>): CacheManager;
export declare function createOfflineCache(overrides?: Partial<CacheOptions>): CacheManager;
