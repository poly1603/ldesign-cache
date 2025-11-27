/**
 * JSON 序列化器
 * @module @ldesign/cache/core/serializers/json
 */

import type { Serializer } from '../types'
import { ERROR_MESSAGES } from '../constants'

/**
 * JSON 序列化器实现
 */
export class JSONSerializer implements Serializer {
  /**
   * 序列化值为 JSON 字符串
   * @param value - 要序列化的值
   * @returns JSON 字符串
   */
  serialize<T>(value: T): string {
    try {
      return JSON.stringify(value)
    }
    catch (error) {
      throw new Error(`${ERROR_MESSAGES.SERIALIZATION_ERROR}: ${error}`)
    }
  }

  /**
   * 反序列化 JSON 字符串
   * @param data - JSON 字符串
   * @returns 反序列化后的值
   */
  deserialize<T>(data: string): T {
    try {
      return JSON.parse(data) as T
    }
    catch (error) {
      throw new Error(`${ERROR_MESSAGES.DESERIALIZATION_ERROR}: ${error}`)
    }
  }
}

/**
 * 创建 JSON 序列化器实例
 * @returns JSON 序列化器
 */
export function createJSONSerializer(): Serializer {
  return new JSONSerializer()
}

