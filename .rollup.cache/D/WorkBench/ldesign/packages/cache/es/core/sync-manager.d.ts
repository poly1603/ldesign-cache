import type { StorageEngine } from '../types';
import type { CacheManager } from './cache-manager';
/**
 * 同步配置
 */
export interface SyncOptions {
    /** 是否启用同步 */
    enabled?: boolean;
    /** 同步通道名称 */
    channel?: string;
    /** 同步延迟（毫秒） */
    debounce?: number;
    /** 同步的存储引擎 */
    engines?: StorageEngine[];
    /** 同步事件类型 */
    events?: Array<'set' | 'remove' | 'clear'>;
}
/**
 * 同步消息
 */
interface SyncMessage {
    type: 'set' | 'remove' | 'clear' | 'sync' | 'ping';
    key?: string;
    value?: any;
    options?: any;
    timestamp: number;
    source: string;
}
/**
 * 跨标签页同步管理器
 *
 * 使用 BroadcastChannel API 或 storage 事件实现跨标签页缓存同步
 */
export declare class SyncManager {
    private manager;
    private options;
    private channel?;
    private storageHandler?;
    private readonly sourceId;
    private readonly emitter;
    private syncTimer?;
    constructor(manager: CacheManager, options?: SyncOptions);
    /**
     * 生成唯一源ID
     */
    private generateSourceId;
    /**
     * 初始化同步
     */
    private initialize;
    /**
     * 检查是否支持 BroadcastChannel
     */
    private supportsBroadcastChannel;
    /**
     * 检查是否支持 storage 事件
     */
    private supportsStorageEvent;
    /**
     * 初始化 BroadcastChannel
     */
    private initBroadcastChannel;
    /**
     * 初始化 storage 事件监听
     */
    private initStorageEvent;
    /**
     * 设置本地缓存事件监听
     */
    private setupLocalListeners;
    /**
     * 判断是否需要同步
     */
    private shouldSync;
    /**
     * 广播同步消息
     */
    private broadcastMessage;
    /**
     * 发送消息
     */
    private sendMessage;
    /**
     * 处理同步消息
     */
    private handleSyncMessage;
    /**
     * 处理同步请求
     */
    private handleSyncRequest;
    /**
     * 请求全量同步
     */
    requestSync(): Promise<void>;
    /**
     * 发送心跳
     */
    ping(): void;
    /**
     * 监听同步事件
     */
    on(event: 'sync', listener: (message: SyncMessage) => void): void;
    /**
     * 移除监听器
     */
    off(event: 'sync', listener: (message: SyncMessage) => void): void;
    /**
     * 销毁同步管理器
     */
    destroy(): void;
}
export {};
/**
 * 缓存预热管理器
 *
 * 支持缓存数据的导入导出和预热
 */
