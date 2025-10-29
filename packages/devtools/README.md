# @ldesign/cache-devtools

> 开发者工具包 - 性能分析、调试和监控

提供缓存检查器、性能分析器等开发工具。

## 安装

```bash
pnpm add @ldesign/cache-devtools @ldesign/cache-core
```

## 使用

```typescript
import { createCacheInspector } from '@ldesign/cache-devtools'
import { createCache } from '@ldesign/cache-core'

const cache = createCache()
const inspector = createCacheInspector(cache, { logLevel: 'debug' })
```

## 许可证

MIT License © LDesign Team


