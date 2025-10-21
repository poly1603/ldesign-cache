import type { SerializableValue, SetOptions } from '../types';
import type { CacheManager } from './cache-manager';
export interface TagConfig {
    tagPrefix?: string;
    autoCleanup?: boolean;
}
export declare class TagManager {
    private cache;
    private tagPrefix;
    private autoCleanup;
    private readonly TAG_INDEX_KEY;
    constructor(cache: CacheManager, config?: TagConfig);
    set<T extends SerializableValue>(key: string, value: T, options?: SetOptions & {
        tags?: string[];
    }): Promise<void>;
    addTags(key: string, tags: string[]): Promise<void>;
    removeTags(key: string, tags: string[]): Promise<void>;
    getKeyTags(key: string): Promise<string[]>;
    getKeysByTag(tag: string): Promise<string[]>;
    getKeysByTags(tags: string[], mode?: 'and' | 'or'): Promise<string[]>;
    clearByTag(tag: string): Promise<void>;
    clearByTags(tags: string[], mode?: 'and' | 'or'): Promise<void>;
    getAllTags(): Promise<string[]>;
    getTagStats(): Promise<Record<string, number>>;
    cleanupEmptyTags(): Promise<number>;
    renameTag(oldTag: string, newTag: string): Promise<void>;
    private getTagKey;
    private getKeyIndexKey;
    private getTagKeys;
    private updateKeyTags;
    private removeKeyTagIndex;
}
export declare function createTagManager(cache: CacheManager, config?: TagConfig): TagManager;
//# sourceMappingURL=tag-manager.d.ts.map