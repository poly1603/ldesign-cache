/**
 * 错误处理工具类（增强版）
 * 
 * 提供统一的错误处理、日志记录、错误分类和恢复策略
 */

/**
 * 缓存错误码
 */
export enum CacheErrorCode {
  // 验证错误 (1xxx)
  INVALID_KEY = 'E1001',
  INVALID_VALUE = 'E1002',
  INVALID_OPTIONS = 'E1003',

  // 存储错误 (2xxx)
  STORAGE_UNAVAILABLE = 'E2001',
  STORAGE_QUOTA_EXCEEDED = 'E2002',
  STORAGE_ACCESS_DENIED = 'E2003',
  STORAGE_WRITE_FAILED = 'E2004',
  STORAGE_READ_FAILED = 'E2005',

  // 序列化错误 (3xxx)
  SERIALIZATION_FAILED = 'E3001',
  DESERIALIZATION_FAILED = 'E3002',
  CIRCULAR_REFERENCE = 'E3003',

  // 加密错误 (4xxx)
  ENCRYPTION_FAILED = 'E4001',
  DECRYPTION_FAILED = 'E4002',
  INVALID_SECRET_KEY = 'E4003',

  // 网络错误 (5xxx)
  NETWORK_ERROR = 'E5001',
  TIMEOUT_ERROR = 'E5002',
  CONNECTION_FAILED = 'E5003',

  // 同步错误 (6xxx)
  SYNC_CONFLICT = 'E6001',
  SYNC_FAILED = 'E6002',
  OFFLINE_QUEUE_FULL = 'E6003',

  // 其他错误 (9xxx)
  UNKNOWN_ERROR = 'E9999',
}

/**
 * 缓存错误类
 */
export class CacheError extends Error {
  constructor(
    public code: CacheErrorCode,
    message: string,
    public originalError?: Error,
    public context?: Record<string, any>,
  ) {
    super(message)
    this.name = 'CacheError'

    // 保持正确的堆栈跟踪
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CacheError)
    }
  }

  /**
   * 转换为 JSON
   */
  toJSON(): Record<string, any> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      context: this.context,
      stack: this.stack,
      originalError: this.originalError ? {
        name: this.originalError.name,
        message: this.originalError.message,
      } : undefined,
    }
  }
}

/**
 * 错误处理选项
 */
export interface ErrorHandlerOptions {
  /** 是否记录错误日志 */
  logError?: boolean
  /** 日志前缀 */
  logPrefix?: string
  /** 是否重新抛出错误 */
  rethrow?: boolean
  /** 默认返回值 */
  defaultValue?: any
  /** 错误转换函数 */
  errorTransform?: (error: unknown) => Error
  /** 错误恢复策略 */
  recoveryStrategies?: Array<(error: Error) => Promise<any> | any>
}

/**
 * 异步操作错误处理结果
 */
export interface AsyncResult<T> {
  /** 操作是否成功 */
  success: boolean
  /** 返回数据 */
  data?: T
  /** 错误信息 */
  error?: Error
}

/**
 * 错误处理工具类
 */
export class ErrorHandler {
  /**
   * 安全执行异步操作
   * 
   * @param operation - 要执行的异步操作
   * @param options - 错误处理选项
   * @returns 执行结果
   * 
   * @example
   * ```typescript
   * const result = await ErrorHandler.safeAsync(
   *   () => riskyOperation(),
   *   { logPrefix: '[Cache]', defaultValue: null }
   * )
   * 
   * if (result.success) {
   *   
   * } else {
   *   console.error('操作失败:', result.error?.message)
   * }
   * ```
   */
  static async safeAsync<T>(
    operation: () => Promise<T>,
    options: ErrorHandlerOptions = {},
  ): Promise<AsyncResult<T>> {
    const {
      logError = true,
      logPrefix = '[ErrorHandler]',
      errorTransform = err => (err instanceof Error ? err : new Error(String(err))),
    } = options

    try {
      const data = await operation()
      return { success: true, data }
    }
    catch (error) {
      const transformedError = errorTransform(error)

      if (logError) {
        console.error(`${logPrefix} Operation failed:`, transformedError.message)
      }

      return { success: false, error: transformedError }
    }
  }

