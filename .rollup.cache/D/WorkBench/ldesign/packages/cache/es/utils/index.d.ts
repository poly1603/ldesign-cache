/**
 * @ldesign/cache 工具模块
 *
 * 提供缓存库所需的各种工具函数和类
 */
export * from './batch-helpers';
export * from './compressor';
export * from './error-handler';
export { EventEmitter } from './event-emitter';
export * from './event-throttle';
export * from './min-heap';
export * from './object-pool';
export * from './performance-profiler';
export * from './prefetcher';
export * from './retry-manager';
export * from './serialization-cache';
export * from './validator';
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
export declare function isBrowser(): boolean;
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
export declare function isNode(): boolean;
/**
 * 检查是否为 Web Worker 环境
 *
 * @returns 是否为 Web Worker 环境
 */
export declare function isWebWorker(): boolean;
/**
 * 检查是否为 SSR 环境
 *
 * @returns 是否为 SSR 环境
 */
export declare function isSSR(): boolean;
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
export declare function isValidInput(input: unknown): input is NonNullable<unknown>;
/**
 * 检查是否为空值（null、undefined 或空字符串）
 *
 * @param value - 要检查的值
 * @returns 是否为空值
 */
export declare function isEmpty(value: unknown): value is null | undefined | '';
/**
 * 检查是否为非空字符串
 *
 * @param value - 要检查的值
 * @returns 是否为非空字符串
 */
export declare function isNonEmptyString(value: unknown): value is string;
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
export declare function safeJsonParse<T = unknown>(json: string, defaultValue: T): T;
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
export declare function safeJsonStringify(value: unknown, space?: number): string;
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
export declare function deepClone<T>(obj: T): T;
/**
 * 深度合并对象
 *
 * @param target - 目标对象
 * @param sources - 源对象数组
 * @returns 合并后的对象
 */
export declare function deepMerge<T extends Record<string, unknown>>(target: T, ...sources: Partial<T>[]): T;
/**
 * 创建一个只能调用一次的函数
 *
 * @param func - 要包装的函数
 * @returns 只能调用一次的函数
 */
export declare function once<T extends (...args: unknown[]) => unknown>(func: T): (...args: Parameters<T>) => ReturnType<T> | undefined;
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
export declare function formatBytes(bytes: number, decimals?: number): string;
/**
 * 格式化数字，添加千分位分隔符
 *
 * @param num - 要格式化的数字
 * @returns 格式化后的字符串
 */
export declare function formatNumber(num: number): string;
/**
 * 格式化百分比
 *
 * @param value - 值（0-1 之间）
 * @param decimals - 小数位数
 * @returns 格式化后的百分比字符串
 */
export declare function formatPercentage(value: number, decimals?: number): string;
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
export declare function generateId(prefix?: string): string;
/**
 * 生成 UUID v4
 *
 * @returns UUID v4 字符串
 */
export declare function generateUUID(): string;
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
export declare function delay(ms: number): Promise<void>;
/**
 * 超时包装器，为 Promise 添加超时功能
 *
 * @param promise - 要包装的 Promise
 * @param timeoutMs - 超时时间（毫秒）
 * @param timeoutMessage - 超时错误消息
 * @returns 带超时的 Promise
 */
export declare function withTimeout<T>(promise: Promise<T>, timeoutMs: number, timeoutMessage?: string): Promise<T>;
/**
 * 将数值限制在指定范围内
 *
 * @param value - 要限制的值
 * @param min - 最小值
 * @param max - 最大值
 * @returns 限制后的值
 */
export declare function clamp(value: number, min: number, max: number): number;
/**
 * 生成指定范围内的随机整数
 *
 * @param min - 最小值（包含）
 * @param max - 最大值（包含）
 * @returns 随机整数
 */
export declare function randomInt(min: number, max: number): number;
