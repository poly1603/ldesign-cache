/**
 * @ldesign/cache 工具模块
 *
 * 提供缓存库所需的各种工具函数和类
 */
// ============================================================================
// 模块导出
// ============================================================================
// 批量操作工具
export * from './batch-helpers';
// 数据压缩工具
export * from './compressor';
// 错误处理工具
export * from './error-handler';
// 事件发射器
export { EventEmitter } from './event-emitter';
// 事件节流工具
export * from './event-throttle';
// 最小堆数据结构
export * from './min-heap';
// 对象池
export * from './object-pool';
// 性能分析工具
export * from './performance-profiler';
// 智能预取器
export * from './prefetcher';
// 重试和容错机制
export * from './retry-manager';
// 序列化缓存工具
export * from './serialization-cache';
// 数据验证工具
export * from './validator';
// ============================================================================
// 环境检测工具
// ============================================================================
/**
 * 检查是否为浏览器环境
 *
 * @returns 是否为浏览器环境
 *
 * @example
 * ```typescript
 * if (isBrowser()) {
 *   // 浏览器特定代码
 *   localStorage.setItem('key', 'value')
 * }
 * ```
 */
export function isBrowser() {
    return typeof window !== 'undefined' && typeof document !== 'undefined';
}
/**
 * 检查是否为 Node.js 环境
 *
 * @returns 是否为 Node.js 环境
 *
 * @example
 * ```typescript
 * if (isNode()) {
 *   // Node.js 特定代码
 *   const fs = require('fs')
 * }
 * ```
 */
export function isNode() {
    return (typeof globalThis !== 'undefined'
        // eslint-disable-next-line node/prefer-global/process
        && typeof globalThis.process !== 'undefined'
        // eslint-disable-next-line node/prefer-global/process
        && typeof globalThis.process?.versions === 'object'
        // eslint-disable-next-line node/prefer-global/process
        && Boolean(globalThis.process?.versions?.node));
}
/**
 * 检查是否为 Web Worker 环境
 *
 * @returns 是否为 Web Worker 环境
 */
export function isWebWorker() {
    return (typeof globalThis !== 'undefined'
        && typeof globalThis.importScripts === 'function'
        && typeof navigator !== 'undefined');
}
/**
 * 检查是否为 SSR 环境
 *
 * @returns 是否为 SSR 环境
 */
export function isSSR() {
    return !isBrowser() && !isNode() && !isWebWorker();
}
// ============================================================================
// 输入验证工具
// ============================================================================
/**
 * 检查输入是否有效（非 null 且非 undefined）
 *
 * @param input - 要检查的输入
 * @returns 是否为有效输入
 *
 * @example
 * ```typescript
 * if (isValidInput(userInput)) {
 *   // 处理有效输入
 * }
 * ```
 */
export function isValidInput(input) {
    return input != null;
}
/**
 * 检查是否为空值（null、undefined 或空字符串）
 *
 * @param value - 要检查的值
 * @returns 是否为空值
 */
export function isEmpty(value) {
    return value == null || value === '';
}
/**
 * 检查是否为非空字符串
 *
 * @param value - 要检查的值
 * @returns 是否为非空字符串
 */
export function isNonEmptyString(value) {
    return typeof value === 'string' && value.length > 0;
}
// ============================================================================
// JSON 处理工具
// ============================================================================
/**
 * 安全的 JSON 解析，失败时返回默认值
 *
 * @param json - JSON 字符串
 * @param defaultValue - 解析失败时的默认值
 * @returns 解析结果或默认值
 *
 * @example
 * ```typescript
 * const data = safeJsonParse('{"name": "test"}', {})
 * const invalid = safeJsonParse('invalid json', null)
 * ```
 */
export function safeJsonParse(json, defaultValue) {
    if (!isNonEmptyString(json)) {
        return defaultValue;
    }
    try {
        return JSON.parse(json);
    }
    catch {
        return defaultValue;
    }
}
/**
 * 安全的 JSON 序列化，失败时返回字符串表示
 *
 * @param value - 要序列化的值
 * @param space - 缩进空格数（可选）
 * @returns JSON 字符串或字符串表示
 *
 * @example
 * ```typescript
 * const json = safeJsonStringify({ name: 'test' })
 * const fallback = safeJsonStringify(circular) // 处理循环引用
 * ```
 */
export function safeJsonStringify(value, space) {
    try {
        return JSON.stringify(value, null, space);
    }
    catch (error) {
        console.warn('[Utils] JSON stringify failed:', error);
        return String(value);
    }
}
// ============================================================================
// 对象处理工具
// ============================================================================
/**
 * 深度克隆对象，支持嵌套对象、数组和 Date 对象
 *
 * @param obj - 要克隆的对象
 * @returns 克隆后的对象
 *
 * @example
 * ```typescript
 * const original = { user: { name: 'test', date: new Date() } }
 * const cloned = deepClone(original)
 * cloned.user.name = 'changed' // 不会影响原对象
 * ```
 */
