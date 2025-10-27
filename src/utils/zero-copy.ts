/**
 * 零拷贝缓存实现
 * 
 * 通过共享内存和引用传递减少数据复制，
 * 显著降低内存使用和提升性能
 * 
 * 特性：
 * 1. 结构化克隆代替 JSON 序列化
 * 2. SharedArrayBuffer 支持（跨 Worker）
 * 3. 写时复制（COW）
 * 4. 内存映射
 */

export interface ZeroCopyConfig {
  /** 是否启用结构化克隆 */
  useStructuredClone?: boolean
  /** 是否启用 SharedArrayBuffer */
  useSharedMemory?: boolean
  /** 是否启用写时复制 */
  useCopyOnWrite?: boolean
  /** 共享内存池大小（字节） */
  sharedPoolSize?: number
}

/**
 * 写时复制包装器
 */
class CopyOnWriteWrapper<T> {
  private original: T
  private copy?: T
  private modified = false
  private readonly cloneFn: (data: T) => T

  constructor(data: T, cloneFn: (data: T) => T) {
    this.original = data
    this.cloneFn = cloneFn
  }

  get value(): T {
    return this.copy || this.original
  }

  set value(newValue: T) {
    if (!this.modified) {
      this.copy = this.cloneFn(this.original)
      this.modified = true
    }
    this.copy = newValue
  }

  isModified(): boolean {
    return this.modified
  }

  commit(): T {
    if (this.modified && this.copy) {
      this.original = this.copy
      this.modified = false
    }
    return this.original
  }
}

/**
 * 共享内存分配器
 */
class SharedMemoryAllocator {
  private buffer: SharedArrayBuffer
  private view: DataView
  private offset = 0
  private freeList: Array<{ offset: number, size: number }> = []

  constructor(size: number) {
    if (typeof SharedArrayBuffer !== 'undefined') {
      this.buffer = new SharedArrayBuffer(size)
      this.view = new DataView(this.buffer)
    } else {
      // 回退到普通 ArrayBuffer
      const buffer = new ArrayBuffer(size)
      this.buffer = buffer as any
      this.view = new DataView(buffer)
    }
  }

  allocate(size: number): { offset: number, buffer: SharedArrayBuffer } | null {
    // 首先尝试从空闲列表分配
    for (let i = 0; i < this.freeList.length; i++) {
      const free = this.freeList[i]
      if (free.size >= size) {
        this.freeList.splice(i, 1)
        return { offset: free.offset, buffer: this.buffer }
      }
    }

    // 从末尾分配
    if (this.offset + size > this.buffer.byteLength) {
      return null // 内存不足
    }

    const allocation = { offset: this.offset, buffer: this.buffer }
    this.offset += size
    return allocation
  }

  free(offset: number, size: number): void {
    // 合并相邻的空闲块
    this.freeList.push({ offset, size })
    this.freeList.sort((a, b) => a.offset - b.offset)

    // 合并相邻块
    for (let i = 0; i < this.freeList.length - 1; i++) {
      const current = this.freeList[i]
      const next = this.freeList[i + 1]

      if (current.offset + current.size === next.offset) {
        current.size += next.size
        this.freeList.splice(i + 1, 1)
        i--
      }
    }
  }

  getStats() {
    const freeMemory = this.freeList.reduce((sum, free) => sum + free.size, 0)
    const usedMemory = this.offset - freeMemory

    return {
      totalSize: this.buffer.byteLength,
      usedMemory,
      freeMemory,
      fragmentation: this.freeList.length,
    }
  }
}

/**
 * 零拷贝缓存实现
 */
export class ZeroCopyCache {
  private config: Required<ZeroCopyConfig>
  private sharedAllocator?: SharedMemoryAllocator
  private refCount = new Map<string, number>()
  private dataMap = new Map<string, any>()

  constructor(config: ZeroCopyConfig = {}) {
    this.config = {
      useStructuredClone: config.useStructuredClone ?? true,
      useSharedMemory: config.useSharedMemory ?? false,
      useCopyOnWrite: config.useCopyOnWrite ?? true,
      sharedPoolSize: config.sharedPoolSize || 10 * 1024 * 1024, // 10MB
    }

    if (this.config.useSharedMemory && typeof SharedArrayBuffer !== 'undefined') {
      this.sharedAllocator = new SharedMemoryAllocator(this.config.sharedPoolSize)
    }
  }

  /**
   * 设置值（零拷贝）
   */
  set(key: string, value: any): void {
    // 增加引用计数
    this.refCount.set(key, (this.refCount.get(key) || 0) + 1)

    if (this.config.useCopyOnWrite) {
      // 包装为 COW 对象
      const wrapper = new CopyOnWriteWrapper(value, (data) => this.clone(data))
      this.dataMap.set(key, wrapper)
    } else {
      // 直接存储引用
      this.dataMap.set(key, value)
    }
  }

  /**
   * 获取值（零拷贝）
   */
  get(key: string): any {
    const data = this.dataMap.get(key)

    if (!data) {
      return undefined
    }

    if (data instanceof CopyOnWriteWrapper) {
      return data.value
    }

    return data
  }

  /**
   * 获取值的引用（真正的零拷贝）
   */
  getRef(key: string): any {
    return this.dataMap.get(key)
  }

  /**
   * 更新值（COW）
   */
  update(key: string, updater: (value: any) => any): void {
    const data = this.dataMap.get(key)

    if (!data) {
      return
    }

    if (data instanceof CopyOnWriteWrapper) {
      const newValue = updater(data.value)
      data.value = newValue
    } else {
      // 非 COW 模式，需要克隆
      const cloned = this.clone(data)
      const newValue = updater(cloned)
      this.dataMap.set(key, newValue)
    }
  }

