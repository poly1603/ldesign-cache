<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import {
  CacheManager,
  CacheStrategy,
  type CachePlugin,
  CacheProvider,
  cacheStateKeys,
  useCache,
  useCacheQuery,
  useSWR,
} from '@ldesign/cache-vue'
import { useEngine } from '@ldesign/engine-vue3'
import {
  BookOpen,
  Box,
  Braces,
  Database,
  FileCode,
  Filter,
  Gauge,
  HardDrive,
  Layers,
  MousePointerClick,
  Network,
  Plug,
  RefreshCw,
  Server,
  Table,
} from 'lucide-vue-next'

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const engine = useEngine()
const {
  cache,
  stats,
  set,
  get,
  mset,
  mget,
  mdel,
  invalidateByTag,
  invalidateByNamespace,
} = useCache<any>({ autoCleanup: false })

const basicKey = ref('用户:1001')
const basicName = ref('张三')
const basicRead = ref('')

function handleBasicSet() {
  set(basicKey.value, { name: basicName.value, updatedAt: Date.now() }, {
    ttl: 10_000,
    tags: ['用户', '基础'],
    namespace: '基础演示',
    priority: 8,
  })
}

function handleBasicGet() {
  const result = get(basicKey.value) as { name?: string } | undefined
  basicRead.value = result?.name ?? '未命中'
}

function handleBasicDelete() {
  cache.delete(basicKey.value)
  basicRead.value = '已删除'
}

const strategyResult = ref<Record<string, string[]>>({})

function runStrategyCompare() {
  const result: Record<string, string[]> = {}

  const lru = new CacheManager<string>({ strategy: CacheStrategy.LRU, maxSize: 2 })
  lru.set('A', 'A')
  lru.set('B', 'B')
  lru.get('A')
  lru.set('C', 'C')
  result.LRU = lru.keys()
  lru.destroy()

  const lfu = new CacheManager<string>({ strategy: CacheStrategy.LFU, maxSize: 2 })
  lfu.set('A', 'A')
  lfu.set('B', 'B')
  lfu.get('A')
  lfu.get('A')
  lfu.set('C', 'C')
  result.LFU = lfu.keys()
  lfu.destroy()

  const fifo = new CacheManager<string>({ strategy: CacheStrategy.FIFO, maxSize: 2 })
  fifo.set('A', 'A')
  fifo.set('B', 'B')
  fifo.get('A')
  fifo.set('C', 'C')
  result.FIFO = fifo.keys()
  fifo.destroy()

  strategyResult.value = result
}

function seedInvalidateData() {
  set('内容:首页', { title: '首页' }, { tags: ['内容'], namespace: '页面' })
  set('内容:详情', { title: '详情' }, { tags: ['内容'], namespace: '页面' })
  set('账户:资料', { title: '资料' }, { tags: ['账户'], namespace: '用户' })
}

const invalidateReport = ref('')

function clearByTag() {
  const removed = invalidateByTag('内容')
  invalidateReport.value = `按标签清除完成，删除 ${removed} 条`
}

function clearByNamespace() {
  const removed = invalidateByNamespace('用户')
  invalidateReport.value = `按命名空间清除完成，删除 ${removed} 条`
}

const batchReport = ref('')

function runBatchDemo() {
  mset([
    ['批量:1', { value: 'A' }],
    ['批量:2', { value: 'B' }],
    ['批量:3', { value: 'C' }],
  ], {
    namespace: '批量演示',
    tags: ['批量'],
    ttl: 20_000,
  })

  const got = Array.from(mget(['批量:1', '批量:2', '批量:3']).entries())
  mdel(['批量:1', '批量:3'])
  batchReport.value = `mget 返回 ${JSON.stringify(got)}`
}

const queryCounter = ref(0)
const {
  data: queryData,
  loading: queryLoading,
  isFromCache: queryFromCache,
  isStale: queryIsStale,
  execute: executeQuery,
  refetch: refetchQuery,
} = useCacheQuery<{ count: number, time: number }>({
  cache,
  key: '查询:去重',
  queryFn: async () => {
    queryCounter.value += 1
    await wait(700)
    return {
      count: queryCounter.value,
      time: Date.now(),
    }
  },
  dedupe: true,
  staleTime: 2000,
  swr: true,
  retryCount: 1,
  retryDelay: 200,
  immediate: false,
  ttl: 10_000,
  tags: ['查询'],
  namespace: '查询演示',
})

