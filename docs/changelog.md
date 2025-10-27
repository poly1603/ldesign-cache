# 更新日志

所有重要的变更都将记录在此文件中。

## [0.1.1] - 2024-01-15

### 新增

- 🎯 添加跨标签页同步功能
- 🔄 添加跨设备同步支持
- 📊 新增性能监控和分析工具
- 🔧 支持自定义存储引擎
- 🎁 提供多种预设配置

### 优化

- ⚡ 智能路由性能提升 66%
- 🚀 批量操作性能提升 50-200%
- 💾 内存管理优化，减少 GC 压力
- 🔍 改进缓存查询性能

### 修复

- 🐛 修复 IndexedDB 事务超时问题
- 🐛 修复命名空间隔离不彻底的问题
- 🐛 修复 Cookie 存储引擎的编码问题

## [0.1.0] - 2024-01-01

### 新增

- 🎉 首次发布
- 🎯 支持多种存储引擎（localStorage、sessionStorage、Cookie、IndexedDB、Memory）
- 🧠 智能存储策略
- 🔒 安全加密和键名混淆
- 🎨 Vue 3 深度集成
- 📦 命名空间支持
- 📝 完整的 TypeScript 类型定义
- 📊 基础性能监控
- 🔧 批量操作 API
- 🎁 预设配置

### 已知问题

- IndexedDB 在某些浏览器中可能有兼容性问题
- Cookie 存储有大小限制（4KB）

---

## 版本号说明

本项目遵循 [语义化版本 2.0.0](https://semver.org/lang/zh-CN/) 规范。

版本格式：`主版本号.次版本号.修订号`

- **主版本号**：不兼容的 API 修改
- **次版本号**：向下兼容的功能性新增
- **修订号**：向下兼容的问题修正

## 贡献指南

如果你发现了 bug 或有新的功能建议，欢迎：

1. 在 [GitHub Issues](https://github.com/ldesign/ldesign/issues) 提交问题
2. 提交 Pull Request
3. 查看 [贡献指南](https://github.com/ldesign/ldesign/blob/main/CONTRIBUTING.md)

