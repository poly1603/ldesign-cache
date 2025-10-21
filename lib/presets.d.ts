import type { CacheOptions } from './types';
import { CacheManager } from './core/cache-manager';
export type CachePreset = 'browser' | 'ssr' | 'node' | 'offline' | 'memory' | 'session';
export declare function getPresetOptions(preset: CachePreset): CacheOptions;
export declare function createBrowserCache(overrides?: Partial<CacheOptions>): CacheManager;
export declare function createSSRCache(overrides?: Partial<CacheOptions>): CacheManager;
export declare function createNodeCache(overrides?: Partial<CacheOptions>): CacheManager;
export declare function createOfflineCache(overrides?: Partial<CacheOptions>): CacheManager;
//# sourceMappingURL=presets.d.ts.map