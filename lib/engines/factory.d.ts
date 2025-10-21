import type { IStorageEngine, StorageEngine, StorageEngineConfig } from '../types';
export declare class StorageEngineFactory {
    static create(type: StorageEngine, config?: StorageEngineConfig[StorageEngine]): Promise<IStorageEngine>;
    static isAvailable(type: StorageEngine): boolean;
    static getAvailableEngines(): StorageEngine[];
    static getRecommendedEngine(): StorageEngine;
}
//# sourceMappingURL=factory.d.ts.map