export function deepClone(obj) {
    // 处理基本类型和 null
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    // 处理 Date 对象
    if (obj instanceof Date) {
        return new Date(obj.getTime());
    }
    // 处理 RegExp 对象
    if (obj instanceof RegExp) {
        return new RegExp(obj.source, obj.flags);
    }
    // 处理数组
    if (Array.isArray(obj)) {
        return obj.map(item => deepClone(item));
    }
    // 处理普通对象
    if (obj.constructor === Object) {
        const cloned = {};
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                cloned[key] = deepClone(obj[key]);
            }
        }
        return cloned;
    }
    // 对于其他类型的对象，直接返回（如函数、Symbol 等）
    return obj;
}
/**
 * 深度合并对象
 *
 * @param target - 目标对象
 * @param sources - 源对象数组
 * @returns 合并后的对象
 */
export function deepMerge(target, ...sources) {
    if (!sources.length) {
        return target;
    }
    const source = sources.shift();
    if (!source) {
        return target;
    }
    for (const key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
            const sourceValue = source[key];
            const targetValue = target[key];
            if (sourceValue
                && typeof sourceValue === 'object'
                && !Array.isArray(sourceValue)
                && targetValue
                && typeof targetValue === 'object'
                && !Array.isArray(targetValue)) {
                target[key] = deepMerge(targetValue, sourceValue);
            }
            else {
                target[key] = sourceValue;
            }
        }
    }
    return deepMerge(target, ...sources);
}
// ============================================================================
// 函数工具
// ============================================================================
// 注意：throttle 和 debounce 已从 event-throttle 模块导出
/**
 * 创建一个只能调用一次的函数
 *
 * @param func - 要包装的函数
 * @returns 只能调用一次的函数
 */
export function once(func) {
    let called = false;
    let result;
    return (...args) => {
        if (!called) {
            called = true;
            result = func(...args);
            return result;
        }
        return result;
    };
}
// ============================================================================
// 格式化工具
// ============================================================================
/**
 * 格式化字节大小为人类可读的字符串
 *
 * @param bytes - 字节数
 * @param decimals - 小数位数
 * @returns 格式化后的字符串
 *
 * @example
 * ```typescript
 * formatBytes(1024) // "1 KB"
 * formatBytes(1536, 1) // "1.5 KB"
 * formatBytes(1048576) // "1 MB"
 * ```
 */
export function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) {
        return '0 Bytes';
    }
    if (bytes < 0) {
        return `-${formatBytes(-bytes, decimals)}`;
    }
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const size = bytes / k ** i;
    return `${Number.parseFloat(size.toFixed(dm))} ${sizes[i]}`;
}
/**
 * 格式化数字，添加千分位分隔符
 *
 * @param num - 要格式化的数字
 * @returns 格式化后的字符串
 */
export function formatNumber(num) {
    return num.toLocaleString();
}
/**
 * 格式化百分比
 *
 * @param value - 值（0-1 之间）
 * @param decimals - 小数位数
 * @returns 格式化后的百分比字符串
 */
export function formatPercentage(value, decimals = 1) {
    return `${(value * 100).toFixed(decimals)}%`;
}
// ============================================================================
// ID 生成工具
// ============================================================================
/**
 * 生成唯一 ID
 *
 * @param prefix - 可选前缀
 * @returns 唯一 ID 字符串
 *
 * @example
 * ```typescript
 * generateId() // "abc123def456"
 * generateId('cache') // "cache_abc123def456"
 * ```
 */
export function generateId(prefix) {
    const id = Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
    return prefix ? `${prefix}_${id}` : id;
}
/**
 * 生成 UUID v4
 *
 * @returns UUID v4 字符串
 */
export function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
// ============================================================================
// 异步工具
// ============================================================================
/**
 * 延迟执行，返回 Promise
 *
 * @param ms - 延迟时间（毫秒）
 * @returns Promise
 *
 * @example
 * ```typescript
 * await delay(1000) // 等待 1 秒
 * ```
 */
export async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
/**
 * 超时包装器，为 Promise 添加超时功能
 *
 * @param promise - 要包装的 Promise
 * @param timeoutMs - 超时时间（毫秒）
 * @param timeoutMessage - 超时错误消息
 * @returns 带超时的 Promise
 */
export async function withTimeout(promise, timeoutMs, timeoutMessage = 'Operation timed out') {
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
    });
    return Promise.race([promise, timeoutPromise]);
}
// ============================================================================
// 数学工具
// ============================================================================
/**
 * 将数值限制在指定范围内
 *
 * @param value - 要限制的值
 * @param min - 最小值
 * @param max - 最大值
 * @returns 限制后的值
 */
export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}
/**
 * 生成指定范围内的随机整数
 *
 * @param min - 最小值（包含）
 * @param max - 最大值（包含）
 * @returns 随机整数
 */
export function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
//# sourceMappingURL=index.js.map