async function runDedupeDemo() {
  await Promise.all([executeQuery(), executeQuery(), executeQuery()])
}

const swrCounter = ref(0)
const {
  data: swrData,
  isValidating: swrValidating,
  isFromCache: swrFromCache,
  isStale: swrIsStale,
  mutate: swrMutate,
  revalidate: swrRevalidate,
} = useSWR<{ version: number, updatedAt: number }>({
  cache,
  key: '查询:swr',
  fetcher: async () => {
    swrCounter.value += 1
    await wait(500)
    return {
      version: swrCounter.value,
      updatedAt: Date.now(),
    }
  },
  staleTime: 1000,
  ttl: 10_000,
  immediate: true,
  errorRetryCount: 1,
  errorRetryInterval: 200,
})

const persistenceInput = ref('本地持久化示例')
const persistenceRead = ref('')

function savePersistence() {
  set('持久化:文本', persistenceInput.value, {
    namespace: '持久化演示',
    tags: ['持久化'],
    ttl: 60_000,
  })
  readPersistence()
}

function readPersistence() {
  persistenceRead.value = String(get('持久化:文本') ?? '未读取到')
}

const hookLogs = ref<string[]>([])

const hookPlugin: CachePlugin<string> = {
  name: 'playground-hook-plugin',
  beforeSet(key, value) {
    hookLogs.value.unshift(`beforeSet -> ${key}:${value}`)
  },
  afterSet(key) {
    hookLogs.value.unshift(`afterSet -> ${key}`)
  },
  beforeGet(key) {
    hookLogs.value.unshift(`beforeGet -> ${key}`)
  },
  afterGet(key, value) {
    hookLogs.value.unshift(`afterGet -> ${key}:${value ?? 'undefined'}`)
  },
  beforeDelete(key) {
    hookLogs.value.unshift(`beforeDelete -> ${key}`)
  },
  afterDelete(key, success) {
    hookLogs.value.unshift(`afterDelete -> ${key}:${success}`)
  },
}

const hookCache = new CacheManager<string>({
  maxSize: 10,
  plugins: [hookPlugin],
})

function runHookDemo() {
  hookLogs.value = []
  hookCache.set('hook:key', 'hook-value')
  hookCache.get('hook:key')
  hookCache.delete('hook:key')
}

const directiveFetchCount = ref(0)
async function fetchDirectiveText() {
  directiveFetchCount.value += 1
  await wait(300)
  return `指令请求第 ${directiveFetchCount.value} 次`
}

const providerInput = ref('Provider 写入值')
const providerRead = ref('')

const engineManagerReady = computed(() => Boolean(engine.state.get(cacheStateKeys.MANAGER)))
const engineApi = computed<any>(() => engine.api.get('cache'))
const engineApiRead = ref('')

function writeByEngineApi() {
  engineApi.value?.set('Engine:API', '通过 engine.api 写入', {
    namespace: 'Engine',
    tags: ['Engine'],
  })
}

function readByEngineApi() {
  engineApiRead.value = engineApi.value?.get('Engine:API') ?? '未命中'
}

const nativePluginSnippet = `import { createApp } from 'vue'
import App from './App.vue'
import { createCachePlugin } from '@ldesign/cache-vue'

const app = createApp(App)
app.use(createCachePlugin({
  strategy: 'lru',
  maxSize: 200,
  defaultTTL: 15000,
  enablePersistence: true,
  storageType: 'localStorage',
  storagePrefix: 'cache-demo:',
}))
app.mount('#app')`

onMounted(() => {
  readPersistence()
  seedInvalidateData()
  runStrategyCompare()
})

onUnmounted(() => {
  hookCache.destroy()
})
</script>

