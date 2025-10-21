/**
 * 数据验证工具类
 *
 * 提供统一的数据验证功能，用于验证缓存操作的输入参数
 */
import type { SetOptions, StorageEngine } from '../types';
/**
 * 验证错误类
 */
export declare class ValidationError extends Error {
    field?: string | undefined;
    constructor(message: string, field?: string | undefined);
}
/**
 * 验证规则接口
 */
export interface ValidationRule<T = any> {
    /** 验证函数 */
    validate: (value: T) => boolean;
    /** 错误消息 */
    message: string;
}
/**
 * 数据验证器类
 */
export declare class Validator {
    /**
     * 验证缓存键
     *
     * @param key - 缓存键
     * @throws {ValidationError} 当键无效时抛出错误
     *
     * @example
     * ```typescript
     * Validator.validateKey('user:123') // 通过
     * Validator.validateKey('') // 抛出错误
     * ```
     */
    static validateKey(key: unknown): asserts key is string;
    /**
     * 验证缓存值
     *
     * @param value - 缓存值
     * @throws {ValidationError} 当值无效时抛出错误
     */
    static validateValue(value: unknown): void;
    /**
     * 验证TTL值
     *
     * @param ttl - 生存时间
     * @throws {ValidationError} 当TTL无效时抛出错误
     */
    static validateTTL(ttl: unknown): asserts ttl is number;
    /**
     * 验证存储引擎
     *
     * @param engine - 存储引擎名称
     * @throws {ValidationError} 当引擎无效时抛出错误
     */
    static validateEngine(engine: unknown): asserts engine is StorageEngine;
    /**
     * 验证设置选项
     *
     * @param options - 设置选项
     * @throws {ValidationError} 当选项无效时抛出错误
     */
    static validateSetOptions(options: unknown): asserts options is SetOptions | undefined;
    /**
     * 验证缓存设置的完整输入
     *
     * @param key - 缓存键
     * @param value - 缓存值
     * @param options - 设置选项
     * @throws {ValidationError} 当任何参数无效时抛出错误
     *
     * @example
     * ```typescript
     * try {
     *   Validator.validateSetInput('user:123', userData, { ttl: 3600000 })
     *   // 验证通过，可以安全地设置缓存
     * } catch (error) {
     *   if (error instanceof ValidationError) {
     *     console.error(`Validation failed for ${error.field}: ${error.message}`)
     *   }
     * }
     * ```
     */
    static validateSetInput<T>(key: unknown, value: T, options?: unknown): void;
    /**
     * 创建自定义验证规则
     *
     * @param rules - 验证规则数组
     * @returns 验证函数
     */
    static createValidator<T>(rules: ValidationRule<T>[]): (value: T, fieldName?: string) => void;
    /**
     * 常用验证规则
     */
    static readonly rules: {
        /** 非空字符串 */
        nonEmptyString: {
            validate: (value: unknown) => value is string;
            message: string;
        };
        /** 正整数 */
        positiveInteger: {
            validate: (value: unknown) => value is number;
            message: string;
        };
        /** 非负数 */
        nonNegativeNumber: {
            validate: (value: unknown) => value is number;
            message: string;
        };
        /** 布尔值 */
        boolean: {
            validate: (value: unknown) => value is boolean;
            message: string;
        };
        /** 对象 */
        object: {
            validate: (value: unknown) => value is object;
            message: string;
        };
        /** 数组 */
        array: {
            validate: (value: unknown) => value is unknown[];
            message: string;
        };
    };
    /**
     * 批量验证
     *
     * @param validations - 验证配置数组
     * @throws {ValidationError} 当任何验证失败时抛出错误
     */
    static validateBatch(validations: Array<{
        value: unknown;
        rules: ValidationRule[];
        fieldName?: string;
    }>): void;
}
/**
 * 快捷验证函数
 */
export declare const validateKey: typeof Validator.validateKey;
export declare const validateValue: typeof Validator.validateValue;
export declare const validateTTL: typeof Validator.validateTTL;
export declare const validateEngine: typeof Validator.validateEngine;
export declare const validateSetOptions: typeof Validator.validateSetOptions;
export declare const validateSetInput: typeof Validator.validateSetInput;
