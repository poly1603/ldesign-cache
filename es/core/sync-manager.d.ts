import type { StorageEngine } from '../types';
import type { CacheManager } from './cache-manager';
export interface SyncOptions {
    enabled?: boolean;
    channel?: string;
    debounce?: number;
    engines?: StorageEngine[];
    events?: Array<'set' | 'remove' | 'clear'>;
}
interface SyncMessage {
    type: 'set' | 'remove' | 'clear' | 'sync' | 'ping';
    key?: string;
    value?: any;
    options?: any;
    timestamp: number;
    source: string;
}
export declare class SyncManager {
    private manager;
    private options;
    private channel?;
    private storageHandler?;
    private readonly sourceId;
    private readonly emitter;
    private syncTimer?;
    constructor(manager: CacheManager, options?: SyncOptions);
    private generateSourceId;
    private initialize;
    private supportsBroadcastChannel;
    private supportsStorageEvent;
    private initBroadcastChannel;
    private initStorageEvent;
    private setupLocalListeners;
    private shouldSync;
    private broadcastMessage;
    private sendMessage;
    private handleSyncMessage;
    private handleSyncRequest;
    requestSync(): Promise<void>;
    ping(): void;
    on(event: 'sync', listener: (message: SyncMessage) => void): void;
    off(event: 'sync', listener: (message: SyncMessage) => void): void;
    destroy(): void;
}
export {};
//# sourceMappingURL=sync-manager.d.ts.map