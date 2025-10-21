import type { SerializableValue, SetOptions } from '../types';
import type { CacheManager } from './cache-manager';
/**
 * 标签配置
 */
export interface TagConfig {
    /** 标签键前缀 */
    tagPrefix?: string;
    /** 是否自动清理空标签 */
    autoCleanup?: boolean;
}
/**
 * 缓存标签管理器
 *
 * 支持为缓存项添加标签，并按标签批量操作
 *
 * @example
 * ```typescript
 * const tagManager = new TagManager(cache)
 *
 * // 设置带标签的缓存
 * await tagManager.set('user:1', userData, { tags: ['user', 'active'] })
 * await tagManager.set('user:2', userData2, { tags: ['user', 'inactive'] })
 *
 * // 按标签获取所有键
 * const userKeys = await tagManager.getKeysByTag('user')
 *
 * // 按标签清除缓存
 * await tagManager.clearByTag('inactive')
 *
 * // 按多个标签查询（交集）
 * const activeUsers = await tagManager.getKeysByTags(['user', 'active'])
 * ```
 */
export declare class TagManager {
    private cache;
    private tagPrefix;
    private autoCleanup;
    private readonly TAG_INDEX_KEY;
    constructor(cache: CacheManager, config?: TagConfig);
    /**
     * 设置带标签的缓存项
     */
    set<T extends SerializableValue>(key: string, value: T, options?: SetOptions & {
        tags?: string[];
    }): Promise<void>;
    /**
     * 为已存在的键添加标签
     */
    addTags(key: string, tags: string[]): Promise<void>;
    /**
     * 移除键的标签
     */
    removeTags(key: string, tags: string[]): Promise<void>;
    /**
     * 获取键的所有标签
     */
    getKeyTags(key: string): Promise<string[]>;
    /**
     * 获取标签下的所有键
     */
    getKeysByTag(tag: string): Promise<string[]>;
    /**
     * 获取多个标签的交集键
     */
    getKeysByTags(tags: string[], mode?: 'and' | 'or'): Promise<string[]>;
    /**
     * 按标签清除缓存
     */
    clearByTag(tag: string): Promise<void>;
    /**
     * 按多个标签清除缓存
     */
    clearByTags(tags: string[], mode?: 'and' | 'or'): Promise<void>;
    /**
     * 获取所有标签
     */
    getAllTags(): Promise<string[]>;
    /**
     * 获取标签统计信息
     */
    getTagStats(): Promise<Record<string, number>>;
    /**
     * 清理空标签
     */
    cleanupEmptyTags(): Promise<number>;
    /**
     * 重命名标签
     */
    renameTag(oldTag: string, newTag: string): Promise<void>;
    /**
     * 获取标签键
     */
    private getTagKey;
    /**
     * 获取键的标签索引键
     */
    private getKeyIndexKey;
    /**
     * 获取标签下的键列表
     */
    private getTagKeys;
    /**
     * 更新键的标签索引
     */
    private updateKeyTags;
    /**
     * 移除键的标签索引
     */
    private removeKeyTagIndex;
}
/**
 * 创建标签管理器
 */
export declare function createTagManager(cache: CacheManager, config?: TagConfig): TagManager;
