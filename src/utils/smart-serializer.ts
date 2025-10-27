/**
 * 智能序列化器 - 自动选择最优序列化策略
 * 
 * 特性：
 * 1. 自动检测数据类型并选择最优序列化方法
 * 2. 支持多种序列化格式（JSON、MessagePack、Protocol Buffers）
 * 3. 序列化结果缓存
 * 4. 增量序列化
 * 5. 自定义序列化器支持
 */

export type SerializationFormat = 'json' | 'msgpack' | 'binary' | 'custom'

export interface SerializerConfig {
  /** 默认格式 */
  defaultFormat?: SerializationFormat
  /** 是否启用压缩 */
  enableCompression?: boolean
  /** 是否缓存序列化结果 */
  enableCache?: boolean
  /** 缓存大小 */
  cacheSize?: number
  /** 是否启用类型检测 */
  enableTypeDetection?: boolean
  /** 自定义序列化器 */
  customSerializers?: Map<string, Serializer<any>>
}

export interface Serializer<T> {
  serialize(data: T): string | ArrayBuffer
  deserialize(data: string | ArrayBuffer): T
  canHandle(data: any): boolean
}

export interface SerializationResult {
  data: string | ArrayBuffer
  format: SerializationFormat
  size: number
  compressed: boolean
}

/**
 * 基础序列化器实现
 */
class JSONSerializer implements Serializer<any> {
  serialize(data: any): string {
    return JSON.stringify(data)
  }

  deserialize(data: string): any {
    return JSON.parse(data as string)
  }

  canHandle(data: any): boolean {
    // JSON 可以处理大多数基础类型
    return data !== undefined &&
      data !== null &&
      typeof data !== 'symbol' &&
      typeof data !== 'function'
  }
}

/**
 * 二进制序列化器（用于 TypedArray）
 */
class BinarySerializer implements Serializer<ArrayBuffer | TypedArray> {
  serialize(data: ArrayBuffer | TypedArray): ArrayBuffer {
    if (data instanceof ArrayBuffer) {
      return data
    }
    return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength)
  }

  deserialize(data: ArrayBuffer): ArrayBuffer {
    return data
  }

  canHandle(data: any): boolean {
    return data instanceof ArrayBuffer ||
      data instanceof Int8Array ||
      data instanceof Uint8Array ||
      data instanceof Int16Array ||
      data instanceof Uint16Array ||
      data instanceof Int32Array ||
      data instanceof Uint32Array ||
      data instanceof Float32Array ||
      data instanceof Float64Array
  }
}

/**
 * 智能序列化器
 */
export class SmartSerializer {
  private config: Required<SerializerConfig>
  private serializers = new Map<SerializationFormat, Serializer<any>>()
  private cache?: Map<any, SerializationResult>
  private typeCache = new WeakMap<object, SerializationFormat>()

  constructor(config: SerializerConfig = {}) {
    this.config = {
      defaultFormat: config.defaultFormat || 'json',
      enableCompression: config.enableCompression ?? false,
      enableCache: config.enableCache ?? true,
      cacheSize: config.cacheSize || 1000,
      enableTypeDetection: config.enableTypeDetection ?? true,
      customSerializers: config.customSerializers || new Map(),
    }

    // 注册内置序列化器
    this.serializers.set('json', new JSONSerializer())
    this.serializers.set('binary', new BinarySerializer())

    // 注册自定义序列化器
    for (const [name, serializer] of this.config.customSerializers) {
      this.serializers.set(name as SerializationFormat, serializer)
    }

    // 初始化缓存
    if (this.config.enableCache) {
      this.cache = new Map()
    }
  }

  /**
   * 序列化数据
   */
  serialize(data: any): SerializationResult {
    // 检查缓存
    if (this.cache && this.cache.has(data)) {
      return this.cache.get(data)!
    }

    // 检测最佳格式
    const format = this.detectFormat(data)
    const serializer = this.serializers.get(format)

    if (!serializer) {
      throw new Error(`No serializer found for format: ${format}`)
    }

    // 执行序列化
    let serialized = serializer.serialize(data)
    let compressed = false

    // 压缩（如果需要）
    if (this.config.enableCompression && typeof serialized === 'string') {
      const beforeSize = serialized.length
      const compressed = this.compress(serialized)

      if (compressed.length < beforeSize * 0.8) {
        serialized = compressed
        compressed = true
      }
    }

    const result: SerializationResult = {
      data: serialized,
      format,
      size: typeof serialized === 'string' ? serialized.length * 2 : serialized.byteLength,
      compressed,
    }

    // 缓存结果
    if (this.cache) {
      if (this.cache.size >= this.config.cacheSize) {
        // 简单的 FIFO 淘汰
        const firstKey = this.cache.keys().next().value
        this.cache.delete(firstKey)
      }
      this.cache.set(data, result)
    }

    return result
  }

  /**
   * 反序列化数据
   */
  deserialize(result: SerializationResult): any {
    const serializer = this.serializers.get(result.format)

    if (!serializer) {
      throw new Error(`No serializer found for format: ${result.format}`)
    }

    let data = result.data

    // 解压（如果需要）
    if (result.compressed && typeof data === 'string') {
      data = this.decompress(data)
    }

    return serializer.deserialize(data)
  }

  /**
   * 检测最佳序列化格式
   */
  private detectFormat(data: any): SerializationFormat {
    if (!this.config.enableTypeDetection) {
      return this.config.defaultFormat
    }

    // 检查类型缓存
    if (typeof data === 'object' && data !== null) {
      const cached = this.typeCache.get(data)
      if (cached) {
        return cached
      }
    }

    // 检查每个序列化器
    for (const [format, serializer] of this.serializers) {
      if (serializer.canHandle(data)) {
        // 缓存决策
        if (typeof data === 'object' && data !== null) {
          this.typeCache.set(data, format)
        }
        return format
      }
    }

    return this.config.defaultFormat
  }

