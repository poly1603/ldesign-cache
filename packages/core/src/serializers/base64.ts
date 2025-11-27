/**
 * Base64 序列化器
 * @module @ldesign/cache/core/serializers/base64
 */

import type { Serializer } from '../types'
import { ERROR_MESSAGES } from '../constants'

/**
 * Base64 序列化器实现
 * 先 JSON 序列化，再 Base64 编码
 */
export class Base64Serializer implements Serializer {
  /**
   * 序列化值为 Base64 字符串
   * @param value - 要序列化的值
   * @returns Base64 字符串
   */
  serialize<T>(value: T): string {
    try {
      const json = JSON.stringify(value)
      if (typeof btoa !== 'undefined') {
        // 浏览器环境
        return btoa(encodeURIComponent(json))
      }
      else {
        // Node.js 环境
        return Buffer.from(json, 'utf-8').toString('base64')
      }
    }
    catch (error) {
      throw new Error(`${ERROR_MESSAGES.SERIALIZATION_ERROR}: ${error}`)
    }
  }

  /**
   * 反序列化 Base64 字符串
   * @param data - Base64 字符串
   * @returns 反序列化后的值
   */
  deserialize<T>(data: string): T {
    try {
      let json: string
      if (typeof atob !== 'undefined') {
        // 浏览器环境
        json = decodeURIComponent(atob(data))
      }
      else {
        // Node.js 环境
        json = Buffer.from(data, 'base64').toString('utf-8')
      }
      return JSON.parse(json) as T
    }
    catch (error) {
      throw new Error(`${ERROR_MESSAGES.DESERIALIZATION_ERROR}: ${error}`)
    }
  }
}

/**
 * 创建 Base64 序列化器实例
 * @returns Base64 序列化器
 */
export function createBase64Serializer(): Serializer {
  return new Base64Serializer()
}

