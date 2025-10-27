/**
 * 优化的批量操作管道
 * 
 * 相比原版本的改进：
 * 1. 并行处理支持
 * 2. 流式处理（减少内存占用）
 * 3. 背压控制
 * 4. 错误恢复
 * 5. 进度跟踪
 */

export interface BatchPipelineConfig {
  /** 批量大小 */
  batchSize?: number
  /** 并发数 */
  concurrency?: number
  /** 处理超时（毫秒） */
  timeout?: number
  /** 重试次数 */
  retries?: number
  /** 重试延迟（毫秒） */
  retryDelay?: number
  /** 是否保序 */
  preserveOrder?: boolean
  /** 背压阈值 */
  backpressureThreshold?: number
  /** 进度回调 */
  onProgress?: (progress: BatchProgress) => void
  /** 错误处理 */
  onError?: (error: BatchError) => void
}

export interface BatchProgress {
  /** 总任务数 */
  total: number
  /** 已完成数 */
  completed: number
  /** 失败数 */
  failed: number
  /** 进度百分比 */
  percentage: number
  /** 预计剩余时间（毫秒） */
  estimatedTimeRemaining?: number
}

export interface BatchError {
  /** 批次索引 */
  batchIndex: number
  /** 项索引 */
  itemIndex: number
  /** 错误信息 */
  error: Error
  /** 重试次数 */
  retryCount: number
}

export interface BatchResult<T> {
  /** 成功的结果 */
  successful: T[]
  /** 失败的项 */
  failed: Array<{ index: number, error: Error }>
  /** 处理时间 */
  duration: number
  /** 吞吐量（项/秒） */
  throughput: number
}

/**
 * 批量操作管道
 */
export class BatchPipeline {
  private config: Required<BatchPipelineConfig>
  private queue: Array<{ items: any[], resolve: Function, reject: Function }> = []
  private processing = false
  private processedCount = 0
  private failedCount = 0
  private startTime = 0

  constructor(config: BatchPipelineConfig = {}) {
    this.config = {
      batchSize: config.batchSize || 50,
      concurrency: config.concurrency || 4,
      timeout: config.timeout || 30000,
      retries: config.retries || 3,
      retryDelay: config.retryDelay || 1000,
      preserveOrder: config.preserveOrder ?? false,
      backpressureThreshold: config.backpressureThreshold || 1000,
      onProgress: config.onProgress || (() => { }),
      onError: config.onError || (() => { }),
    }
  }

