import type { CacheOptions } from '../types';
import { type InjectionKey, type PropType } from 'vue';
import { CacheManager } from '../core/cache-manager';
export declare const CACHE_MANAGER_KEY: InjectionKey<CacheManager>;
export interface CacheProviderProps {
    options?: CacheOptions;
}
export declare const CacheProvider: import("vue").DefineComponent<import("vue").ExtractPropTypes<{
    options: {
        type: PropType<CacheOptions>;
        default: () => {};
    };
}>, () => import("vue").VNode<import("vue").RendererNode, import("vue").RendererElement, {
    [key: string]: any;
}>[], {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<import("vue").ExtractPropTypes<{
    options: {
        type: PropType<CacheOptions>;
        default: () => {};
    };
}>> & Readonly<{}>, {
    options: CacheOptions;
}, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
export declare function useCacheManager(): CacheManager;
export declare function provideCacheManager(options?: CacheOptions): CacheManager;
//# sourceMappingURL=cache-provider.d.ts.map