/**
 * 基础使用示例
 */

import { CacheManager, CacheStrategy } from '../src'

// ============================================================
// 示例 1: LRU 缓存
// ============================================================
console.log('=== LRU 缓存示例 ===')

const lruCache = new CacheManager<string>({
  strategy: CacheStrategy.LRU,
  maxSize: 3,
  enableStats: true,
})

// 设置缓存
lruCache.set('key1', 'value1')
lruCache.set('key2', 'value2')
lruCache.set('key3', 'value3')

console.log('缓存大小:', lruCache.size) // 3

// 访问 key1，使其成为最近使用
lruCache.get('key1')

// 添加新项，key2 会被淘汰（最久未使用）
lruCache.set('key4', 'value4')

console.log('key2 是否存在:', lruCache.has('key2')) // false
console.log('key1 是否存在:', lruCache.has('key1')) // true

// ============================================================
// 示例 2: LFU 缓存
// ============================================================
console.log('\n=== LFU 缓存示例 ===')

const lfuCache = new CacheManager<string>({
  strategy: CacheStrategy.LFU,
  maxSize: 3,
})

lfuCache.set('key1', 'value1')
lfuCache.set('key2', 'value2')
lfuCache.set('key3', 'value3')

// 多次访问 key1，增加其频率
lfuCache.get('key1')
lfuCache.get('key1')
lfuCache.get('key1')

// 访问 key2 一次
lfuCache.get('key2')

// 添加新项，key3 会被淘汰（频率最低）
lfuCache.set('key4', 'value4')

console.log('key3 是否存在:', lfuCache.has('key3')) // false
console.log('key1 是否存在:', lfuCache.has('key1')) // true

// ============================================================
// 示例 3: TTL 缓存
// ============================================================
console.log('\n=== TTL 缓存示例 ===')

const ttlCache = new CacheManager<string>({
  strategy: CacheStrategy.TTL,
  defaultTTL: 2000, // 2 秒过期
  cleanupInterval: 500, // 每 500ms 清理一次
})

ttlCache.set('key1', 'value1')
ttlCache.set('key2', 'value2', 5000) // 自定义 5 秒过期

console.log('立即获取 key1:', ttlCache.get('key1')) // 'value1'

// 2 秒后
setTimeout(() => {
  console.log('2 秒后获取 key1:', ttlCache.get('key1')) // undefined (已过期)
  console.log('2 秒后获取 key2:', ttlCache.get('key2')) // 'value2' (还未过期)
}, 2100)

// ============================================================
// 示例 4: 事件监听
// ============================================================
console.log('\n=== 事件监听示例 ===')

const eventCache = new CacheManager<string>({
  strategy: CacheStrategy.LRU,
  maxSize: 2,
  enableStats: true,
})

// 监听缓存命中
eventCache.on('hit', (event) => {
  console.log('✅ 缓存命中:', event.key)
})

// 监听缓存未命中
eventCache.on('miss', (event) => {
  console.log('❌ 缓存未命中:', event.key)
})

// 监听缓存淘汰
eventCache.on('evict', (event) => {
  console.log('🗑️  缓存淘汰:', event.key, '=', event.value)
})

eventCache.set('key1', 'value1')
eventCache.set('key2', 'value2')

eventCache.get('key1') // 命中
eventCache.get('key3') // 未命中

eventCache.set('key3', 'value3') // 淘汰 key2

// ============================================================
// 示例 5: 批量操作
// ============================================================
console.log('\n=== 批量操作示例 ===')

const batchCache = new CacheManager<number>({
  strategy: CacheStrategy.LRU,
  maxSize: 100,
})

// 批量设置
batchCache.mset([
  ['num1', 1],
  ['num2', 2],
  ['num3', 3],
  ['num4', 4],
  ['num5', 5],
])

// 批量获取
const values = batchCache.mget(['num1', 'num2', 'num3'])
console.log('批量获取结果:', values)

// 批量删除
batchCache.mdel(['num1', 'num2'])
console.log('删除后缓存大小:', batchCache.size)

// ============================================================
// 示例 6: 统计信息
// ============================================================
console.log('\n=== 统计信息示例 ===')

const statsCache = new CacheManager<string>({
  strategy: CacheStrategy.LRU,
  maxSize: 10,
  enableStats: true,
})

// 执行一些操作
for (let i = 0; i < 10; i++) {
  statsCache.set(`key${i}`, `value${i}`)
}

for (let i = 0; i < 5; i++) {
  statsCache.get(`key${i}`) // 命中
}

statsCache.get('nonexistent') // 未命中

const stats = statsCache.getStats()
console.log('统计信息:', {
  size: stats.size,
  totalRequests: stats.totalRequests,
  hits: stats.hits,
  misses: stats.misses,
  hitRate: `${(stats.hitRate * 100).toFixed(2)}%`,
})

