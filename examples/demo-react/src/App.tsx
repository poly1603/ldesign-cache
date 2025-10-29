import React, { useState } from 'react'
import { useCache, useCacheStats } from '@ldesign/cache-react'

interface User {
  id: string
  name: string
  email: string
}

const mockFetchUser = async (): Promise<User> => {
  await new Promise(resolve => setTimeout(resolve, 1000))
  return {
    id: '123',
    name: '李四',
    email: 'lisi@example.com',
  }
}

export default function App() {
  const {
    data: user,
    loading,
    error,
    refresh,
    update
  } = useCache<User>('user-profile', {
    fetcher: mockFetchUser,
    ttl: 30 * 1000,
  })

  const { stats } = useCacheStats()
  const [newName, setNewName] = useState('')

  const handleUpdateName = async () => {
    if (user && newName) {
      await update({ ...user, name: newName })
      setNewName('')
    }
  }

  return (
    <div className="app">
      <header>
        <h1>🚀 LDesign Cache React Demo</h1>
        <p>演示 @ldesign/cache-react 的功能</p>
      </header>

      <main>
        {/* 用户信息卡片 */}
        <section className="card">
          <h2>用户信息（缓存示例）</h2>

          {loading && (
            <div className="loading">
              <div className="spinner"></div>
              <p>加载中...</p>
            </div>
          )}

          {error && (
            <div className="error">
              <p>❌ 错误: {error.message}</p>
            </div>
          )}

          {user && !loading && (
            <div className="user-info">
              <div className="info-row">
                <strong>ID:</strong>
                <span>{user.id}</span>
              </div>
              <div className="info-row">
                <strong>姓名:</strong>
                <span>{user.name}</span>
              </div>
              <div className="info-row">
                <strong>邮箱:</strong>
                <span>{user.email}</span>
              </div>

              <div className="actions">
                <button onClick={refresh} className="btn btn-primary">
                  🔄 刷新数据
                </button>
              </div>

              <div className="update-section">
                <h3>更新姓名</h3>
                <div className="input-group">
                  <input
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    type="text"
                    placeholder="输入新姓名"
                    className="input"
                  />
                  <button
                    onClick={handleUpdateName}
                    disabled={!newName}
                    className="btn btn-secondary"
                  >
                    💾 保存
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* 缓存统计 */}
        <section className="card">
          <h2>缓存统计</h2>
          {stats && (
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-value">{stats.totalKeys || 0}</div>
                <div className="stat-label">总键数</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{stats.hits || 0}</div>
                <div className="stat-label">命中次数</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{stats.misses || 0}</div>
                <div className="stat-label">未命中次数</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">
                  {((stats.hitRate || 0) * 100).toFixed(1)}%
                </div>
                <div className="stat-label">命中率</div>
              </div>
            </div>
          )}
        </section>

        {/* 功能说明 */}
        <section className="card">
          <h2>功能特性</h2>
          <ul className="features">
            <li>✅ React Hooks 集成</li>
            <li>✅ 自动状态管理</li>
            <li>✅ 错误处理</li>
            <li>✅ 加载状态</li>
            <li>✅ 手动更新缓存</li>
            <li>✅ Context Provider</li>
            <li>✅ TypeScript 支持</li>
            <li>✅ 性能优化</li>
          </ul>
        </section>
      </main>

      <footer>
        <p>Powered by LDesign Cache</p>
      </footer>
    </div>
  )
}


