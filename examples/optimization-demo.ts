/**
 * @ldesign/cache 性能优化示例
 * 
 * 展示如何使用各种优化特性
 */

import {
  createOptimizedCache,
  createCache,
  TieredCache,
  StringIntern,
  SmartSerializer,
  ZeroCopyCache,
  BatchPipeline
} from '../src'

/**
 * 示例1: 基础优化使用
 */
async function basicOptimizationExample() {
  console.log('\n=== 基础优化示例 ===\n')

  // 创建标准缓存
  const standardCache = createCache()

  // 创建优化缓存
  const optimizedCache = createOptimizedCache({
    enableStringIntern: true,
    enableSmartSerializer: true,
    enableTieredCache: true,
  })

  // 测试数据
  const testData = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    profile: {
      bio: 'A long biography text...',
      interests: ['coding', 'reading', 'gaming'],
      scores: Array(100).fill(0).map(() => Math.random() * 100)
    }
  }

  // 对比性能
  console.time('Standard Cache - Set')
  for (let i = 0; i < 1000; i++) {
    await standardCache.set(`user:${i}`, testData)
  }
  console.timeEnd('Standard Cache - Set')

  console.time('Optimized Cache - Set')
  for (let i = 0; i < 1000; i++) {
    await optimizedCache.set(`user:${i}`, testData)
  }
  console.timeEnd('Optimized Cache - Set')

  // 读取性能对比
  console.time('Standard Cache - Get')
  for (let i = 0; i < 1000; i++) {
    await standardCache.get(`user:${i % 100}`)
  }
  console.timeEnd('Standard Cache - Get')

  console.time('Optimized Cache - Get')
  for (let i = 0; i < 1000; i++) {
    await optimizedCache.get(`user:${i % 100}`)
  }
  console.timeEnd('Optimized Cache - Get')

  // 显示统计
  const stats = await optimizedCache.getOptimizationStats()
  console.log('\n优化统计:', JSON.stringify(stats, null, 2))
}

/**
 * 示例2: 字符串驻留
 */
async function stringInternExample() {
  console.log('\n=== 字符串驻留示例 ===\n')

  const intern = new StringIntern({
    maxSize: 1000,
    minUsageCount: 2
  })

  // 模拟大量重复键
  const keys = []
  for (let i = 0; i < 10000; i++) {
    // 只有100个唯一键，但重复使用10000次
    const key = `cache_key_${i % 100}`
    keys.push(intern.intern(key))
  }

  // 显示内存节省
  const stats = intern.getStats()
  console.log('字符串驻留统计:')
  console.log(`  驻留池大小: ${stats.poolSize}`)
  console.log(`  命中率: ${(stats.hitRate * 100).toFixed(2)}%`)
  console.log(`  节省内存: ${(stats.memorySaved / 1024).toFixed(2)} KB`)
  console.log(`  效率: ${(stats.efficiency * 100).toFixed(2)}%`)

  // 热点字符串
  const hotStrings = intern.getHotStrings(5)
  console.log('\n热点字符串 Top 5:')
  hotStrings.forEach((item, index) => {
    console.log(`  ${index + 1}. ${item.string} (使用 ${item.count} 次)`)
  })
}

/**
 * 示例3: 分层缓存
 */
async function tieredCacheExample() {
  console.log('\n=== 分层缓存示例 ===\n')

  const tiered = new TieredCache({
    maxHotSize: 10,
    promotionThreshold: 3
  })

  // 添加数据
  for (let i = 0; i < 50; i++) {
    tiered.set(`item_${i}`, { id: i, data: `Data ${i}` })
  }

  // 模拟访问模式（部分数据频繁访问）
  console.log('模拟访问模式...')

  // 热点数据（访问多次）
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 5; j++) {
      tiered.get(`item_${i}`)
    }
  }

  // 普通数据（访问少）
  for (let i = 5; i < 50; i++) {
    tiered.get(`item_${i}`)
  }

  // 显示统计
  const stats = tiered.getStats()
  console.log('\n分层缓存统计:')
  console.log(`  热缓存大小: ${stats.hotSize}`)
  console.log(`  温缓存大小: ${stats.warmSize}`)
  console.log(`  总访问次数: ${stats.totalAccessCounts}`)
}

/**
 * 示例4: 零拷贝技术
 */
async function zeroCopyExample() {
  console.log('\n=== 零拷贝示例 ===\n')

  const zcCache = new ZeroCopyCache({
    useCopyOnWrite: true,
    useStructuredClone: true
  })

  // 大对象
  const largeObject = {
    users: Array(1000).fill(0).map((_, i) => ({
      id: i,
      name: `User ${i}`,
      email: `user${i}@example.com`,
      profile: {
        bio: 'Lorem ipsum dolor sit amet...',
        avatar: `https://example.com/avatar/${i}.jpg`,
        metadata: { created: Date.now(), updated: Date.now() }
      }
    }))
  }

  // 零拷贝存储
  console.time('Zero Copy - Set')
  zcCache.set('large', largeObject)
  console.timeEnd('Zero Copy - Set')

  // 零拷贝获取
  console.time('Zero Copy - Get')
  const ref = zcCache.getRef('large')
  console.timeEnd('Zero Copy - Get')

  // 写时复制更新
  console.time('Zero Copy - Update')
  zcCache.update('large', (data) => {
    data.users[0].name = 'Updated User'
    return data
  })
  console.timeEnd('Zero Copy - Update')

  // 统计
  const stats = zcCache.getStats()
  console.log('\n零拷贝统计:')
  console.log(`  条目数: ${stats.entries}`)
  console.log(`  总引用数: ${stats.totalRefs}`)
  console.log(`  COW修改数: ${stats.cowModified}`)
}

