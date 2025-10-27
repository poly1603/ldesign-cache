/**
 * 缓存辅助工具
 * 
 * 提供便捷的API、装饰器和工具函数
 */

// 链式构建器
export { CacheBuilder, CachePresets, createCacheBuilder } from './cache-builder'

// 装饰器
export { Cached, CachedProperty, CacheEvict, CacheUpdate } from './cache-decorators'

export type { CachedDecoratorOptions } from './cache-decorators'

