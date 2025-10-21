/**
 * @ldesign/cache - 核心入口
 *
 * 只包含最基础的缓存功能，体积最小
 */
/**
 * @ldesign/cache - 核心入口
 *
 * 只包含最基础的缓存功能，体积最小
 * 使用统一的预设配置系统
 */
import { CacheManager } from './core/cache-manager';
import { getPresetOptions } from './presets';
// 核心缓存管理器
export { CacheManager } from './core/cache-manager';
export { LocalStorageEngine } from './engines/local-storage-engine';
// 基础存储引擎
export { MemoryEngine } from './engines/memory-engine';
export { SessionStorageEngine } from './engines/session-storage-engine';
// 基础工具
export { ErrorHandler } from './utils/error-handler';
export { EventEmitter } from './utils/event-emitter';
/**
 * 创建核心缓存管理器
 *
 * @param preset - 预设类型，支持 memory、browser、session
 * @returns 缓存管理器实例
 */
export function createCoreCache(preset) {
    const options = preset ? getPresetOptions(preset) : undefined;
    return new CacheManager(options);
}
//# sourceMappingURL=index-core.js.map