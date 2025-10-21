import { CacheManager } from './core/cache-manager';
export { CacheManager } from './core/cache-manager';
export { LocalStorageEngine } from './engines/local-storage-engine';
export { MemoryEngine } from './engines/memory-engine';
export { SessionStorageEngine } from './engines/session-storage-engine';
export type { BaseEngineOptions, CacheError, CacheEvent, CacheEventListener, CacheEventType, CacheMetadata, CacheOptions, CacheStats, ClearOptions, CookieEngineOptions, EngineOptions, ErrorType, EventListener, EventMap, GetOptions, IndexedDBEngineOptions, LocalStorageEngineOptions, MemoryEngineOptions, RemoveOptions, SerializableValue, SessionStorageEngineOptions, SetOptions, StorageEngine, } from './types';
export { ErrorHandler } from './utils/error-handler';
export { EventEmitter } from './utils/event-emitter';
export type CorePreset = 'memory' | 'browser' | 'session';
export declare function createCoreCache(preset?: CorePreset): CacheManager;
//# sourceMappingURL=index-core.d.ts.map