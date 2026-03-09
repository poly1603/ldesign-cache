# @ldesign/cache-playground

该 playground 只运行 Engine 模式，用于完整展示 `@ldesign/cache-core` 与 `@ldesign/cache-vue` 的重构能力。

## 启动

```bash
pnpm --filter @ldesign/cache-playground dev
```

## 构建

```bash
pnpm --filter @ldesign/cache-playground build
```

## 展示内容

- 基础读写与统计
- LRU/LFU/FIFO 策略对比
- 标签与命名空间失效
- 批量操作
- 查询去重与 SWR
- 持久化
- 插件钩子
- 指令/组件/装饰器示例
- Engine 状态与 API 集成
- 原生 Vue 插件接入代码对照
