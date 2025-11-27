<template>
  <div class="cache-demo">
    <h1>缓存管理示例</h1>

    <!-- 缓存统计 -->
    <div class="stats-panel">
      <h2>缓存统计</h2>
      <div class="stats-grid">
        <div class="stat-item">
          <span class="stat-label">缓存大小</span>
          <span class="stat-value">{{ size }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">总请求</span>
          <span class="stat-value">{{ stats.totalRequests }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">命中次数</span>
          <span class="stat-value">{{ stats.hits }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">未命中</span>
          <span class="stat-value">{{ stats.misses }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">命中率</span>
          <span class="stat-value">{{ (stats.hitRate * 100).toFixed(2) }}%</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">淘汰次数</span>
          <span class="stat-value">{{ stats.evictions }}</span>
        </div>
      </div>
    </div>

    <!-- 操作面板 -->
    <div class="operations-panel">
      <h2>缓存操作</h2>
      
      <div class="operation-group">
        <input v-model="newKey" placeholder="键" />
        <input v-model="newValue" placeholder="值" />
        <input v-model.number="newTTL" type="number" placeholder="TTL (ms)" />
        <button @click="handleSet">设置缓存</button>
      </div>

      <div class="operation-group">
        <input v-model="getKey" placeholder="要获取的键" />
        <button @click="handleGet">获取缓存</button>
        <span v-if="getValue !== null" class="result">结果: {{ getValue }}</span>
      </div>

      <div class="operation-group">
        <input v-model="deleteKey" placeholder="要删除的键" />
        <button @click="handleDelete">删除缓存</button>
      </div>

      <div class="operation-group">
        <button @click="handleClear">清空所有缓存</button>
        <button @click="handleCleanup">清理过期项</button>
      </div>
    </div>

    <!-- 缓存列表 -->
    <div class="cache-list">
      <h2>缓存列表</h2>
      <div v-if="keys.length === 0" class="empty">暂无缓存</div>
      <div v-else class="cache-items">
        <div v-for="key in keys" :key="key" class="cache-item">
          <span class="cache-key">{{ key }}</span>
          <span class="cache-value">{{ get(key) }}</span>
          <button @click="handleDelete(key)" class="delete-btn">删除</button>
        </div>
      </div>
    </div>

    <!-- 事件日志 -->
    <div class="event-log">
      <h2>事件日志</h2>
      <div class="log-items">
        <div v-for="(log, index) in eventLogs" :key="index" class="log-item">
          <span class="log-time">{{ log.time }}</span>
          <span class="log-type" :class="`log-type-${log.type}`">{{ log.type }}</span>
          <span class="log-message">{{ log.message }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useCache } from '../src'

// 使用缓存
const { get, set, delete: del, clear, size, keys, stats, cleanup, on } = useCache<string>({
  strategy: 'lru',
  maxSize: 10,
  defaultTTL: 10000,
  enableStats: true,
  reactiveStats: true,
})

// 表单数据
const newKey = ref('')
const newValue = ref('')
const newTTL = ref<number>()
const getKey = ref('')
const getValue = ref<string | null>(null)
const deleteKey = ref('')

// 事件日志
const eventLogs = ref<Array<{ time: string, type: string, message: string }>>([])

// 添加日志
function addLog(type: string, message: string) {
  const time = new Date().toLocaleTimeString()
  eventLogs.value.unshift({ time, type, message })
  if (eventLogs.value.length > 20) {
    eventLogs.value.pop()
  }
}

// 监听事件
on('set', (event) => {
  addLog('set', `设置缓存: ${event.key}`)
})

on('get', (event) => {
  addLog('get', `获取缓存: ${event.key}`)
})

on('delete', (event) => {
  addLog('delete', `删除缓存: ${event.key}`)
})

on('hit', (event) => {
  addLog('hit', `缓存命中: ${event.key}`)
})

on('miss', (event) => {
  addLog('miss', `缓存未命中: ${event.key}`)
})

on('evict', (event) => {
  addLog('evict', `缓存淘汰: ${event.key}`)
})

// 操作处理
function handleSet() {
  if (newKey.value && newValue.value) {
    set(newKey.value, newValue.value, newTTL.value)
    newKey.value = ''
    newValue.value = ''
    newTTL.value = undefined
  }
}

function handleGet() {
  if (getKey.value) {
    getValue.value = get(getKey.value) ?? '(不存在或已过期)'
  }
}

function handleDelete(key?: string) {
  const keyToDelete = key || deleteKey.value
  if (keyToDelete) {
    del(keyToDelete)
    deleteKey.value = ''
  }
}

function handleClear() {
  clear()
  addLog('clear', '清空所有缓存')
}

function handleCleanup() {
  const count = cleanup()
  addLog('cleanup', `清理了 ${count} 个过期项`)
}
</script>

<style scoped>
/* 样式省略 */
</style>