/**
 * 示例5: 批量操作优化
 */
async function batchOperationExample() {
  console.log('\n=== 批量操作示例 ===\n')

  const cache = createOptimizedCache()
  const pipeline = new BatchPipeline({
    batchSize: 50,
    concurrency: 4,
    onProgress: (progress) => {
      process.stdout.write(`\r进度: ${progress.percentage.toFixed(1)}% (${progress.completed}/${progress.total})`)
    }
  })

  // 准备批量数据
  const items = Array(1000).fill(0).map((_, i) => ({
    key: `batch_item_${i}`,
    value: {
      id: i,
      name: `Item ${i}`,
      timestamp: Date.now(),
      data: Array(10).fill(0).map(() => Math.random())
    }
  }))

  // 批量写入
  console.log('批量写入 1000 个项目...')
  const writeResult = await pipeline.process(
    items,
    async (item) => {
      await cache.set(item.key, item.value)
    }
  )

  console.log('\n批量写入结果:')
  console.log(`  成功: ${writeResult.successful.length}`)
  console.log(`  失败: ${writeResult.failed.length}`)
  console.log(`  耗时: ${writeResult.duration.toFixed(2)} ms`)
  console.log(`  吞吐量: ${writeResult.throughput.toFixed(2)} ops/s`)

  // 批量读取
  const keys = items.map(item => item.key)
  console.log('\n批量读取 1000 个项目...')

  console.time('Batch Get')
  const values = await cache.mget(keys)
  console.timeEnd('Batch Get')

  console.log(`成功读取: ${values.filter(v => v !== null).length} 个项目`)
}

/**
 * 示例6: 智能序列化
 */
async function smartSerializerExample() {
  console.log('\n=== 智能序列化示例 ===\n')

  const serializer = new SmartSerializer({
    enableCompression: true,
    enableCache: true
  })

  // 不同类型的数据
  const testCases = [
    { name: 'JSON对象', data: { id: 1, name: 'Test' } },
    { name: '字符串', data: 'A long string that may benefit from compression...' },
    { name: '二进制数据', data: new Uint8Array([1, 2, 3, 4, 5]) },
    { name: '大数组', data: Array(1000).fill(0).map(() => Math.random()) }
  ]

  console.log('序列化不同类型数据:')
  for (const testCase of testCases) {
    const result = serializer.serialize(testCase.data)
    console.log(`  ${testCase.name}:`)
    console.log(`    格式: ${result.format}`)
    console.log(`    大小: ${result.size} bytes`)
    console.log(`    压缩: ${result.compressed ? '是' : '否'}`)
  }

  // 序列化缓存命中率
  console.log('\n测试序列化缓存...')
  const sameData = { id: 1, value: 'cached' }

  console.time('首次序列化')
  serializer.serialize(sameData)
  console.timeEnd('首次序列化')

  console.time('缓存命中')
  serializer.serialize(sameData)
  console.timeEnd('缓存命中')

  const stats = serializer.getStats()
  console.log(`\n缓存统计: ${JSON.stringify(stats, null, 2)}`)
}

/**
 * 示例7: 内存压力响应
 */
async function memoryPressureExample() {
  console.log('\n=== 内存压力响应示例 ===\n')

  const cache = createOptimizedCache({
    maxMemory: 10 * 1024 * 1024, // 10MB
    highPressureThreshold: 0.7,
    criticalPressureThreshold: 0.9
  })

  console.log('持续写入直到触发内存压力...')

  let written = 0
  const largeData = Array(1000).fill(0).map(() => ({
    id: Math.random(),
    data: Array(100).fill('x'.repeat(100))
  }))

  try {
    for (let i = 0; i < 1000; i++) {
      await cache.set(`pressure_${i}`, largeData)
      written++

      if (i % 10 === 0) {
        const stats = await cache.getStats()
        const memUsage = stats.memory?.usage || 0
        const memLimit = stats.memory?.limit || 1
        const percentage = (memUsage / memLimit * 100).toFixed(1)

        process.stdout.write(`\r已写入: ${written} 项, 内存使用: ${percentage}%`)
      }
    }
  } catch (error) {
    console.log(`\n\n内存压力触发: ${error}`)
  }

  console.log(`\n最终写入: ${written} 项`)

  // 响应内存压力
  console.log('\n执行内存优化...')
  cache.respondToMemoryPressure('high')

  const finalStats = await cache.getStats()
  console.log('优化后统计:', JSON.stringify(finalStats, null, 2))
}

/**
 * 主函数
 */
async function main() {
  console.log('===================================')
  console.log(' @ldesign/cache 性能优化示例')
  console.log('===================================')

  // 运行各个示例
  await basicOptimizationExample()
  await stringInternExample()
  await tieredCacheExample()
  await zeroCopyExample()
  await batchOperationExample()
  await smartSerializerExample()
  await memoryPressureExample()

  console.log('\n===================================')
  console.log(' 所有示例执行完成！')
  console.log('===================================')
}

// 运行示例
if (require.main === module) {
  main().catch(console.error)
}

export {
  basicOptimizationExample,
  stringInternExample,
  tieredCacheExample,
  zeroCopyExample,
  batchOperationExample,
  smartSerializerExample,
  memoryPressureExample
}
