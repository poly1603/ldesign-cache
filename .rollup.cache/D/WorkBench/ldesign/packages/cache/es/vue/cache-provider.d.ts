import type { CacheOptions } from '../types';
import { type InjectionKey, type PropType } from 'vue';
import { CacheManager } from '../core/cache-manager';
export declare const CACHE_MANAGER_KEY: InjectionKey<CacheManager>;
/**
 * 缓存提供者组件属性
 */
export interface CacheProviderProps {
    options?: CacheOptions;
}
/**
 * 缓存提供者组件
 */
export declare const CacheProvider: import("vue").DefineComponent<import("vue").ExtractPropTypes<{
    options: {
        type: PropType<CacheOptions>;
        default: () => {};
    };
}>, () => import("vue").VNode<import("vue").RendererNode, import("vue").RendererElement, {
    [key: string]: any;
}>[] | undefined, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<import("vue").ExtractPropTypes<{
    options: {
        type: PropType<CacheOptions>;
        default: () => {};
    };
}>> & Readonly<{}>, {
    options: CacheOptions;
}, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
/**
 * 注入缓存管理器
 */
export declare function useCacheManager(): CacheManager;
/**
 * 缓存管理器提供者 Hook
 */
export declare function provideCacheManager(options?: CacheOptions): CacheManager;
