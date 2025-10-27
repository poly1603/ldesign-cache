/**
 * 性能比较基准测试
 * 
 * 对比原始 CacheManager 和优化的 OptimizedCacheManager 的性能
 */

import { CacheManager } from '../src/core/cache-manager'
import { OptimizedCacheManager } from '../src/core/cache-manager-optimized'
import { MemoryEngine } from '../src/engines/memory-engine'

interface BenchmarkResult {
  name: string
  operations: number
  duration: number
  opsPerSecond: number
  memoryUsed: number
  memoryDelta: number
}

/**
 * 基准测试工具类
 */
class Benchmark {
  private results: BenchmarkResult[] = []

  /**
   * 运行基准测试
   */
  async run(
    name: string,
    setup: () => Promise<any>,
    test: (context: any) => Promise<void>,
    operations = 10000
  ): Promise<BenchmarkResult> {
    // 运行设置
    const context = await setup()

    // 记录初始内存
    const memBefore = this.getMemoryUsage()

    // 预热
    for (let i = 0; i < 100; i++) {
      await test(context)
    }

    // 运行测试
    const startTime = performance.now()

    for (let i = 0; i < operations; i++) {
      await test(context)
    }

    const endTime = performance.now()
    const duration = endTime - startTime

    // 记录最终内存
    const memAfter = this.getMemoryUsage()

    const result: BenchmarkResult = {
      name,
      operations,
      duration,
      opsPerSecond: (operations / duration) * 1000,
      memoryUsed: memAfter,
      memoryDelta: memAfter - memBefore,
    }

    this.results.push(result)
    return result
  }

  /**
   * 获取内存使用情况
   */
  private getMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed
    }

    // 浏览器环境
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      return (performance as any).memory.usedJSHeapSize
    }

    return 0
  }

  /**
   * 打印结果
   */
  printResults(): void {
    console.log('\n=== 性能测试结果 ===\n')

    const maxNameLength = Math.max(...this.results.map(r => r.name.length))

    console.log(
      'Test'.padEnd(maxNameLength + 2),
      'Ops/sec'.padStart(12),
      'Time(ms)'.padStart(12),
      'Memory(MB)'.padStart(12),
      'MemDelta(MB)'.padStart(14)
    )
    console.log('-'.repeat(maxNameLength + 2 + 12 + 12 + 12 + 14 + 6))

    for (const result of this.results) {
      console.log(
        result.name.padEnd(maxNameLength + 2),
        result.opsPerSecond.toFixed(2).padStart(12),
        result.duration.toFixed(2).padStart(12),
        (result.memoryUsed / 1024 / 1024).toFixed(2).padStart(12),
        (result.memoryDelta / 1024 / 1024).toFixed(2).padStart(14)
      )
    }

    // 计算改进百分比
    if (this.results.length >= 2) {
      console.log('\n=== 性能提升 ===\n')
      const baseline = this.results[0]

      for (let i = 1; i < this.results.length; i++) {
        const result = this.results[i]
        const speedup = (result.opsPerSecond / baseline.opsPerSecond - 1) * 100
        const memImprovement = (1 - result.memoryDelta / baseline.memoryDelta) * 100

        console.log(`${result.name} vs ${baseline.name}:`)
        console.log(`  速度提升: ${speedup > 0 ? '+' : ''}${speedup.toFixed(2)}%`)
        console.log(`  内存优化: ${memImprovement > 0 ? '+' : ''}${memImprovement.toFixed(2)}%`)
        console.log()
      }
    }
  }

  /**
   * 重置结果
   */
  reset(): void {
    this.results = []
  }
}

/**
 * 测试数据生成器
 */
class TestDataGenerator {
  /**
   * 生成随机字符串
   */
  static randomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  /**
   * 生成测试对象
   */
  static generateObject(size: 'small' | 'medium' | 'large'): any {
    switch (size) {
      case 'small':
        return {
          id: Math.random(),
          name: this.randomString(10),
          value: Math.random() * 100,
        }

      case 'medium':
        return {
          id: Math.random(),
          name: this.randomString(50),
          description: this.randomString(200),
          tags: Array(10).fill(0).map(() => this.randomString(5)),
          metadata: {
            created: Date.now(),
            updated: Date.now(),
            version: 1,
          },
        }

      case 'large':
        return {
          id: Math.random(),
          name: this.randomString(100),
          description: this.randomString(1000),
          content: this.randomString(5000),
          tags: Array(50).fill(0).map(() => this.randomString(10)),
          metadata: {
            created: Date.now(),
            updated: Date.now(),
            version: 1,
            author: this.randomString(20),
            properties: Array(20).fill(0).reduce((acc, _, i) => {
              acc[`prop${i}`] = this.randomString(50)
              return acc
            }, {}),
          },
        }
    }
  }
}

/**
 * 运行性能测试
 */
