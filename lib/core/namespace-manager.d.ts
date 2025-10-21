import type { CacheOptions, SerializableValue, SetOptions } from '../types';
export interface NamespaceOptions extends CacheOptions {
    name: string;
    parent?: CacheNamespace;
    inheritConfig?: boolean;
}
export declare class CacheNamespace {
    private options;
    private readonly manager;
    private readonly children;
    private readonly prefix;
    constructor(options: NamespaceOptions);
    getPrefix(): string;
    namespace(name: string, options?: Partial<NamespaceOptions>): CacheNamespace;
    set<T extends SerializableValue = SerializableValue>(key: string, value: T, options?: SetOptions): Promise<void>;
    get<T extends SerializableValue = SerializableValue>(key: string): Promise<T | null>;
    remove(key: string): Promise<void>;
    has(key: string): Promise<boolean>;
    getMetadata(key: string): Promise<any>;
    clear(includeChildren?: boolean): Promise<void>;
    keys(includeChildren?: boolean): Promise<string[]>;
    mset<T extends SerializableValue = SerializableValue>(items: Array<{
        key: string;
        value: T;
        options?: SetOptions;
    }> | Record<string, T>, options?: SetOptions): Promise<{
        success: string[];
        failed: Array<{
            key: string;
            error: Error;
        }>;
    }>;
    mget<T extends SerializableValue = SerializableValue>(keys: string[]): Promise<Record<string, T | null>>;
    mremove(keys: string[] | string): Promise<{
        success: string[];
        failed: Array<{
            key: string;
            error: Error;
        }>;
    }>;
    remember<T extends SerializableValue = SerializableValue>(key: string, fetcher: () => Promise<T> | T, options?: SetOptions & {
        refresh?: boolean;
    }): Promise<T>;
    getStats(includeChildren?: boolean): Promise<{
        namespace: string;
        stats: any;
        children?: Record<string, any>;
    }>;
    destroy(includeChildren?: boolean): Promise<void>;
    getChild(name: string): CacheNamespace | undefined;
    getChildren(): Map<string, CacheNamespace>;
    export(filter?: (key: string) => boolean): Promise<Array<{
        key: string;
        value: any;
    }>>;
    exportFull(includeChildren?: boolean): Promise<{
        namespace: string;
        data: Record<string, any>;
        children?: Record<string, any>;
    }>;
    import(data: Array<{
        key: string;
        value: any;
    }> | {
        data?: Record<string, any>;
        children?: Record<string, any>;
    }, options?: {
        transform?: (item: {
            key: string;
            value: any;
        }) => {
            key: string;
            value: any;
        };
    }): Promise<void>;
}
export declare function createNamespace(name: string, options?: Partial<CacheOptions>): CacheNamespace;
//# sourceMappingURL=namespace-manager.d.ts.map