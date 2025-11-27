/**
 * 日志插件
 * @module @ldesign/cache/core/plugins/logger
 */

import type { CachePlugin } from '../types'

/**
 * 日志级别
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

/**
 * 日志插件选项
 */
export interface LoggerPluginOptions {
  /** 日志级别 */
  level?: LogLevel
  /** 是否启用 */
  enabled?: boolean
  /** 自定义日志函数 */
  logger?: (level: LogLevel, message: string, data?: any) => void
}

/**
 * 日志插件
 * 记录缓存操作日志
 */
export class LoggerPlugin implements CachePlugin {
  name = 'logger'
  private options: Required<LoggerPluginOptions>

  constructor(options: LoggerPluginOptions = {}) {
    this.options = {
      level: options.level ?? 'info',
      enabled: options.enabled ?? true,
      logger: options.logger ?? this.defaultLogger,
    }
  }

  /**
   * 默认日志函数
   */
  private defaultLogger(level: LogLevel, message: string, data?: any): void {
    if (!this.options.enabled) {
      return
    }

    const timestamp = new Date().toISOString()
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`

    switch (level) {
      case 'debug':
        console.debug(logMessage, data)
        break
      case 'info':
        console.info(logMessage, data)
        break
      case 'warn':
        console.warn(logMessage, data)
        break
      case 'error':
        console.error(logMessage, data)
        break
    }
  }

  afterSet<T>(key: string, value: T): void {
    this.options.logger('debug', `缓存已设置: ${key}`, { value })
  }

  afterGet<T>(key: string, value: T | undefined): void {
    if (value !== undefined) {
      this.options.logger('debug', `缓存命中: ${key}`, { value })
    }
    else {
      this.options.logger('debug', `缓存未命中: ${key}`)
    }
  }

  afterDelete(key: string, success: boolean): void {
    if (success) {
      this.options.logger('debug', `缓存已删除: ${key}`)
    }
  }

  afterClear(): void {
    this.options.logger('info', '缓存已清空')
  }
}

/**
 * 创建日志插件
 * @param options - 插件选项
 * @returns 日志插件实例
 */
export function createLoggerPlugin(options?: LoggerPluginOptions): CachePlugin {
  return new LoggerPlugin(options)
}