async function runPerformanceTests() {
  const benchmark = new Benchmark()

  console.log('准备测试数据...')

  // 准备测试数据
  const smallObjects = Array(1000).fill(0).map(() => TestDataGenerator.generateObject('small'))
  const mediumObjects = Array(1000).fill(0).map(() => TestDataGenerator.generateObject('medium'))
  const largeObjects = Array(100).fill(0).map(() => TestDataGenerator.generateObject('large'))
  const keys = Array(10000).fill(0).map((_, i) => `key_${i}`)

  // 测试1: 小对象写入
  console.log('\n测试1: 小对象写入性能')

  await benchmark.run(
    'CacheManager - 小对象写入',
    async () => {
      const cache = new CacheManager({
        defaultEngine: 'memory',
        cleanupInterval: 0
      })
      return { cache, index: 0 }
    },
    async (ctx) => {
      const obj = smallObjects[ctx.index % smallObjects.length]
      await ctx.cache.set(`small_${ctx.index}`, obj)
      ctx.index++
    }
  )

  await benchmark.run(
    'OptimizedCacheManager - 小对象写入',
    async () => {
      const cache = new OptimizedCacheManager({
        defaultEngine: 'memory',
        cleanupInterval: 0
      })
      return { cache, index: 0 }
    },
    async (ctx) => {
      const obj = smallObjects[ctx.index % smallObjects.length]
      await ctx.cache.set(`small_${ctx.index}`, obj)
      ctx.index++
    }
  )

  // 测试2: 读取性能
  console.log('\n测试2: 读取性能')

  await benchmark.run(
    'CacheManager - 读取',
    async () => {
      const cache = new CacheManager({
        defaultEngine: 'memory',
        cleanupInterval: 0
      })
      // 预填充数据
      for (let i = 0; i < 1000; i++) {
        await cache.set(keys[i], smallObjects[i % smallObjects.length])
      }
      return { cache, index: 0 }
    },
    async (ctx) => {
      await ctx.cache.get(keys[ctx.index % 1000])
      ctx.index++
    }
  )

  await benchmark.run(
    'OptimizedCacheManager - 读取',
    async () => {
      const cache = new OptimizedCacheManager({
        defaultEngine: 'memory',
        cleanupInterval: 0
      })
      // 预填充数据
      for (let i = 0; i < 1000; i++) {
        await cache.set(keys[i], smallObjects[i % smallObjects.length])
      }
      return { cache, index: 0 }
    },
    async (ctx) => {
      await ctx.cache.get(keys[ctx.index % 1000])
      ctx.index++
    }
  )

  // 测试3: 批量操作
  console.log('\n测试3: 批量操作性能')

  await benchmark.run(
    'CacheManager - 批量写入',
    async () => {
      const cache = new CacheManager({
        defaultEngine: 'memory',
        cleanupInterval: 0
      })
      return { cache, index: 0 }
    },
    async (ctx) => {
      const items = Array(50).fill(0).map((_, i) => ({
        key: `batch_${ctx.index}_${i}`,
        value: smallObjects[i % smallObjects.length],
      }))
      await ctx.cache.mset(items)
      ctx.index++
    },
    200
  )

  await benchmark.run(
    'OptimizedCacheManager - 批量写入',
    async () => {
      const cache = new OptimizedCacheManager({
        defaultEngine: 'memory',
        cleanupInterval: 0
      })
      return { cache, index: 0 }
    },
    async (ctx) => {
      const items = Array(50).fill(0).map((_, i) => ({
        key: `batch_${ctx.index}_${i}`,
        value: smallObjects[i % smallObjects.length],
      }))
      await ctx.cache.mset(items)
      ctx.index++
    },
    200
  )

  // 测试4: 大对象处理
  console.log('\n测试4: 大对象处理')

  await benchmark.run(
    'CacheManager - 大对象',
    async () => {
      const cache = new CacheManager({
        defaultEngine: 'memory',
        cleanupInterval: 0
      })
      return { cache, index: 0 }
    },
    async (ctx) => {
      const obj = largeObjects[ctx.index % largeObjects.length]
      await ctx.cache.set(`large_${ctx.index}`, obj)
      const retrieved = await ctx.cache.get(`large_${ctx.index}`)
      ctx.index++
    },
    1000
  )

  await benchmark.run(
    'OptimizedCacheManager - 大对象',
    async () => {
      const cache = new OptimizedCacheManager({
        defaultEngine: 'memory',
        cleanupInterval: 0
      })
      return { cache, index: 0 }
    },
    async (ctx) => {
      const obj = largeObjects[ctx.index % largeObjects.length]
      await ctx.cache.set(`large_${ctx.index}`, obj)
      const retrieved = await ctx.cache.get(`large_${ctx.index}`)
      ctx.index++
    },
    1000
  )

  // 测试5: 热点键访问
  console.log('\n测试5: 热点键访问')

  await benchmark.run(
    'CacheManager - 热点键',
    async () => {
      const cache = new CacheManager({
        defaultEngine: 'memory',
        cleanupInterval: 0
      })
      // 预填充热点数据
      for (let i = 0; i < 10; i++) {
        await cache.set(`hot_${i}`, mediumObjects[i])
      }
      return { cache, index: 0 }
    },
    async (ctx) => {
      // 80%访问热点键
      const key = Math.random() < 0.8
        ? `hot_${Math.floor(Math.random() * 10)}`
        : `cold_${Math.floor(Math.random() * 1000)}`
      await ctx.cache.get(key)
      ctx.index++
    }
  )

  await benchmark.run(
    'OptimizedCacheManager - 热点键',
    async () => {
      const cache = new OptimizedCacheManager({
        defaultEngine: 'memory',
        cleanupInterval: 0
      })
      // 预填充热点数据
      for (let i = 0; i < 10; i++) {
        await cache.set(`hot_${i}`, mediumObjects[i])
      }
      return { cache, index: 0 }
    },
    async (ctx) => {
      // 80%访问热点键
      const key = Math.random() < 0.8
        ? `hot_${Math.floor(Math.random() * 10)}`
        : `cold_${Math.floor(Math.random() * 1000)}`
      await ctx.cache.get(key)
      ctx.index++
    }
  )

  // 打印结果
  benchmark.printResults()
}

