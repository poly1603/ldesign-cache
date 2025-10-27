<template>
  <div class="demo-section">
    <h2>🔄 跨标签页同步演示</h2>
    <p class="description">
      在一个标签页中修改数据，其他标签页会自动同步更新。
      <br />
      尝试在多个标签页中打开此页面并进行操作。
    </p>

    <div class="sync-container">
      <div class="input-group">
        <label>共享计数器:</label>
        <div class="counter-controls">
          <button @click="decrease" class="btn btn-secondary">-</button>
          <span class="counter-value">{{ counter }}</span>
          <button @click="increase" class="btn btn-primary">+</button>
        </div>
      </div>

      <div class="input-group">
        <label>共享消息:</label>
        <input
          v-model="message"
          type="text"
          placeholder="输入消息..."
          @input="onMessageChange"
          class="input"
        />
      </div>

      <div class="input-group">
        <label>最后更新标签页:</label>
        <span class="info-text">{{ lastUpdatedTab || '无' }}</span>
      </div>

      <div class="input-group">
        <label>同步状态:</label>
        <span :class="['status-badge', syncStatus]">
          {{ syncStatusText }}
        </span>
      </div>

      <div class="button-group">
        <button @click="resetData" class="btn btn-warning">
          重置数据
        </button>
        <button @click="testConflict" class="btn btn-info">
          测试冲突解决
        </button>
      </div>

      <div v-if="logs.length > 0" class="logs">
        <h3>同步日志:</h3>
        <div class="log-list">
          <div
            v-for="(log, index) in logs"
            :key="index"
            :class="['log-item', log.type]"
          >
            <span class="log-time">{{ log.time }}</span>
            <span class="log-message">{{ log.message }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { CacheManager, SyncManager } from '@ldesign/cache'

const cache = new CacheManager({
  defaultEngine: 'localStorage',
  keyPrefix: 'sync_demo_',
})

const sync = new SyncManager(cache, {
  enabled: true,
  conflictResolution: 'last-write-wins',
  syncDelay: 100,
})

// 标签页 ID
const tabId = ref(`tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)

// 数据
const counter = ref(0)
const message = ref('')
const lastUpdatedTab = ref('')
const syncStatus = ref<'connected' | 'syncing' | 'error'>('connected')
const logs = ref<Array<{ time: string; message: string; type: string }>>([])

// 计算属性
const syncStatusText = computed(() => {
  const statusMap = {
    connected: '已连接',
    syncing: '同步中...',
    error: '同步错误',
  }
  return statusMap[syncStatus.value]
})

// 方法
const increase = async () => {
  counter.value++
  await updateCache()
  addLog('增加计数器', 'info')
}

const decrease = async () => {
  counter.value--
  await updateCache()
  addLog('减少计数器', 'info')
}

const onMessageChange = async () => {
  await updateCache()
}

const updateCache = async () => {
  try {
    syncStatus.value = 'syncing'
    await cache.set('counter', counter.value)
    await cache.set('message', message.value)
    await cache.set('lastUpdatedTab', tabId.value)
    lastUpdatedTab.value = tabId.value
    syncStatus.value = 'connected'
  } catch (error) {
    syncStatus.value = 'error'
    addLog(`更新失败: ${error.message}`, 'error')
  }
}

const resetData = async () => {
  counter.value = 0
  message.value = ''
  await updateCache()
  addLog('数据已重置', 'success')
}

const testConflict = async () => {
  // 模拟冲突：快速多次更新
  for (let i = 0; i < 5; i++) {
    counter.value += 10
    await cache.set('counter', counter.value)
  }
  addLog('冲突测试完成', 'warning')
}

const loadData = async () => {
  const savedCounter = await cache.get<number>('counter')
  const savedMessage = await cache.get<string>('message')
  const savedTab = await cache.get<string>('lastUpdatedTab')

  if (savedCounter !== null) counter.value = savedCounter
  if (savedMessage !== null) message.value = savedMessage
  if (savedTab !== null) lastUpdatedTab.value = savedTab
}

const addLog = (message: string, type: string = 'info') => {
  const now = new Date()
  const time = `${now.getHours().toString().padStart(2, '0')}:${now
    .getMinutes()
    .toString()
    .padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`

  logs.value.unshift({
    time,
    message,
    type,
  })

  // 只保留最近 20 条日志
  if (logs.value.length > 20) {
    logs.value = logs.value.slice(0, 20)
  }
}

// 监听同步事件
const handleSync = (event: CustomEvent) => {
  const { key, value, source } = event.detail

  if (source === tabId.value) return // 忽略自己的更新

  if (key === 'counter') {
    counter.value = value
    addLog(`计数器已同步: ${value}`, 'success')
  } else if (key === 'message') {
    message.value = value
    addLog(`消息已同步: ${value}`, 'success')
  } else if (key === 'lastUpdatedTab') {
    lastUpdatedTab.value = value
  }
}

// 生命周期
onMounted(async () => {
  await loadData()
  sync.enable()

  // 监听同步事件
  window.addEventListener('cache:sync', handleSync as EventListener)

  addLog(`标签页 ${tabId.value.substr(0, 8)}... 已连接`, 'success')
})

onUnmounted(() => {
  sync.disable()
  window.removeEventListener('cache:sync', handleSync as EventListener)
})
</script>

<style scoped>
.demo-section {
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

h2 {
  margin-top: 0;
  color: #3c8772;
}

.description {
  color: #666;
  line-height: 1.6;
  margin-bottom: 20px;
}

.sync-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.input-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.input-group label {
  min-width: 120px;
  font-weight: 500;
  color: #333;
}

.counter-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.counter-value {
  font-size: 24px;
  font-weight: bold;
  color: #3c8772;
  min-width: 50px;
  text-align: center;
}

.input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.input:focus {
  outline: none;
  border-color: #3c8772;
}

.info-text {
  color: #666;
  font-family: monospace;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.connected {
  background: #d4edda;
  color: #155724;
}

.status-badge.syncing {
  background: #fff3cd;
  color: #856404;
}

.status-badge.error {
  background: #f8d7da;
  color: #721c24;
}

.button-group {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.btn-primary {
  background: #3c8772;
  color: white;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-warning {
  background: #ffc107;
  color: #000;
}

.btn-info {
  background: #17a2b8;
  color: white;
}

.logs {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.logs h3 {
  margin-top: 0;
  margin-bottom: 12px;
  color: #333;
  font-size: 16px;
}

.log-list {
  max-height: 200px;
  overflow-y: auto;
  background: #f8f9fa;
  border-radius: 4px;
  padding: 8px;
}

.log-item {
  padding: 6px 8px;
  margin-bottom: 4px;
  border-radius: 3px;
  font-size: 12px;
  display: flex;
  gap: 8px;
}

.log-item.info {
  background: #e7f3ff;
  color: #014361;
}

.log-item.success {
  background: #d4edda;
  color: #155724;
}

.log-item.warning {
  background: #fff3cd;
  color: #856404;
}

.log-item.error {
  background: #f8d7da;
  color: #721c24;
}

.log-time {
  font-weight: 600;
  min-width: 60px;
}

.log-message {
  flex: 1;
}
</style>

