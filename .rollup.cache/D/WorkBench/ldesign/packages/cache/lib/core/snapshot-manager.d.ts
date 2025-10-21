import type { SerializableValue, StorageEngine } from '../types';
import type { CacheManager } from './cache-manager';
/**
 * 快照数据结构
 */
export interface CacheSnapshot {
    /** 快照版本 */
    version: string;
    /** 创建时间戳 */
    timestamp: number;
    /** 快照数据 */
    data: Record<string, SerializableValue>;
    /** 元数据 */
    metadata?: {
        /** 快照名称 */
        name?: string;
        /** 快照描述 */
        description?: string;
        /** 自定义数据 */
        custom?: Record<string, any>;
    };
}
/**
 * 快照选项
 */
export interface SnapshotOptions {
    /** 快照名称 */
    name?: string;
    /** 快照描述 */
    description?: string;
    /** 要包含的键（不指定则包含所有） */
    keys?: string[];
    /** 要排除的键 */
    excludeKeys?: string[];
    /** 指定存储引擎 */
    engine?: StorageEngine;
    /** 是否压缩 */
    compress?: boolean;
    /** 自定义元数据 */
    metadata?: Record<string, any>;
}
/**
 * 恢复选项
 */
export interface RestoreOptions {
    /** 是否清空现有缓存 */
    clear?: boolean;
    /** 是否合并（不清空，只覆盖冲突的键） */
    merge?: boolean;
    /** 要恢复的键（不指定则恢复所有） */
    keys?: string[];
    /** 要排除的键 */
    excludeKeys?: string[];
    /** 指定存储引擎 */
    engine?: StorageEngine;
}
/**
 * 缓存快照管理器
 *
 * 支持导出和导入缓存状态，用于备份、迁移或测试
 *
 * @example
 * ```typescript
 * const snapshotManager = new SnapshotManager(cache)
 *
 * // 创建快照
 * const snapshot = await snapshotManager.create({
 *   name: 'backup-2024',
 *   description: '生产环境备份'
 * })
 *
 * // 导出为 JSON
 * const json = snapshotManager.export(snapshot)
 *
 * // 从 JSON 导入
 * const imported = snapshotManager.import(json)
 *
 * // 恢复快照
 * await snapshotManager.restore(imported, { clear: true })
 * ```
 */
export declare class SnapshotManager {
    private cache;
    private static readonly SNAPSHOT_VERSION;
    constructor(cache: CacheManager);
    /**
     * 创建快照
     */
    create(options?: SnapshotOptions): Promise<CacheSnapshot>;
    /**
     * 恢复快照
     */
    restore(snapshot: CacheSnapshot, options?: RestoreOptions): Promise<void>;
    /**
     * 导出快照为 JSON 字符串
     */
    export(snapshot: CacheSnapshot, pretty?: boolean): string;
    /**
     * 从 JSON 字符串导入快照
     */
    import(json: string): CacheSnapshot;
    /**
     * 导出快照为 Blob（用于下载）
     */
    exportAsBlob(snapshot: CacheSnapshot, pretty?: boolean): Blob;
    /**
     * 从 Blob 导入快照
     */
    importFromBlob(blob: Blob): Promise<CacheSnapshot>;
    /**
     * 比较两个快照
     */
    compare(snapshot1: CacheSnapshot, snapshot2: CacheSnapshot): {
        added: string[];
        removed: string[];
        modified: string[];
        unchanged: string[];
    };
    /**
     * 合并多个快照
     */
    merge(...snapshots: CacheSnapshot[]): CacheSnapshot;
    /**
     * 获取快照统计信息
     */
    getStats(snapshot: CacheSnapshot): {
        keyCount: number;
        dataSize: number;
        timestamp: number;
        age: number;
    };
}
/**
 * 创建快照管理器
 */
export declare function createSnapshotManager(cache: CacheManager): SnapshotManager;
