<script setup lang="ts">
import { useCache, useCacheStats } from '@ldesign/cache-vue'
import { ref } from 'vue'

interface User {
  id: string
  name: string
  email: string
}

// 模拟 API 调用
const mockFetchUser = async (): Promise<User> => {
  await new Promise(resolve => setTimeout(resolve, 1000))
  return {
    id: '123',
    name: '张三',
    email: 'zhangsan@example.com',
  }
}

// 使用缓存
const { 
  data: user, 
  loading, 
  error, 
  refresh, 
  update 
} = useCache<User>('user-profile', {
  fetcher: mockFetchUser,
  ttl: 30 * 1000, // 30秒
})

// 缓存统计
const { stats } = useCacheStats()

// 手动操作示例
const newName = ref('')

const handleUpdateName = async () => {
  if (user.value && newName.value) {
    await update({ ...user.value, name: newName.value })
    newName.value = ''
  }
}
</script>

<template>
  <div class="app">
    <header>
      <h1>🚀 LDesign Cache Vue Demo</h1>
      <p>演示 @ldesign/cache-vue 的功能</p>
    </header>

    <main>
      <!-- 用户信息卡片 -->
      <section class="card">
        <h2>用户信息（缓存示例）</h2>
        
        <div v-if="loading" class="loading">
          <div class="spinner"></div>
          <p>加载中...</p>
        </div>

        <div v-else-if="error" class="error">
          <p>❌ 错误: {{ error.message }}</p>
        </div>

        <div v-else-if="user" class="user-info">
          <div class="info-row">
            <strong>ID:</strong>
            <span>{{ user.id }}</span>
          </div>
          <div class="info-row">
            <strong>姓名:</strong>
            <span>{{ user.name }}</span>
          </div>
          <div class="info-row">
            <strong>邮箱:</strong>
            <span>{{ user.email }}</span>
          </div>
          
          <div class="actions">
            <button @click="refresh" class="btn btn-primary">
              🔄 刷新数据
            </button>
          </div>

          <div class="update-section">
            <h3>更新姓名</h3>
            <div class="input-group">
              <input 
                v-model="newName" 
                type="text" 
                placeholder="输入新姓名"
                class="input"
              />
              <button 
                @click="handleUpdateName" 
                :disabled="!newName"
                class="btn btn-secondary"
              >
                💾 保存
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- 缓存统计 -->
      <section class="card">
        <h2>缓存统计</h2>
        <div v-if="stats" class="stats-grid">
          <div class="stat-item">
            <div class="stat-value">{{ stats.totalKeys || 0 }}</div>
            <div class="stat-label">总键数</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ stats.hits || 0 }}</div>
            <div class="stat-label">命中次数</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ stats.misses || 0 }}</div>
            <div class="stat-label">未命中次数</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">
              {{ ((stats.hitRate || 0) * 100).toFixed(1) }}%
            </div>
            <div class="stat-label">命中率</div>
          </div>
        </div>
      </section>

      <!-- 功能说明 -->
      <section class="card">
        <h2>功能特性</h2>
        <ul class="features">
          <li>✅ 响应式缓存数据</li>
          <li>✅ 自动加载和刷新</li>
          <li>✅ 错误处理</li>
          <li>✅ 加载状态</li>
          <li>✅ 手动更新缓存</li>
          <li>✅ 缓存统计信息</li>
          <li>✅ TTL 过期管理</li>
          <li>✅ 多存储引擎支持</li>
        </ul>
      </section>
    </main>

    <footer>
      <p>Powered by LDesign Cache</p>
    </footer>
  </div>
</template>

<style scoped>
.app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

header {
  text-align: center;
  margin-bottom: 3rem;
}

header h1 {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

header p {
  color: #666;
  font-size: 1.1rem;
}

main {
  display: grid;
  gap: 2rem;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.card h2 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
  color: #333;
}

.loading {
  text-align: center;
  padding: 2rem;
}

.spinner {
  width: 40px;
  height: 40px;
  margin: 0 auto 1rem;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error {
  color: #e74c3c;
  padding: 1rem;
  background: #fee;
  border-radius: 8px;
}

.user-info .info-row {
  display: flex;
  padding: 0.75rem 0;
  border-bottom: 1px solid #eee;
}

.user-info .info-row:last-child {
  border-bottom: none;
}

.user-info .info-row strong {
  width: 100px;
  color: #666;
}

.actions {
  margin-top: 1.5rem;
}

.update-section {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 2px solid #f0f0f0;
}

.update-section h3 {
  font-size: 1.1rem;
  margin-bottom: 1rem;
  color: #555;
}

.input-group {
  display: flex;
  gap: 0.5rem;
}

.input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.input:focus {
  outline: none;
  border-color: #667eea;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-secondary {
  background: #3498db;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #2980b9;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1.5rem;
}

.stat-item {
  text-align: center;
  padding: 1.5rem;
  background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
  border-radius: 8px;
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: #667eea;
  margin-bottom: 0.5rem;
}

.stat-label {
  color: #666;
  font-size: 0.9rem;
}

.features {
  list-style: none;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.features li {
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 6px;
  font-size: 0.95rem;
}

footer {
  margin-top: 3rem;
  text-align: center;
  color: #999;
  padding-top: 2rem;
  border-top: 1px solid #eee;
}
</style>


