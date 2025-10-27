<template>
  <div class="demo-section">
    <h2>📦 命名空间演示</h2>
    <p class="description">
      命名空间允许你在同一个存储中创建隔离的缓存空间，非常适合多租户应用或模块化开发。
    </p>

    <div class="namespace-container">
      <!-- 命名空间选择 -->
      <div class="namespace-selector">
        <label>选择命名空间:</label>
        <div class="namespace-tabs">
          <button
            v-for="ns in namespaces"
            :key="ns"
            :class="['tab', { active: currentNamespace === ns }]"
            @click="switchNamespace(ns)"
          >
            {{ ns }}
          </button>
        </div>
        <div class="add-namespace">
          <input
            v-model="newNamespace"
            type="text"
            placeholder="新命名空间名称"
            class="input input-sm"
            @keyup.enter="addNamespace"
          />
          <button @click="addNamespace" class="btn btn-sm btn-primary">
            添加
          </button>
        </div>
      </div>

      <!-- 当前命名空间的数据 -->
      <div class="namespace-content">
        <h3>命名空间: {{ currentNamespace }}</h3>

        <!-- 添加数据 -->
        <div class="data-input">
          <input
            v-model="newKey"
            type="text"
            placeholder="键名"
            class="input"
          />
          <input
            v-model="newValue"
            type="text"
            placeholder="值"
            class="input"
          />
          <button @click="addData" class="btn btn-primary">
            添加数据
          </button>
        </div>

        <!-- 数据列表 -->
        <div v-if="currentData.length > 0" class="data-list">
          <h4>当前数据 ({{ currentData.length }} 项):</h4>
          <div class="data-table">
            <div
              v-for="item in currentData"
              :key="item.key"
              class="data-row"
            >
              <span class="data-key">{{ item.key }}</span>
              <span class="data-value">{{ formatValue(item.value) }}</span>
              <button
                @click="removeData(item.key)"
                class="btn btn-sm btn-danger"
              >
                删除
              </button>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">
          该命名空间暂无数据
        </div>

        <!-- 操作按钮 -->
        <div class="action-buttons">
          <button @click="clearNamespace" class="btn btn-warning">
            清空当前命名空间
          </button>
          <button @click="exportNamespace" class="btn btn-info">
            导出数据
          </button>
          <button @click="importData" class="btn btn-success">
            导入示例数据
          </button>
        </div>

        <!-- 统计信息 -->
        <div class="stats">
          <h4>统计信息:</h4>
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-label">总命名空间:</span>
              <span class="stat-value">{{ namespaces.length }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">当前数据项:</span>
              <span class="stat-value">{{ currentData.length }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">总数据项:</span>
              <span class="stat-value">{{ totalDataCount }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { createCache } from '@ldesign/cache'

const cache = createCache({
  defaultEngine: 'localStorage',
  keyPrefix: 'namespace_demo_',
})

// 状态
const namespaces = ref<string[]>(['default', 'user', 'settings'])
const currentNamespace = ref('default')
const newNamespace = ref('')
const newKey = ref('')
const newValue = ref('')
const currentData = ref<Array<{ key: string; value: any }>>([])

// 计算属性
const totalDataCount = computed(() => {
  return currentData.value.length // 简化版，实际应统计所有命名空间
})

// 方法
const switchNamespace = async (ns: string) => {
  currentNamespace.value = ns
  await loadNamespaceData()
}

const addNamespace = () => {
  if (!newNamespace.value.trim()) return

  if (namespaces.value.includes(newNamespace.value)) {
    alert('命名空间已存在!')
    return
  }

  namespaces.value.push(newNamespace.value)
  newNamespace.value = ''
  saveNamespaces()
}

const addData = async () => {
  if (!newKey.value.trim() || !newValue.value.trim()) {
    alert('请输入键名和值!')
    return
  }

  const key = `${currentNamespace.value}:${newKey.value}`

  try {
    // 尝试将值解析为 JSON
    let value: any = newValue.value
    try {
      value = JSON.parse(newValue.value)
    } catch {
      // 保持为字符串
    }

    await cache.set(key, value)
    newKey.value = ''
    newValue.value = ''
    await loadNamespaceData()
  } catch (error) {
    alert(`添加失败: ${error.message}`)
  }
}

const removeData = async (key: string) => {
  const fullKey = `${currentNamespace.value}:${key}`
  await cache.remove(fullKey)
  await loadNamespaceData()
}

const clearNamespace = async () => {
  if (!confirm(`确定要清空命名空间 "${currentNamespace.value}" 的所有数据吗?`)) {
    return
  }

  // 删除当前命名空间的所有数据
  for (const item of currentData.value) {
    const fullKey = `${currentNamespace.value}:${item.key}`
    await cache.remove(fullKey)
  }

  await loadNamespaceData()
}

const exportNamespace = () => {
  const data = {
    namespace: currentNamespace.value,
    data: currentData.value,
    exportTime: new Date().toISOString(),
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${currentNamespace.value}_export.json`
  a.click()
  URL.revokeObjectURL(url)
}

const importData = async () => {
  const sampleData = [
    { key: 'item1', value: 'Sample Value 1' },
    { key: 'item2', value: { type: 'object', count: 42 } },
    { key: 'item3', value: ['array', 'item', 1, 2, 3] },
  ]

  for (const item of sampleData) {
    const fullKey = `${currentNamespace.value}:${item.key}`
    await cache.set(fullKey, item.value)
  }

  await loadNamespaceData()
}

const loadNamespaceData = async () => {
  currentData.value = []

  // 获取所有键
  const allKeys = await cache.keys()

  // 过滤当前命名空间的键
  const prefix = `${currentNamespace.value}:`
  const namespaceKeys = allKeys.filter(key =>
    key.startsWith(prefix),
  )

  // 加载数据
  for (const fullKey of namespaceKeys) {
    const key = fullKey.replace(prefix, '')
    const value = await cache.get(fullKey)
    if (value !== null) {
      currentData.value.push({ key, value })
    }
  }
}

const saveNamespaces = async () => {
  await cache.set('__namespaces__', namespaces.value)
}

const loadNamespaces = async () => {
  const saved = await cache.get<string[]>('__namespaces__')
  if (saved && Array.isArray(saved)) {
    namespaces.value = saved
  }
}

const formatValue = (value: any): string => {
  if (typeof value === 'object') {
    return JSON.stringify(value)
  }
  return String(value)
}

// 生命周期
onMounted(async () => {
  await loadNamespaces()
  await loadNamespaceData()
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

.namespace-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.namespace-selector {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.namespace-selector label {
  font-weight: 500;
  color: #333;
}

.namespace-tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tab {
  padding: 8px 16px;
  border: 2px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.tab:hover {
  border-color: #3c8772;
}

.tab.active {
  background: #3c8772;
  color: white;
  border-color: #3c8772;
}

.add-namespace {
  display: flex;
  gap: 8px;
  max-width: 400px;
}

.namespace-content {
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.namespace-content h3 {
  margin-top: 0;
  color: #3c8772;
}

.namespace-content h4 {
  margin-top: 0;
  margin-bottom: 12px;
  color: #333;
}

.data-input {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
}

.input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.input-sm {
  padding: 6px 10px;
  font-size: 13px;
}

.input:focus {
  outline: none;
  border-color: #3c8772;
}

.data-list {
  margin-bottom: 20px;
}

.data-table {
  background: white;
  border-radius: 4px;
  overflow: hidden;
}

.data-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-bottom: 1px solid #eee;
}

.data-row:last-child {
  border-bottom: none;
}

.data-key {
  font-weight: 600;
  color: #3c8772;
  min-width: 120px;
}

.data-value {
  flex: 1;
  color: #666;
  font-family: monospace;
  font-size: 13px;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #999;
  font-style: italic;
}

.action-buttons {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  flex-wrap: wrap;
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

.btn-sm {
  padding: 4px 8px;
  font-size: 12px;
}

.btn-primary {
  background: #3c8772;
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

.btn-success {
  background: #28a745;
  color: white;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.stats {
  padding-top: 20px;
  border-top: 1px solid #ddd;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 12px;
  color: #666;
  text-transform: uppercase;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #3c8772;
}
</style>

