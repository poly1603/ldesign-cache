import type { SerializableValue } from '../types';
import type { CacheManager } from './cache-manager';
/**
 * 版本迁移函数类型
 */
export type MigrationFunction = (data: SerializableValue) => SerializableValue | Promise<SerializableValue>;
/**
 * 版本配置
 */
export interface VersionConfig {
    /** 当前版本号 */
    version: string;
    /** 版本键前缀 */
    versionKey?: string;
    /** 是否自动迁移 */
    autoMigrate?: boolean;
    /** 是否在版本不匹配时清空缓存 */
    clearOnMismatch?: boolean;
}
/**
 * 迁移配置
 */
export interface MigrationConfig {
    /** 源版本 */
    from: string;
    /** 目标版本 */
    to: string;
    /** 迁移函数 */
    migrate: MigrationFunction;
    /** 迁移描述 */
    description?: string;
}
/**
 * 缓存版本管理器
 *
 * 管理缓存数据的版本，支持版本迁移和自动清理
 *
 * @example
 * ```typescript
 * const versionManager = new VersionManager(cache, {
 *   version: '2.0.0',
 *   autoMigrate: true
 * })
 *
 * // 注册迁移
 * versionManager.registerMigration({
 *   from: '1.0.0',
 *   to: '2.0.0',
 *   migrate: (data) => {
 *     // 转换数据结构
 *     return { ...data, newField: 'value' }
 *   }
 * })
 *
 * // 初始化版本检查
 * await versionManager.initialize()
 * ```
 */
export declare class VersionManager {
    private cache;
    private migrations;
    private currentVersion;
    private versionKey;
    private autoMigrate;
    private clearOnMismatch;
    constructor(cache: CacheManager, config: VersionConfig);
    /**
     * 注册版本迁移
     */
    registerMigration(config: MigrationConfig): void;
    /**
     * 批量注册迁移
     */
    registerMigrations(configs: MigrationConfig[]): void;
    /**
     * 初始化版本检查
     */
    initialize(): Promise<void>;
    /**
     * 执行版本迁移
     */
    migrate(fromVersion: string, toVersion: string): Promise<void>;
    /**
     * 查找迁移路径
     */
    private findMigrationPath;
    /**
     * 获取存储的版本号
     */
    private getStoredVersion;
    /**
     * 设置存储的版本号
     */
    private setStoredVersion;
    /**
     * 获取当前版本
     */
    getCurrentVersion(): string;
    /**
     * 检查版本是否匹配
     */
    checkVersion(): Promise<boolean>;
    /**
     * 强制更新版本号（不执行迁移）
     */
    forceUpdateVersion(version?: string): Promise<void>;
    /**
     * 获取所有已注册的迁移
     */
    getMigrations(): MigrationConfig[];
    /**
     * 清除所有迁移配置
     */
    clearMigrations(): void;
}
/**
 * 创建版本管理器
 */
export declare function createVersionManager(cache: CacheManager, config: VersionConfig): VersionManager;
