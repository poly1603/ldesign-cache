import type { CacheOptions, SerializableValue, SetOptions } from '../types';
/**
 * 命名空间配置
 */
export interface NamespaceOptions extends CacheOptions {
    /** 命名空间名称 */
    name: string;
    /** 父命名空间 */
    parent?: CacheNamespace;
    /** 子命名空间自动继承父配置 */
    inheritConfig?: boolean;
}
/**
 * 缓存命名空间
 *
 * 提供隔离的缓存空间，支持层级结构和批量操作
 */
export declare class CacheNamespace {
    private options;
    private readonly manager;
    private readonly children;
    private readonly prefix;
    constructor(options: NamespaceOptions);
    /**
     * 获取完整前缀
     */
    getPrefix(): string;
    /**
     * 创建子命名空间
     *
     * @param name - 子命名空间名称
     * @param options - 配置选项
     * @returns 子命名空间实例
     *
     * @example
     * ```typescript
     * const userNs = rootNs.namespace('user')
     * const profileNs = userNs.namespace('profile')
     * // 键会自动加前缀: root:user:profile:key
     * ```
     */
    namespace(name: string, options?: Partial<NamespaceOptions>): CacheNamespace;
    /**
     * 设置缓存
     */
    set<T extends SerializableValue = SerializableValue>(key: string, value: T, options?: SetOptions): Promise<void>;
    /**
     * 获取缓存
     */
    get<T extends SerializableValue = SerializableValue>(key: string): Promise<T | null>;
    /**
     * 删除缓存
     */
    remove(key: string): Promise<void>;
    /**
     * 检查键是否存在
     */
    has(key: string): Promise<boolean>;
    /**
     * 获取元数据
     */
    getMetadata(key: string): Promise<any>;
    /**
     * 清空当前命名空间的所有缓存
     *
     * @param includeChildren - 是否包含子命名空间
     */
    clear(includeChildren?: boolean): Promise<void>;
    /**
     * 获取所有键
     *
     * @param includeChildren - 是否包含子命名空间的键
     */
    keys(includeChildren?: boolean): Promise<string[]>;
    /**
     * 批量操作
     */
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
    /**
     * 获取或设置
     */
    remember<T extends SerializableValue = SerializableValue>(key: string, fetcher: () => Promise<T> | T, options?: SetOptions & {
        refresh?: boolean;
    }): Promise<T>;
    /**
     * 获取统计信息
     *
     * @param includeChildren - 是否包含子命名空间的统计
     */
    getStats(includeChildren?: boolean): Promise<{
        namespace: string;
        stats: any;
        children?: Record<string, any>;
    }>;
    /**
     * 销毁命名空间
     *
     * @param includeChildren - 是否销毁子命名空间
     */
    destroy(includeChildren?: boolean): Promise<void>;
    /**
     * 获取子命名空间
     */
    getChild(name: string): CacheNamespace | undefined;
    /**
     * 获取所有子命名空间
     */
    getChildren(): Map<string, CacheNamespace>;
    /**
     * 导出命名空间数据
     *
     * @param filter - 可选的过滤函数
     * @returns 导出的键值对数组
     */
    export(filter?: (key: string) => boolean): Promise<Array<{
        key: string;
        value: any;
    }>>;
    /**
     * 导出完整的命名空间数据（包含子命名空间）
     */
    exportFull(includeChildren?: boolean): Promise<{
        namespace: string;
        data: Record<string, any>;
        children?: Record<string, any>;
    }>;
    /**
     * 导入命名空间数据
     *
     * @param data - 要导入的数据，支持数组或对象格式
     * @param options - 导入选项
     * @param options.transform - 导入前对条目进行转换（如键重命名/结构升级）
     */
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
/**
 * 创建根命名空间
 */
export declare function createNamespace(name: string, options?: Partial<CacheOptions>): CacheNamespace;
