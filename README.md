# @ldesign/cache

`@ldesign/cache` 是缓存体系聚合包，核心能力已经重构为：

- `@ldesign/cache-core`：唯一能力源（策略、失效、查询增强、插件钩子、Engine 插件）
- `@ldesign/cache-vue`：Vue 适配层（原生 Vue 插件 + Engine 适配插件 + composables）
- `@ldesign/cache-playground`：Engine 模式演示工程

## 子包说明

- `packages/core`：核心实现与类型
- `packages/vue`：Vue 适配层
- `playground`：Vite + Vue3 + Engine 演示

## 快速安装

```bash
pnpm add @ldesign/cache
```

该聚合包默认重新导出 `@ldesign/cache-core`。

## 详细文档

- [core README](./packages/core/README.md)
- [vue README](./packages/vue/README.md)
- [playground README](./playground/README.md)

## 重构迁移重点

- `CacheOptions` 仅保留真实落地能力字段
- `set(key, value, ttlOrOptions)` 正式支持 `tags/namespace/priority`
- 新增失效方法：`invalidateByTag`、`invalidateByNamespace`、`invalidateWhere`
- 查询增强统一由 core 暴露：`cache.query.fetch/prefetch/revalidate`
- Vue 层拆分双插件：`createCachePlugin` 与 `createCacheEnginePlugin`
- `useCache` 优先消费注入实例，解决实例割裂

## License

MIT
