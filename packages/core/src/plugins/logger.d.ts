/**
 * 日志插件
 * @module @ldesign/cache/core/plugins/logger
 */
import type { CachePlugin } from '../types';
/**
 * 日志级别
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
/**
 * 日志插件选项
 */
export interface LoggerPluginOptions {
    /** 日志级别 */
    level?: LogLevel;
    /** 是否启用 */
    enabled?: boolean;
    /** 自定义日志函数 */
    logger?: (level: LogLevel, message: string, data?: any) => void;
}
/**
 * 日志插件
 * 记录缓存操作日志
 */
export declare class LoggerPlugin implements CachePlugin {
    name: string;
    private options;
    constructor(options?: LoggerPluginOptions);
    /**
     * 默认日志函数
     */
    private defaultLogger;
    afterSet<T>(key: string, value: T): void;
    afterGet<T>(key: string, value: T | undefined): void;
    afterDelete(key: string, success: boolean): void;
    afterClear(): void;
}
/**
 * 创建日志插件
 * @param options - 插件选项
 * @returns 日志插件实例
 */
export declare function createLoggerPlugin(options?: LoggerPluginOptions): CachePlugin;
