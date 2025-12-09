/**
 * Base64 序列化器
 * @module @ldesign/cache/core/serializers/base64
 */
import type { Serializer } from '../types';
/**
 * Base64 序列化器实现
 * 先 JSON 序列化，再 Base64 编码
 */
export declare class Base64Serializer implements Serializer {
    /**
     * 序列化值为 Base64 字符串
     * @param value - 要序列化的值
     * @returns Base64 字符串
     */
    serialize<T>(value: T): string;
    /**
     * 反序列化 Base64 字符串
     * @param data - Base64 字符串
     * @returns 反序列化后的值
     */
    deserialize<T>(data: string): T;
}
/**
 * 创建 Base64 序列化器实例
 * @returns Base64 序列化器
 */
export declare function createBase64Serializer(): Serializer;