<template>
  <div class="page">
    <header class="hero">
      <div class="hero-title">
        <Server :size="26" />
        <h1>Cache Core/Vue 重构功能总览</h1>
      </div>
      <p>当前页面基于 Engine 模式启动，覆盖 core 与 vue 适配层全部关键能力。</p>
    </header>

    <section class="grid">
      <article class="card">
        <h2><Database :size="18" /> 基础读写与统计</h2>
        <div class="row">
          <input v-model="basicKey" placeholder="缓存键" />
          <input v-model="basicName" placeholder="姓名" />
        </div>
        <div class="row">
          <button @click="handleBasicSet">写入</button>
          <button @click="handleBasicGet">读取</button>
          <button @click="handleBasicDelete">删除</button>
        </div>
        <p>读取结果：{{ basicRead }}</p>
        <p>当前大小：{{ stats.size }}，命中率：{{ (stats.hitRate * 100).toFixed(1) }}%</p>
      </article>

      <article class="card">
        <h2><Gauge :size="18" /> 策略对比（LRU/LFU/FIFO）</h2>
        <button @click="runStrategyCompare">重新运行对比</button>
        <p>每种策略容量为 2，写入 A/B 后再写入 C：</p>
        <ul>
          <li>LRU 保留：{{ strategyResult.LRU?.join('、') }}</li>
          <li>LFU 保留：{{ strategyResult.LFU?.join('、') }}</li>
          <li>FIFO 保留：{{ strategyResult.FIFO?.join('、') }}</li>
        </ul>
      </article>

      <article class="card">
        <h2><Filter :size="18" /> 标签/命名空间失效</h2>
        <p>预置了内容与用户两类数据，可按标签或命名空间清理。</p>
        <div class="row">
          <button @click="seedInvalidateData">重置示例数据</button>
          <button @click="clearByTag">按标签清理（内容）</button>
          <button @click="clearByNamespace">按命名空间清理（用户）</button>
        </div>
        <p>{{ invalidateReport }}</p>
      </article>

      <article class="card">
        <h2><Table :size="18" /> 批量操作</h2>
        <button @click="runBatchDemo">执行 mset/mget/mdel</button>
        <p>{{ batchReport }}</p>
      </article>

      <article class="card">
        <h2><Network :size="18" /> 去重查询与 SWR</h2>
        <div class="row">
          <button @click="runDedupeDemo">并发触发 3 次去重请求</button>
          <button @click="refetchQuery">强制重新请求</button>
        </div>
        <p>去重网络调用次数：{{ queryCounter }}</p>
        <p>query 数据：{{ queryData }}</p>
        <p>query 状态：loading={{ queryLoading }} fromCache={{ queryFromCache }} stale={{ queryIsStale }}</p>
        <div class="row">
          <button @click="swrRevalidate">SWR 重新验证</button>
          <button @click="swrMutate({ version: 999, updatedAt: Date.now() })">本地 mutate</button>
        </div>
        <p>SWR 数据：{{ swrData }}</p>
        <p>SWR 状态：validating={{ swrValidating }} fromCache={{ swrFromCache }} stale={{ swrIsStale }}</p>
      </article>

      <article class="card">
        <h2><HardDrive :size="18" /> 持久化</h2>
        <p>当前主缓存开启了 localStorage 持久化，刷新页面后仍可读取。</p>
        <div class="row">
          <input v-model="persistenceInput" placeholder="输入要持久化的文本" />
          <button @click="savePersistence">写入持久化</button>
          <button @click="readPersistence">读取</button>
        </div>
        <p>读取结果：{{ persistenceRead }}</p>
      </article>

      <article class="card">
        <h2><Plug :size="18" /> 插件钩子链路</h2>
        <button @click="runHookDemo">执行 set/get/delete</button>
        <ul class="log-list">
          <li v-for="(line, index) in hookLogs" :key="`${line}-${index}`">{{ line }}</li>
        </ul>
      </article>

      <article class="card">
        <h2><MousePointerClick :size="18" /> 指令/组件/装饰器</h2>
        <p>指令示例（v-cache）：</p>
        <p class="directive-box" v-cache="{ key: '指令:文本', fetcher: fetchDirectiveText, ttl: 5000, tags: ['指令'], namespace: '指令演示' }">
          指令加载中
        </p>
        <p>组件示例（CacheProvider）：</p>
        <CacheProvider :options="{ namespace: 'Provider演示', maxSize: 20 }" v-slot="{ cache: providerCache }">
          <div class="row">
            <input v-model="providerInput" placeholder="Provider 写入值" />
            <button @click="providerCache.set('组件:值', providerInput, { ttl: 8000 })">写入 Provider</button>
            <button @click="providerRead = String(providerCache.get('组件:值') ?? '未命中')">读取 Provider</button>
          </div>
        </CacheProvider>
        <p>Provider 读取：{{ providerRead }}</p>
        <p>装饰器示例代码：</p>
        <pre class="code-mini">@Cacheable({ cache, ttl: 10000, namespace: '服务层', tags: ['接口'] })
