# @ldesign/cache 示例

这个目录包含了 @ldesign/cache 的完整示例演示。

## 📦 包含的示例

### 基础功能
- **BasicDemo** - 基础缓存操作演示
- **SmartStrategyDemo** - 智能存储策略演示
- **PresetDemo** - 预设配置演示

### 高级功能
- **SecurityDemo** - 安全加密功能演示
- **SyncDemo** - 跨标签页同步演示
- **NamespaceDemo** - 命名空间演示

### Vue 集成
- **VueIntegrationDemo** - Vue 3 组合式函数演示
- **FormCacheDemo** - 表单自动保存演示

### 性能监控
- **PerformanceDemo** - 性能监控演示
- **LargeDataDemo** - 大数据处理演示

## 🚀 快速开始

### 安装依赖

```bash
pnpm install
```

### 运行演示

```bash
pnpm dev
```

然后打开浏览器访问 `http://localhost:5173`

## 📁 项目结构

```
examples/
├── src/
│   ├── components/          # Vue 组件示例
│   │   ├── BasicDemo.vue
│   │   ├── SmartStrategyDemo.vue
│   │   ├── SecurityDemo.vue
│   │   ├── VueIntegrationDemo.vue
│   │   ├── SyncDemo.vue
│   │   ├── NamespaceDemo.vue
│   │   ├── FormCacheDemo.vue
│   │   ├── PresetDemo.vue
│   │   ├── PerformanceDemo.vue
│   │   └── LargeDataDemo.vue
│   ├── App.vue              # 主应用
│   └── main.ts              # 入口文件
├── demo.ts                  # 基础 TypeScript 示例
├── advanced-usage.ts        # 高级用法示例
├── performance-demo.ts      # 性能测试示例
├── real-world-scenarios.ts  # 真实场景示例
└── README.md                # 本文件
```

## 📚 示例说明

### 1. 基础演示 (BasicDemo.vue)

展示最基本的缓存操作：
- 设置和获取缓存
- 删除缓存
- 检查缓存是否存在
- 清空所有缓存

### 2. 智能策略演示 (SmartStrategyDemo.vue)

展示智能存储策略如何根据数据特征自动选择存储引擎：
- 小数据 → localStorage
- 大数据 → IndexedDB
- 短期数据 → Memory
- 中等数据 → sessionStorage

### 3. 安全演示 (SecurityDemo.vue)

展示数据加密和键名混淆功能：
- AES-256 加密
- 键名混淆
- 自定义加密算法

### 4. Vue 集成演示 (VueIntegrationDemo.vue)

展示 Vue 3 组合式函数的使用：
- `useCache()` - 基础缓存操作
- `useCacheStats()` - 实时统计
- 响应式缓存
- 自动保存

### 5. 跨标签页同步演示 (SyncDemo.vue)

展示跨标签页数据同步：
- 实时同步
- 冲突解决
- 同步日志

**使用方法**：在多个浏览器标签页中打开此演示页面，在一个标签页中修改数据，其他标签页会自动同步。

### 6. 命名空间演示 (NamespaceDemo.vue)

展示命名空间功能：
- 多租户数据隔离
- 命名空间管理
- 数据导入导出

### 7. 表单自动保存演示 (FormCacheDemo.vue)

展示表单草稿自动保存：
- 防抖保存
- 自动恢复
- 进度追踪

### 8. 预设配置演示 (PresetDemo.vue)

展示不同的预设配置：
- **快速缓存** - 高性能内存缓存
- **持久缓存** - IndexedDB 长期存储
- **安全缓存** - 加密存储
- **智能缓存** - 自动选择策略

### 9. 性能监控演示 (PerformanceDemo.vue)

展示性能监控功能：
- 操作耗时统计
- 缓存命中率
- 存储容量监控

### 10. 大数据处理演示 (LargeDataDemo.vue)

展示大数据缓存：
- IndexedDB 存储
- 批量操作
- 压缩功能

## 🛠️ TypeScript 示例

### demo.ts

基础的 TypeScript 使用示例，适合快速了解 API。

```typescript
import { createCache } from '@ldesign/cache'

const cache = createCache()
await cache.set('key', 'value')
const value = await cache.get('key')
```

### advanced-usage.ts

高级用法示例，包括：
- 批量操作
- 命名空间
- 安全加密
- 预取和预热

### performance-demo.ts

性能测试示例，展示：
- 批量操作性能对比
- 不同引擎性能对比
- 性能优化技巧

### real-world-scenarios.ts

真实项目场景示例：
1. **电商网站** - 产品列表缓存
2. **SaaS 应用** - 多租户数据隔离
3. **社交媒体** - 用户动态缓存
4. **在线表单** - 草稿自动保存
5. **游戏应用** - 玩家进度保存
6. **API 缓存** - 减少网络请求

## 💡 学习路径

推荐的学习顺序：

1. **BasicDemo** - 了解基础操作
2. **demo.ts** - 熟悉 API
3. **SmartStrategyDemo** - 理解智能策略
4. **VueIntegrationDemo** - Vue 集成（如果使用 Vue）
5. **advanced-usage.ts** - 掌握高级功能
6. **real-world-scenarios.ts** - 学习实战应用

## 🔧 自定义示例

你可以复制现有示例并进行修改：

```bash
# 复制一个示例组件
cp src/components/BasicDemo.vue src/components/MyDemo.vue

# 编辑组件
# 在 App.vue 中引入并使用
```

## 📖 相关文档

- [快速开始](../docs/guide/getting-started.md)
- [API 文档](../docs/api/cache-manager.md)
- [最佳实践](../docs/guide/best-practices.md)

## 💬 反馈

如果你有任何问题或建议，欢迎：
- 提交 [Issue](https://github.com/ldesign/ldesign/issues)
- 发起 [Pull Request](https://github.com/ldesign/ldesign/pulls)