  /**
   * 处理批量操作
   */
  async process<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>
  ): Promise<BatchResult<R>> {
    this.startTime = Date.now()
    this.processedCount = 0
    this.failedCount = 0

    const batches = this.createBatches(items)
    const results: R[] = []
    const failures: Array<{ index: number, error: Error }> = []

    if (this.config.preserveOrder) {
      // 保序处理
      await this.processSequential(batches, processor, results, failures)
    } else {
      // 并行处理
      await this.processParallel(batches, processor, results, failures)
    }

    const duration = Date.now() - this.startTime
    const throughput = items.length / (duration / 1000)

    return {
      successful: results,
      failed: failures,
      duration,
      throughput,
    }
  }

  /**
   * 流式处理（适合大数据集）
   */
  async *processStream<T, R>(
    items: AsyncIterable<T> | Iterable<T>,
    processor: (item: T) => Promise<R>
  ): AsyncGenerator<R, void, unknown> {
    const buffer: T[] = []
    const concurrencyLimit = this.config.concurrency
    const promises: Promise<R>[] = []

    for await (const item of items) {
      buffer.push(item)

      if (buffer.length >= this.config.batchSize) {
        // 处理一个批次
        const batch = buffer.splice(0, this.config.batchSize)

        for (const batchItem of batch) {
          // 控制并发
          if (promises.length >= concurrencyLimit) {
            const result = await Promise.race(promises)
            const index = promises.findIndex(p => p === result)
            promises.splice(index, 1)
            yield result
          }

          const promise = this.processWithRetry(batchItem, processor)
          promises.push(promise)
        }
      }

      // 背压控制
      if (buffer.length > this.config.backpressureThreshold) {
        // 等待一些任务完成
        while (promises.length > concurrencyLimit / 2) {
          const result = await Promise.race(promises)
          const index = promises.findIndex(p => p === result)
          promises.splice(index, 1)
          yield result
        }
      }
    }

    // 处理剩余的项
    for (const item of buffer) {
      const result = await this.processWithRetry(item, processor)
      yield result
    }

    // 等待所有任务完成
    for (const promise of promises) {
      yield await promise
    }
  }

  /**
   * 创建批次
   */
  private createBatches<T>(items: T[]): T[][] {
    const batches: T[][] = []

    for (let i = 0; i < items.length; i += this.config.batchSize) {
      batches.push(items.slice(i, i + this.config.batchSize))
    }

    return batches
  }

  /**
   * 顺序处理批次
   */
  private async processSequential<T, R>(
    batches: T[][],
    processor: (item: T) => Promise<R>,
    results: R[],
    failures: Array<{ index: number, error: Error }>
  ): Promise<void> {
    let globalIndex = 0

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex]
      const batchResults = await Promise.allSettled(
        batch.map(item => this.processWithRetry(item, processor))
      )

      for (let i = 0; i < batchResults.length; i++) {
        const result = batchResults[i]

        if (result.status === 'fulfilled') {
          results.push(result.value)
          this.processedCount++
        } else {
          failures.push({ index: globalIndex + i, error: result.reason })
          this.failedCount++
          this.config.onError({
            batchIndex,
            itemIndex: i,
            error: result.reason,
            retryCount: this.config.retries,
          })
        }
      }

      globalIndex += batch.length
      this.reportProgress(globalIndex, batches.flat().length)
    }
  }

  /**
   * 并行处理批次
   */
  private async processParallel<T, R>(
    batches: T[][],
    processor: (item: T) => Promise<R>,
    results: R[],
    failures: Array<{ index: number, error: Error }>
  ): Promise<void> {
    const totalItems = batches.flat().length
    let globalIndex = 0

    // 使用并发控制
    const activeBatches = new Set<Promise<void>>()

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      // 等待空闲槽位
      while (activeBatches.size >= this.config.concurrency) {
        await Promise.race(activeBatches)
      }

      const batch = batches[batchIndex]
      const startIndex = globalIndex
      globalIndex += batch.length

      const batchPromise = this.processBatch(
        batch,
        batchIndex,
        startIndex,
        processor,
        results,
        failures
      ).then(() => {
        activeBatches.delete(batchPromise)
        this.reportProgress(this.processedCount + this.failedCount, totalItems)
      })

      activeBatches.add(batchPromise)
    }

    // 等待所有批次完成
    await Promise.all(activeBatches)
  }

  /**
   * 处理单个批次
   */
  private async processBatch<T, R>(
    batch: T[],
    batchIndex: number,
    startIndex: number,
    processor: (item: T) => Promise<R>,
    results: R[],
    failures: Array<{ index: number, error: Error }>
  ): Promise<void> {
    const batchResults = await Promise.allSettled(
      batch.map(item => this.processWithRetry(item, processor))
    )

    for (let i = 0; i < batchResults.length; i++) {
      const result = batchResults[i]

      if (result.status === 'fulfilled') {
        results[startIndex + i] = result.value
        this.processedCount++
      } else {
        failures.push({ index: startIndex + i, error: result.reason })
        this.failedCount++
        this.config.onError({
          batchIndex,
          itemIndex: i,
          error: result.reason,
          retryCount: this.config.retries,
        })
      }
    }
  }

  /**
   * 带重试的处理
   */
  private async processWithRetry<T, R>(
    item: T,
    processor: (item: T) => Promise<R>
  ): Promise<R> {
    let lastError: Error | null = null

    for (let attempt = 0; attempt <= this.config.retries; attempt++) {
      try {
        // 使用超时控制
        return await this.withTimeout(
          processor(item),
          this.config.timeout
        )
      } catch (error) {
        lastError = error as Error

        if (attempt < this.config.retries) {
          // 指数退避
          const delay = this.config.retryDelay * Math.pow(2, attempt)
          await this.sleep(delay)
        }
      }
    }

    throw lastError
  }

  /**
   * 添加超时控制
   */
  private async withTimeout<T>(
    promise: Promise<T>,
    timeout: number
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Operation timeout after ${timeout}ms`)), timeout)
    })

    return Promise.race([promise, timeoutPromise])
  }

  /**
   * 报告进度
   */
  private reportProgress(completed: number, total: number): void {
    const percentage = (completed / total) * 100

    // 计算预计剩余时间
    let estimatedTimeRemaining: number | undefined
    if (completed > 0 && this.startTime > 0) {
      const elapsed = Date.now() - this.startTime
      const rate = completed / elapsed
      const remaining = total - completed
      estimatedTimeRemaining = remaining / rate
    }

    this.config.onProgress({
      total,
      completed: this.processedCount,
      failed: this.failedCount,
      percentage,
      estimatedTimeRemaining,
    })
  }

  /**
   * 睡眠函数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

/**
 * 创建批量处理管道
 */
export function createBatchPipeline(config?: BatchPipelineConfig): BatchPipeline {
  return new BatchPipeline(config)
}

/**
 * 批量处理装饰器
 */
export function batchProcess(config?: BatchPipelineConfig) {
  const pipeline = new BatchPipeline(config)

  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const [items, ...rest] = args

      if (!Array.isArray(items)) {
        // 非数组，直接调用原方法
        return originalMethod.apply(this, args)
      }

      // 使用批量处理
      const processor = (item: any) => originalMethod.call(this, item, ...rest)
      const result = await pipeline.process(items, processor)

      // 如果有失败项，抛出错误
      if (result.failed.length > 0) {
        throw new Error(`Batch processing failed: ${result.failed.length} items failed`)
      }

      return result.successful
    }

    return descriptor
  }
}


