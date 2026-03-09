/**
 * Logger plugin.
 */

import type { CachePlugin } from '../types'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LoggerPluginOptions {
  level?: LogLevel
  enabled?: boolean
  logger?: (level: LogLevel, message: string, data?: any) => void
}

const LEVEL_WEIGHT: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
}

export class LoggerPlugin implements CachePlugin {
  readonly name = 'logger'
  private options: Required<LoggerPluginOptions>

  constructor(options: LoggerPluginOptions = {}) {
    this.options = {
      level: options.level ?? 'info',
      enabled: options.enabled ?? true,
      logger: options.logger ?? this.defaultLogger,
    }
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.options.enabled) {
      return false
    }
    return LEVEL_WEIGHT[level] >= LEVEL_WEIGHT[this.options.level]
  }

  private defaultLogger(level: LogLevel, message: string, data?: any): void {
    if (!this.shouldLog(level)) {
      return
    }

    const prefix = `[Cache][${level.toUpperCase()}] ${message}`

    switch (level) {
      case 'debug':
        console.debug(prefix, data)
        break
      case 'info':
        console.info(prefix, data)
        break
      case 'warn':
        console.warn(prefix, data)
        break
      case 'error':
        console.error(prefix, data)
        break
    }
  }

  afterSet<T>(key: string, value: T): void {
    this.options.logger('debug', `set: ${key}`, { value })
  }

  afterGet<T>(key: string, value: T | undefined): void {
    this.options.logger('debug', value === undefined ? `miss: ${key}` : `hit: ${key}`, { value })
  }

  afterDelete(key: string, success: boolean): void {
    if (success) {
      this.options.logger('debug', `delete: ${key}`)
    }
  }

  afterClear(): void {
    this.options.logger('info', 'clear all cache entries')
  }
}

export function createLoggerPlugin(options?: LoggerPluginOptions): CachePlugin {
  return new LoggerPlugin(options)
}