async getUser(id: string) {
  return request(`/api/user/${id}`)
}</pre>
      </article>

      <article class="card">
        <h2><Layers :size="18" /> Engine 状态与 API 集成</h2>
        <p>stateKeys.cache:manager 已注册：{{ engineManagerReady }}</p>
        <div class="row">
          <button @click="writeByEngineApi">通过 engine.api 写入</button>
          <button @click="readByEngineApi">通过 engine.api 读取</button>
        </div>
        <p>读取结果：{{ engineApiRead }}</p>
      </article>

      <article class="card full">
        <h2><FileCode :size="18" /> 原生 Vue 插件接入对照</h2>
        <p>playground 仅运行 Engine 模式。下方是原生 Vue 项目接入 `createCachePlugin` 的完整示例：</p>
        <pre>{{ nativePluginSnippet }}</pre>
      </article>

      <article class="card full">
        <h2><Braces :size="18" /> 当前核心能力清单</h2>
        <ul>
          <li>缓存策略：LRU/LFU/FIFO/TTL</li>
          <li>写入元信息：ttl、tags、namespace、priority</li>
          <li>失效能力：invalidateByTag / invalidateByNamespace / invalidateWhere</li>
          <li>查询增强：请求去重、SWR、prefetch/revalidate</li>
          <li>批量能力：mset / mget / mdel</li>
          <li>插件钩子：init、before*/after*、destroy</li>
          <li>Engine 集成：state/event/api + getInstance/getContext</li>
          <li>Vue 适配：原生插件与 Engine 插件双形态</li>
        </ul>
      </article>

      <article class="card full">
        <h2><BookOpen :size="18" /> 使用提示</h2>
        <p>你可以在开发者工具中查看 localStorage 的 <code>cache-playground:</code> 前缀数据，或通过 engine 实例观察 state/events/api 的实时变化。</p>
      </article>
    </section>

    <footer class="foot">
      <RefreshCw :size="15" />
      <span>Engine 运行中，缓存条目 {{ stats.size }}，总请求 {{ stats.totalRequests }}</span>
    </footer>
  </div>
</template>

<style scoped>
.page {
  max-width: 1320px;
  margin: 0 auto;
  padding: 28px 22px 36px;
}

.hero {
  background: linear-gradient(120deg, #fff 0%, #fff8ef 55%, #eef8fb 100%);
  border: 1px solid var(--line);
  border-radius: calc(var(--radius) + 8px);
  padding: 24px;
  box-shadow: var(--shadow);
  transform: translateY(10px);
  animation: rise 0.45s ease forwards;
}

.hero-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.hero h1 {
  margin: 0;
  font-size: 30px;
  letter-spacing: 0.02em;
}

.hero p {
  margin: 10px 0 0;
  color: var(--text-soft);
}

.grid {
  margin-top: 18px;
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 14px;
}

.card {
  grid-column: span 6;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 16px;
  box-shadow: 0 10px 22px rgba(0, 0, 0, 0.04);
  animation: rise 0.35s ease;
}

.card.full {
  grid-column: span 12;
}

.card h2 {
  margin: 0 0 12px;
  font-size: 17px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.card p {
  margin: 8px 0;
  color: var(--text-soft);
  line-height: 1.55;
}

.row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}

input {
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 8px 10px;
  min-width: 160px;
  background: #fffdf9;
}

button {
  border: 0;
  border-radius: 10px;
  padding: 8px 12px;
  color: #fff;
  background: linear-gradient(120deg, var(--accent), #ec8d2f);
  cursor: pointer;
}

button:hover {
  filter: brightness(1.05);
}

ul {
  margin: 8px 0 0;
  padding-left: 18px;
}

pre {
  background: #17212a;
  color: #d7f0ff;
  border-radius: 12px;
  padding: 12px;
  overflow: auto;
  line-height: 1.55;
}

.code-mini {
  margin: 8px 0 0;
  white-space: pre-wrap;
}

.directive-box {
  border: 1px dashed var(--accent-2);
  border-radius: 10px;
  background: #f4fbfd;
  padding: 12px;
  color: #13444f;
}

.log-list {
  max-height: 140px;
  overflow: auto;
}

.foot {
  margin-top: 16px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: var(--text-soft);
  padding: 8px 12px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: #fff;
}

@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 980px) {
  .card,
  .card.full {
    grid-column: span 12;
  }

  .hero h1 {
    font-size: 24px;
  }
}
</style>