  /**
   * 安全执行同步操作
   * 
   * @param operation - 要执行的同步操作
   * @param options - 错误处理选项
   * @returns 执行结果或默认值
   */
  static safeSync<T>(
    operation: () => T,
    options: ErrorHandlerOptions = {},
  ): T | undefined {
    const {
      logError = true,
      logPrefix = '[ErrorHandler]',
      defaultValue,
      rethrow = false,
      errorTransform = err => (err instanceof Error ? err : new Error(String(err))),
    } = options

    try {
      return operation()
    }
    catch (error) {
      const transformedError = errorTransform(error)

      if (logError) {
        console.error(`${logPrefix} Operation failed:`, transformedError.message)
      }

      if (rethrow) {
        throw transformedError
      }

      return defaultValue
    }
  }

  /**
   * 创建带重试机制的异步操作
   * 
   * @param operation - 要执行的异步操作
   * @param maxRetries - 最大重试次数
   * @param delay - 重试延迟时间（毫秒）
   * @param options - 错误处理选项
   * @returns 执行结果
   */
  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000,
    options: ErrorHandlerOptions = {},
  ): Promise<AsyncResult<T>> {
    const { logPrefix = '[ErrorHandler]' } = options

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const result = await this.safeAsync(operation, {
        ...options,
        logError: attempt === maxRetries, // 只在最后一次失败时记录日志
      })

      if (result.success) {
        return result
      }

      if (attempt < maxRetries) {
        console.warn(`${logPrefix} Attempt ${attempt} failed, retrying in ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    return { success: false, error: new Error(`Operation failed after ${maxRetries} attempts`) }
  }

  /**
   * 带恢复策略的异步操作
   * 
   * @param operation - 要执行的操作
   * @param options - 错误处理选项（包含恢复策略）
   * @returns 执行结果
   */
  static async withRecovery<T>(
    operation: () => Promise<T>,
    options: ErrorHandlerOptions = {},
  ): Promise<AsyncResult<T>> {
    const result = await this.safeAsync(operation, options)

    if (result.success) {
      return result
    }

    // 尝试错误恢复策略
    if (options.recoveryStrategies && options.recoveryStrategies.length > 0) {
      for (const strategy of options.recoveryStrategies) {
        try {
          const recovered = await Promise.resolve(strategy(result.error!))
          return { success: true, data: recovered }
        }
        catch (recoveryError) {
          console.warn('Recovery strategy failed:', recoveryError)
        }
      }
    }

    return result
  }

  /**
   * 标准化错误对象
   * 
   * @param error - 原始错误
   * @param context - 错误上下文信息
   * @returns 标准化的错误对象
   */
  static normalizeError(error: unknown, context?: string): Error {
    if (error instanceof Error) {
      return context ? new Error(`${context}: ${error.message}`) : error
    }

    const message = typeof error === 'string' ? error : 'Unknown error'
    return new Error(context ? `${context}: ${message}` : message)
  }

  /**
   * 检查是否为特定类型的错误
   * 
   * @param error - 错误对象
   * @param patterns - 错误模式（字符串或正则表达式）
   * @returns 是否匹配
   */
  static isErrorType(error: unknown, ...patterns: (string | RegExp)[]): boolean {
    if (!(error instanceof Error)) {
      return false
    }

    return patterns.some((pattern) => {
      if (typeof pattern === 'string') {
        return error.message.includes(pattern)
      }
      return pattern.test(error.message)
    })
  }

  /**
   * 分类错误
   * 
   * @param error - 错误对象
   * @returns 错误码
   */
  static classifyError(error: unknown): CacheErrorCode {
    if (!(error instanceof Error)) {
      return CacheErrorCode.UNKNOWN_ERROR
    }

    const message = error.message.toLowerCase()

    // 验证错误
    if (message.includes('invalid') || message.includes('validation')) {
      if (message.includes('key')) {
        return CacheErrorCode.INVALID_KEY
      }
      if (message.includes('value')) {
        return CacheErrorCode.INVALID_VALUE
      }
      return CacheErrorCode.INVALID_OPTIONS
    }

    // 存储错误
    if (message.includes('quota') || message.includes('exceeded')) {
      return CacheErrorCode.STORAGE_QUOTA_EXCEEDED
    }
    if (message.includes('not available') || message.includes('unavailable')) {
      return CacheErrorCode.STORAGE_UNAVAILABLE
    }
    if (message.includes('access denied') || message.includes('permission')) {
      return CacheErrorCode.STORAGE_ACCESS_DENIED
    }

    // 序列化错误
    if (message.includes('serialization') || message.includes('stringify')) {
      return CacheErrorCode.SERIALIZATION_FAILED
    }
    if (message.includes('deserialization') || message.includes('parse')) {
      return CacheErrorCode.DESERIALIZATION_FAILED
    }
    if (message.includes('circular')) {
      return CacheErrorCode.CIRCULAR_REFERENCE
    }

    // 加密错误
    if (message.includes('encryption')) {
      return CacheErrorCode.ENCRYPTION_FAILED
    }
    if (message.includes('decryption')) {
      return CacheErrorCode.DECRYPTION_FAILED
    }

    // 网络错误
    if (message.includes('network') || message.includes('fetch')) {
      return CacheErrorCode.NETWORK_ERROR
    }
    if (message.includes('timeout')) {
      return CacheErrorCode.TIMEOUT_ERROR
    }
    if (message.includes('connection')) {
      return CacheErrorCode.CONNECTION_FAILED
    }

    // 同步错误
    if (message.includes('conflict')) {
      return CacheErrorCode.SYNC_CONFLICT
    }
    if (message.includes('sync')) {
      return CacheErrorCode.SYNC_FAILED
    }

    return CacheErrorCode.UNKNOWN_ERROR
  }

  /**
   * 创建缓存错误
   * 
   * @param error - 原始错误
   * @param context - 错误上下文
   * @returns 缓存错误对象
   */
  static createCacheError(
    error: unknown,
    context?: Record<string, any>,
  ): CacheError {
    if (error instanceof CacheError) {
      return error
    }

    const originalError = error instanceof Error ? error : new Error(String(error))
    const code = this.classifyError(originalError)

    return new CacheError(
      code,
      originalError.message,
      originalError,
      context,
    )
  }

  /**
   * 检查错误是否可恢复
   * 
   * @param error - 错误对象
   * @returns 是否可恢复
   */
  static isRecoverable(error: unknown): boolean {
    if (error instanceof CacheError) {
      // 某些错误类型不可恢复
      const nonRecoverableCodes = [
        CacheErrorCode.INVALID_KEY,
        CacheErrorCode.INVALID_VALUE,
        CacheErrorCode.CIRCULAR_REFERENCE,
      ]
      return !nonRecoverableCodes.includes(error.code)
    }

    return true // 默认认为可以尝试恢复
  }

  /**
   * 获取错误的严重程度
   * 
   * @param error - 错误对象
   * @returns 严重程度 (1-5，5最严重)
   */
  static getSeverity(error: unknown): number {
    if (error instanceof CacheError) {
      const code = error.code

      // 严重错误 (5)
      if ([
        CacheErrorCode.STORAGE_ACCESS_DENIED,
        CacheErrorCode.INVALID_SECRET_KEY,
      ].includes(code)) {
        return 5
      }

      // 高优先级错误 (4)
      if ([
        CacheErrorCode.STORAGE_QUOTA_EXCEEDED,
        CacheErrorCode.ENCRYPTION_FAILED,
        CacheErrorCode.DECRYPTION_FAILED,
      ].includes(code)) {
        return 4
      }

      // 中等错误 (3)
      if ([
        CacheErrorCode.SERIALIZATION_FAILED,
        CacheErrorCode.DESERIALIZATION_FAILED,
        CacheErrorCode.SYNC_CONFLICT,
      ].includes(code)) {
        return 3
      }

      // 轻微错误 (2)
      if ([
        CacheErrorCode.TIMEOUT_ERROR,
        CacheErrorCode.NETWORK_ERROR,
      ].includes(code)) {
        return 2
      }

      // 可忽略错误 (1)
      return 1
    }

    return 3 // 默认中等严重程度
  }

  /**
   * 创建错误处理装饰器
   * 
   * @param options - 错误处理选项
   * @returns 装饰器函数
   */
  static createDecorator(options: ErrorHandlerOptions = {}) {
    return function <T extends (...args: any[]) => any>(
      target: any,
      propertyKey: string,
      descriptor: TypedPropertyDescriptor<T>,
    ) {
      const originalMethod = descriptor.value!

      descriptor.value = async function (this: unknown, ...args: any[]) {
        const result = await ErrorHandler.safeAsync(
          () => originalMethod.apply(this, args),
          options,
        )

        if (result.success) {
          return result.data
        }

        if (options.rethrow !== false) {
          throw result.error
        }

        return options.defaultValue
      } as T

      return descriptor
    }
  }
}

/**
 * 错误处理装饰器
 * 
 * @param options - 错误处理选项
 * @returns 装饰器函数
 * 
 * @example
 * ```typescript
 * class MyClass {
 *   @handleErrors({ logPrefix: '[MyClass]', defaultValue: null })
 *   async riskyMethod() {
 *     // 可能抛出错误的代码
 *   }
 * }
 * ```
 */
export function handleErrors(options: ErrorHandlerOptions = {}) {
  return ErrorHandler.createDecorator(options)
}

/**
 * 快捷的错误处理函数
 */
export const safeAsync = ErrorHandler.safeAsync
export const safeSync = ErrorHandler.safeSync
export const normalizeError = ErrorHandler.normalizeError
export const isErrorType = ErrorHandler.isErrorType
export const createCacheError = ErrorHandler.createCacheError
export const classifyError = ErrorHandler.classifyError
export const isRecoverable = ErrorHandler.isRecoverable
export const getSeverity = ErrorHandler.getSeverity

/**
 * 优雅降级包装器
 * 
 * @param primaryOp - 主要操作
 * @param fallbackOps - 降级操作列表
 * @returns 执行结果
 * 
 * @example
 * ```typescript
 * const data = await gracefulDegradation(
 *   () => cache.get('key'),
 *   [
 *     () => fetchFromAPI(),
 *     () => getDefaultValue(),
 *   ]
 * )
 * ```
 */
export async function gracefulDegradation<T>(
  primaryOp: () => Promise<T>,
  fallbackOps: Array<() => Promise<T> | T>,
): Promise<T> {
  // 尝试主要操作
  const result = await ErrorHandler.safeAsync(primaryOp)
  if (result.success && result.data !== undefined) {
    return result.data
  }

  // 尝试降级操作
  for (let i = 0; i < fallbackOps.length; i++) {
    try {
      const fallback = await Promise.resolve(fallbackOps[i]())
      console.log(`[GracefulDegradation] Used fallback ${i + 1}`)
      return fallback
    }
    catch (error) {
      console.warn(`[GracefulDegradation] Fallback ${i + 1} failed:`, error)
    }
  }

  throw new Error('All operations failed, including fallbacks')
}

/**
 * 错误聚合器
 * 
 * 收集多个错误并生成汇总报告
 */
export class ErrorAggregator {
  private errors: Array<{ error: CacheError, timestamp: number }> = []
  private maxSize = 100

  /**
   * 添加错误
   */
  add(error: unknown, context?: Record<string, any>): void {
    const cacheError = ErrorHandler.createCacheError(error, context)

    this.errors.push({
      error: cacheError,
      timestamp: Date.now(),
    })

    // 限制大小
    if (this.errors.length > this.maxSize) {
      this.errors.shift()
    }
  }

  /**
   * 获取错误统计
   */
  getStats(): {
    total: number
    byCode: Record<string, number>
    bySeverity: Record<number, number>
    recent: CacheError[]
  } {
    const byCode: Record<string, number> = {}
    const bySeverity: Record<number, number> = {}

    for (const { error } of this.errors) {
      byCode[error.code] = (byCode[error.code] || 0) + 1

      const severity = ErrorHandler.getSeverity(error)
      bySeverity[severity] = (bySeverity[severity] || 0) + 1
    }

    const recent = this.errors
      .slice(-10)
      .map(e => e.error)

    return {
      total: this.errors.length,
      byCode,
      bySeverity,
      recent,
    }
  }

  /**
   * 清空错误记录
   */
  clear(): void {
    this.errors = []
  }

  /**
   * 生成错误报告
   */
  generateReport(): string {
    const stats = this.getStats()

    let report = `=== Cache Error Report ===\n`
    report += `Total Errors: ${stats.total}\n\n`

    report += `By Error Code:\n`
    for (const [code, count] of Object.entries(stats.byCode)) {
      report += `  ${code}: ${count}\n`
    }

    report += `\nBy Severity:\n`
    for (const [severity, count] of Object.entries(stats.bySeverity)) {
      report += `  Level ${severity}: ${count}\n`
    }

    report += `\nRecent Errors (last 10):\n`
    for (const error of stats.recent) {
      report += `  [${error.code}] ${error.message}\n`
    }

    return report
  }
}