/**
 * 运行内存压力测试
 */
async function runMemoryStressTest() {
  console.log('\n\n=== 内存压力测试 ===\n')

  const testDuration = 30000 // 30秒
  const reportInterval = 5000 // 每5秒报告一次

  console.log('测试1: CacheManager 内存压力测试')

  const cache1 = new CacheManager({
    defaultEngine: 'memory',
    maxMemory: 50 * 1024 * 1024, // 50MB
  })

  let operations1 = 0
  const startTime1 = Date.now()
  const memStart1 = process.memoryUsage().heapUsed

  const interval1 = setInterval(() => {
    const elapsed = Date.now() - startTime1
    const memUsed = process.memoryUsage().heapUsed - memStart1
    console.log(`  ${elapsed / 1000}s: ${operations1} ops, ${(memUsed / 1024 / 1024).toFixed(2)} MB`)
  }, reportInterval)

  // 持续写入直到时间结束
  while (Date.now() - startTime1 < testDuration) {
    try {
      const key = `stress_${operations1}`
      const value = TestDataGenerator.generateObject(
        operations1 % 3 === 0 ? 'large' : operations1 % 2 === 0 ? 'medium' : 'small'
      )
      await cache1.set(key, value)
      operations1++
    } catch (error) {
      console.log(`  内存压力触发: ${error}`)
      break
    }
  }

  clearInterval(interval1)

  console.log(`\n测试2: OptimizedCacheManager 内存压力测试`)

  const cache2 = new OptimizedCacheManager({
    defaultEngine: 'memory',
    maxMemory: 50 * 1024 * 1024, // 50MB
  })

  let operations2 = 0
  const startTime2 = Date.now()
  const memStart2 = process.memoryUsage().heapUsed

  const interval2 = setInterval(() => {
    const elapsed = Date.now() - startTime2
    const memUsed = process.memoryUsage().heapUsed - memStart2
    console.log(`  ${elapsed / 1000}s: ${operations2} ops, ${(memUsed / 1024 / 1024).toFixed(2)} MB`)
  }, reportInterval)

  // 持续写入直到时间结束
  while (Date.now() - startTime2 < testDuration) {
    try {
      const key = `stress_${operations2}`
      const value = TestDataGenerator.generateObject(
        operations2 % 3 === 0 ? 'large' : operations2 % 2 === 0 ? 'medium' : 'small'
      )
      await cache2.set(key, value)
      operations2++
    } catch (error) {
      console.log(`  内存压力触发: ${error}`)
      break
    }
  }

  clearInterval(interval2)

  console.log('\n内存压力测试结果:')
  console.log(`  CacheManager: ${operations1} 次操作`)
  console.log(`  OptimizedCacheManager: ${operations2} 次操作`)
  console.log(`  性能提升: ${((operations2 / operations1 - 1) * 100).toFixed(2)}%`)
}

/**
 * 主函数
 */
async function main() {
  console.log('=== @ldesign/cache 性能对比测试 ===\n')
  console.log(`Node.js: ${process.version}`)
  console.log(`平台: ${process.platform} ${process.arch}`)
  console.log(`内存: ${(process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2)} MB`)
  console.log()

  // 运行性能测试
  await runPerformanceTests()

  // 运行内存压力测试（仅在 Node.js 环境）
  if (typeof process !== 'undefined' && process.memoryUsage) {
    await runMemoryStressTest()
  }
}

// 执行测试
if (require.main === module) {
  main().catch(console.error)
}

export { Benchmark, TestDataGenerator }