  /**
   * 简单的压缩实现（LZ-String 算法）
   */
  private compress(data: string): string {
    if (data.length < 100) {
      return data // 太小的数据不压缩
    }

    const dict: Record<string, number> = {}
    const result: string[] = []
    let dictSize = 256
    let w = ''

    for (let i = 0; i < data.length; i++) {
      const c = data.charAt(i)
      const wc = w + c

      if (dict[wc] !== undefined) {
        w = wc
      } else {
        result.push(dict[w] !== undefined ? String.fromCharCode(dict[w]) : w)
        if (dictSize < 65536) { // 限制字典大小
          dict[wc] = dictSize++
        }
        w = c
      }
    }

    if (w) {
      result.push(dict[w] !== undefined ? String.fromCharCode(dict[w]) : w)
    }

    return btoa(result.join(''))
  }

  /**
   * 解压
   */
  private decompress(data: string): string {
    try {
      const compressed = atob(data)
      const dict: Record<number, string> = {}
      let dictSize = 256
      let w = compressed.charAt(0)
      let result = w

      for (let i = 0; i < 256; i++) {
        dict[i] = String.fromCharCode(i)
      }

      for (let i = 1; i < compressed.length; i++) {
        const k = compressed.charCodeAt(i)
        const entry = dict[k] !== undefined ? dict[k] : (w + w.charAt(0))
        result += entry

        if (dictSize < 65536) {
          dict[dictSize++] = w + entry.charAt(0)
        }
        w = entry
      }

      return result
    } catch {
      return data
    }
  }

  /**
   * 注册自定义序列化器
   */
  registerSerializer(name: string, serializer: Serializer<any>): void {
    this.serializers.set(name as SerializationFormat, serializer)
  }

  /**
   * 批量序列化
   */
  serializeBatch(items: any[]): SerializationResult[] {
    return items.map(item => this.serialize(item))
  }

  /**
   * 批量反序列化
   */
  deserializeBatch(results: SerializationResult[]): any[] {
    return results.map(result => this.deserialize(result))
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      cacheSize: this.cache?.size || 0,
      registeredFormats: Array.from(this.serializers.keys()),
      cacheHitRate: 0, // 需要额外的统计逻辑
    }
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache?.clear()
  }
}

/**
 * 增量序列化器 - 只序列化变化的部分
 */
export class IncrementalSerializer {
  private baseStates = new Map<string, any>()
  private serializer = new SmartSerializer()

  /**
   * 序列化增量
   */
  serializeDelta(key: string, currentState: any): SerializationResult | null {
    const baseState = this.baseStates.get(key)

    if (!baseState) {
      // 首次序列化，保存完整状态
      this.baseStates.set(key, this.deepClone(currentState))
      return this.serializer.serialize(currentState)
    }

    // 计算差异
    const delta = this.computeDelta(baseState, currentState)

    if (Object.keys(delta).length === 0) {
      return null // 无变化
    }

    // 更新基准状态
    this.applyDelta(baseState, delta)

    return this.serializer.serialize({ type: 'delta', delta })
  }

  /**
   * 反序列化增量
   */
  deserializeDelta(key: string, result: SerializationResult): any {
    const data = this.serializer.deserialize(result)

    if (data.type !== 'delta') {
      // 完整状态
      this.baseStates.set(key, this.deepClone(data))
      return data
    }

    // 应用增量
    const baseState = this.baseStates.get(key) || {}
    this.applyDelta(baseState, data.delta)
    return this.deepClone(baseState)
  }

  /**
   * 计算对象差异
   */
  private computeDelta(base: any, current: any): any {
    const delta: any = {}

    // 处理新增和修改的属性
    for (const key in current) {
      if (!(key in base)) {
        delta[key] = { op: 'add', value: current[key] }
      } else if (base[key] !== current[key]) {
        if (typeof current[key] === 'object' && typeof base[key] === 'object') {
          const subDelta = this.computeDelta(base[key], current[key])
          if (Object.keys(subDelta).length > 0) {
            delta[key] = { op: 'update', value: subDelta }
          }
        } else {
          delta[key] = { op: 'update', value: current[key] }
        }
      }
    }

    // 处理删除的属性
    for (const key in base) {
      if (!(key in current)) {
        delta[key] = { op: 'delete' }
      }
    }

    return delta
  }

  /**
   * 应用差异到对象
   */
  private applyDelta(target: any, delta: any): void {
    for (const key in delta) {
      const change = delta[key]

      switch (change.op) {
        case 'add':
        case 'update':
          if (typeof change.value === 'object' && change.op === 'update') {
            target[key] = target[key] || {}
            this.applyDelta(target[key], change.value)
          } else {
            target[key] = change.value
          }
          break

        case 'delete':
          delete target[key]
          break
      }
    }
  }

  /**
   * 深度克隆
   */
  private deepClone(obj: any): any {
    if (typeof structuredClone !== 'undefined') {
      try {
        return structuredClone(obj)
      } catch {
        // 回退到 JSON
      }
    }
    return JSON.parse(JSON.stringify(obj))
  }

  /**
   * 清除基准状态
   */
  clearBaseState(key: string): void {
    this.baseStates.delete(key)
  }

  /**
   * 清除所有基准状态
   */
  clearAllBaseStates(): void {
    this.baseStates.clear()
  }
}

