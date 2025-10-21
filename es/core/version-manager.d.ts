import type { SerializableValue } from '../types';
import type { CacheManager } from './cache-manager';
export type MigrationFunction = (data: SerializableValue) => SerializableValue | Promise<SerializableValue>;
export interface VersionConfig {
    version: string;
    versionKey?: string;
    autoMigrate?: boolean;
    clearOnMismatch?: boolean;
}
export interface MigrationConfig {
    from: string;
    to: string;
    migrate: MigrationFunction;
    description?: string;
}
export declare class VersionManager {
    private cache;
    private migrations;
    private currentVersion;
    private versionKey;
    private autoMigrate;
    private clearOnMismatch;
    constructor(cache: CacheManager, config: VersionConfig);
    registerMigration(config: MigrationConfig): void;
    registerMigrations(configs: MigrationConfig[]): void;
    initialize(): Promise<void>;
    migrate(fromVersion: string, toVersion: string): Promise<void>;
    private findMigrationPath;
    private getStoredVersion;
    private setStoredVersion;
    getCurrentVersion(): string;
    checkVersion(): Promise<boolean>;
    forceUpdateVersion(version?: string): Promise<void>;
    getMigrations(): MigrationConfig[];
    clearMigrations(): void;
}
export declare function createVersionManager(cache: CacheManager, config: VersionConfig): VersionManager;
//# sourceMappingURL=version-manager.d.ts.map