  /**
   * 删除值
   */
  delete(key: string): boolean {
    const refCount = (this.refCount.get(key) || 0) - 1

    if (refCount <= 0) {
      this.refCount.delete(key)
      this.dataMap.delete(key)
      return true
    }

    this.refCount.set(key, refCount)
    return false
  }

  /**
   * 克隆数据
   */
  private clone(data: any): any {
    if (this.config.useStructuredClone && typeof structuredClone !== 'undefined') {
      try {
        return structuredClone(data)
      } catch {
        // 回退到 JSON
      }
    }

    // JSON 克隆作为后备
    return JSON.parse(JSON.stringify(data))
  }

  /**
   * 将数据存储到共享内存
   */
  storeInSharedMemory(key: string, data: ArrayBuffer | TypedArray): boolean {
    if (!this.sharedAllocator) {
      return false
    }

    const size = data.byteLength
    const allocation = this.sharedAllocator.allocate(size)

    if (!allocation) {
      return false
    }

    // 复制数据到共享内存
    const sharedView = new Uint8Array(allocation.buffer, allocation.offset, size)
    const sourceView = data instanceof ArrayBuffer
      ? new Uint8Array(data)
      : new Uint8Array(data.buffer, data.byteOffset, data.byteLength)

    sharedView.set(sourceView)

    // 存储元数据
    this.dataMap.set(key, {
      type: 'shared',
      offset: allocation.offset,
      size,
      buffer: allocation.buffer,
    })

    return true
  }

  /**
   * 从共享内存获取数据
   */
  getFromSharedMemory(key: string): ArrayBuffer | null {
    const metadata = this.dataMap.get(key)

    if (!metadata || metadata.type !== 'shared') {
      return null
    }

    return metadata.buffer.slice(metadata.offset, metadata.offset + metadata.size)
  }

  /**
   * 获取统计信息
   */
  getStats() {
    const stats: any = {
      entries: this.dataMap.size,
      totalRefs: Array.from(this.refCount.values()).reduce((sum, count) => sum + count, 0),
    }

    if (this.sharedAllocator) {
      stats.sharedMemory = this.sharedAllocator.getStats()
    }

    let cowModified = 0
    for (const data of this.dataMap.values()) {
      if (data instanceof CopyOnWriteWrapper && data.isModified()) {
        cowModified++
      }
    }
    stats.cowModified = cowModified

    return stats
  }
}

/**
 * 创建零拷贝代理
 */
export function createZeroCopyProxy<T extends object>(
  obj: T,
  onChange?: (path: string[], value: any) => void
): T {
  const handler: ProxyHandler<any> = {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver)

      if (typeof value === 'object' && value !== null) {
        return createZeroCopyProxy(value, (path, val) => {
          if (onChange) {
            onChange([String(prop), ...path], val)
          }
        })
      }

      return value
    },

    set(target, prop, value, receiver) {
      const result = Reflect.set(target, prop, value, receiver)

      if (onChange) {
        onChange([String(prop)], value)
      }

      return result
    },
  }

  return new Proxy(obj, handler)
}

/**
 * 内存映射缓存
 */
export class MemoryMappedCache {
  private buffer: ArrayBuffer
  private view: DataView
  private metadata = new Map<string, { offset: number, size: number, type: string }>()
  private offset = 0

  constructor(size: number = 10 * 1024 * 1024) {
    this.buffer = new ArrayBuffer(size)
    this.view = new DataView(this.buffer)
  }

  /**
   * 存储数据
   */
  set(key: string, value: any): boolean {
    let data: Uint8Array
    let type: string

    if (value instanceof ArrayBuffer) {
      data = new Uint8Array(value)
      type = 'arraybuffer'
    } else if (value instanceof Uint8Array) {
      data = value
      type = 'uint8array'
    } else if (typeof value === 'string') {
      const encoder = new TextEncoder()
      data = encoder.encode(value)
      type = 'string'
    } else {
      // 序列化其他类型
      const json = JSON.stringify(value)
      const encoder = new TextEncoder()
      data = encoder.encode(json)
      type = 'json'
    }

    const size = data.length

    if (this.offset + size > this.buffer.byteLength) {
      return false // 空间不足
    }

    // 写入数据
    const targetView = new Uint8Array(this.buffer, this.offset, size)
    targetView.set(data)

    // 保存元数据
    this.metadata.set(key, { offset: this.offset, size, type })
    this.offset += size

    return true
  }

  /**
   * 获取数据
   */
  get(key: string): any {
    const meta = this.metadata.get(key)
    if (!meta) {
      return undefined
    }

    const data = new Uint8Array(this.buffer, meta.offset, meta.size)

    switch (meta.type) {
      case 'arraybuffer':
        return data.buffer.slice(meta.offset, meta.offset + meta.size)

      case 'uint8array':
        return new Uint8Array(data)

      case 'string': {
        const decoder = new TextDecoder()
        return decoder.decode(data)
      }

      case 'json': {
        const decoder = new TextDecoder()
        const json = decoder.decode(data)
        return JSON.parse(json)
      }

      default:
        return data
    }
  }

  /**
   * 获取缓冲区的只读视图
   */
  getReadOnlyView(key: string): Uint8Array | null {
    const meta = this.metadata.get(key)
    if (!meta) {
      return null
    }

    return new Uint8Array(this.buffer, meta.offset, meta.size)
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      totalSize: this.buffer.byteLength,
      usedSize: this.offset,
      freeSize: this.buffer.byteLength - this.offset,
      entries: this.metadata.size,
    }
  }
}

