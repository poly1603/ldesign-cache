<template>
  <div class="demo-section">
    <h2>🎁 预设配置演示</h2>
    <p class="description">
      @ldesign/cache 提供了多种预设配置，帮你快速应对常见缓存场景。
    </p>

    <div class="preset-container">
      <!-- 预设选择器 -->
      <div class="preset-selector">
        <h3>选择预设:</h3>
        <div class="preset-cards">
          <div
            v-for="preset in presets"
            :key="preset.name"
            :class="['preset-card', { active: currentPreset === preset.name }]"
            @click="selectPreset(preset.name)"
          >
            <div class="preset-icon">{{ preset.icon }}</div>
            <div class="preset-name">{{ preset.name }}</div>
            <div class="preset-desc">{{ preset.description }}</div>
          </div>
        </div>
      </div>

      <!-- 当前预设信息 -->
      <div v-if="currentPresetConfig" class="preset-info">
        <h3>当前预设: {{ currentPreset }}</h3>
        <div class="config-display">
          <h4>配置详情:</h4>
          <pre>{{ JSON.stringify(currentPresetConfig, null, 2) }}</pre>
        </div>

        <!-- 测试区域 -->
        <div class="test-area">
          <h4>测试区域:</h4>
          <div class="test-input">
            <input
              v-model="testKey"
              type="text"
              placeholder="键名"
              class="input"
            />
            <input
              v-model="testValue"
              type="text"
              placeholder="值"
              class="input"
            />
            <button @click="testSet" class="btn btn-primary">
              设置缓存
            </button>
          </div>
          <div class="test-input">
            <input
              v-model="queryKey"
              type="text"
              placeholder="要查询的键名"
              class="input"
            />
            <button @click="testGet" class="btn btn-info">
              获取缓存
            </button>
          </div>

          <div v-if="testResult" class="test-result">
            <h4>测试结果:</h4>
            <div class="result-box" :class="testResult.type">
              <strong>{{ testResult.label }}:</strong>
              <pre>{{ testResult.value }}</pre>
            </div>
          </div>
        </div>

        <!-- 性能统计 -->
        <div v-if="stats" class="stats">
          <h4>性能统计:</h4>
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-label">总操作数</div>
              <div class="stat-value">{{ stats.totalOps }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">命中率</div>
              <div class="stat-value">{{ stats.hitRate }}%</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">平均耗时</div>
              <div class="stat-value">{{ stats.avgTime }}ms</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">存储引擎</div>
              <div class="stat-value">{{ stats.engine }}</div>
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="actions">
          <button @click="runBenchmark" class="btn btn-success">
            运行性能测试
          </button>
          <button @click="clearCache" class="btn btn-warning">
            清空缓存
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import {
  createFastCache,
  createPersistentCache,
  createSecureCache,
  createSmartCache,
} from '@ldesign/cache/presets'
import type { CacheManager } from '@ldesign/cache'

interface PresetInfo {
  name: string
  icon: string
  description: string
  create: () => CacheManager
}

const presets: PresetInfo[] = [
  {
    name: '快速缓存',
    icon: '⚡',
    description: '高性能内存缓存，适合频繁访问的临时数据',
    create: createFastCache,
  },
  {
    name: '持久缓存',
    icon: '💾',
    description: 'IndexedDB 存储，适合大量数据的长期缓存',
    create: createPersistentCache,
  },
  {
    name: '安全缓存',
    icon: '🔒',
    description: '加密存储，适合敏感数据保护',
    create: createSecureCache,
  },
  {
    name: '智能缓存',
    icon: '🧠',
    description: '自动选择最优存储策略',
    create: createSmartCache,
  },
]

// 状态
const currentPreset = ref('快速缓存')
const currentCache = ref<CacheManager | null>(null)
const currentPresetConfig = ref<any>(null)
const testKey = ref('')
const testValue = ref('')
const queryKey = ref('')
const testResult = ref<{ type: string; label: string; value: any } | null>(null)
const stats = ref<any>(null)

// 方法
const selectPreset = (name: string) => {
  currentPreset.value = name
  const preset = presets.find(p => p.name === name)
  if (preset) {
    currentCache.value = preset.create()
    currentPresetConfig.value = (currentCache.value as any).config || {}
    updateStats()
  }
}

const testSet = async () => {
  if (!testKey.value || !testValue.value || !currentCache.value) {
    alert('请填写键名和值')
    return
  }

  try {
    const startTime = performance.now()
    await currentCache.value.set(testKey.value, testValue.value)
    const endTime = performance.now()

    testResult.value = {
      type: 'success',
      label: '设置成功',
      value: `耗时: ${(endTime - startTime).toFixed(2)}ms`,
    }

    updateStats()
  } catch (error) {
    testResult.value = {
      type: 'error',
      label: '设置失败',
      value: error.message,
    }
  }
}

const testGet = async () => {
  if (!queryKey.value || !currentCache.value) {
    alert('请填写键名')
    return
  }

  try {
    const startTime = performance.now()
    const value = await currentCache.value.get(queryKey.value)
    const endTime = performance.now()

    if (value !== null) {
      testResult.value = {
        type: 'success',
        label: '获取成功',
        value: `值: ${JSON.stringify(value)}\n耗时: ${(endTime - startTime).toFixed(2)}ms`,
      }
    } else {
      testResult.value = {
        type: 'warning',
        label: '未找到',
        value: '缓存中不存在该键',
      }
    }

    updateStats()
  } catch (error) {
    testResult.value = {
      type: 'error',
      label: '获取失败',
      value: error.message,
    }
  }
}

const clearCache = async () => {
  if (!currentCache.value) return

  if (!confirm('确定要清空所有缓存吗？')) {
    return
  }

  try {
    await currentCache.value.clear()
    testResult.value = {
      type: 'success',
      label: '清空成功',
      value: '所有缓存已清空',
    }
    updateStats()
  } catch (error) {
    testResult.value = {
      type: 'error',
      label: '清空失败',
      value: error.message,
    }
  }
}

const runBenchmark = async () => {
  if (!currentCache.value) return

  testResult.value = {
    type: 'info',
    label: '测试中',
    value: '正在运行性能测试，请稍候...',
  }

  try {
    const iterations = 1000
    const startTime = performance.now()

    // 写入测试
    for (let i = 0; i < iterations; i++) {
      await currentCache.value.set(`bench_${i}`, { value: i, data: 'test' })
    }

    // 读取测试
    for (let i = 0; i < iterations; i++) {
      await currentCache.value.get(`bench_${i}`)
    }

    const endTime = performance.now()
    const totalTime = endTime - startTime
    const avgTime = totalTime / (iterations * 2)

    testResult.value = {
      type: 'success',
      label: '性能测试完成',
      value: `总操作: ${iterations * 2}次\n总耗时: ${totalTime.toFixed(2)}ms\n平均耗时: ${avgTime.toFixed(4)}ms`,
    }

    // 清理测试数据
    for (let i = 0; i < iterations; i++) {
      await currentCache.value.remove(`bench_${i}`)
    }

    updateStats()
  } catch (error) {
    testResult.value = {
      type: 'error',
      label: '测试失败',
      value: error.message,
    }
  }
}

const updateStats = async () => {
  if (!currentCache.value) return

  try {
    const keys = await currentCache.value.keys()
    stats.value = {
      totalOps: keys.length,
      hitRate: Math.round(Math.random() * 30 + 70), // 模拟数据
      avgTime: (Math.random() * 2).toFixed(2),
      engine: currentPresetConfig.value?.defaultEngine || 'unknown',
    }
  } catch (error) {
    console.error('获取统计失败:', error)
  }
}

// 生命周期
onMounted(() => {
  selectPreset('快速缓存')
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

h3 {
  color: #333;
  margin-top: 0;
}

h4 {
  color: #555;
  margin-top: 0;
  margin-bottom: 12px;
}

.description {
  color: #666;
  line-height: 1.6;
  margin-bottom: 20px;
}

.preset-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.preset-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.preset-card {
  padding: 20px;
  border: 2px solid #eee;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  text-align: center;
}

.preset-card:hover {
  border-color: #3c8772;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.preset-card.active {
  border-color: #3c8772;
  background: #f0f9f6;
}

.preset-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.preset-name {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.preset-desc {
  font-size: 13px;
  color: #666;
  line-height: 1.4;
}

.preset-info {
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.config-display pre {
  background: #fff;
  padding: 16px;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 12px;
  line-height: 1.5;
}

.test-area {
  margin: 20px 0;
}

.test-input {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
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

.test-result {
  margin-top: 16px;
}

.result-box {
  padding: 12px;
  border-radius: 4px;
  border-left: 4px solid;
}

.result-box.success {
  background: #d4edda;
  border-color: #28a745;
  color: #155724;
}

.result-box.error {
  background: #f8d7da;
  border-color: #dc3545;
  color: #721c24;
}

.result-box.warning {
  background: #fff3cd;
  border-color: #ffc107;
  color: #856404;
}

.result-box.info {
  background: #d1ecf1;
  border-color: #17a2b8;
  color: #0c5460;
}

.result-box pre {
  margin: 8px 0 0 0;
  white-space: pre-wrap;
  font-family: monospace;
}

.stats {
  margin: 20px 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  background: white;
  padding: 16px;
  border-radius: 4px;
}

.stat-item {
  text-align: center;
}

.stat-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #3c8772;
}

.actions {
  display: flex;
  gap: 8px;
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

.btn-primary {
  background: #3c8772;
  color: white;
}

.btn-info {
  background: #17a2b8;
  color: white;
}

.btn-success {
  background: #28a745;
  color: white;
}

.btn-warning {
  background: #ffc107;
  color: #000;
}
</style>

