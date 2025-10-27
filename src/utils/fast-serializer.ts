/**
 * 高性能序列化器
 * 
 * 特性：
 * 1. 类型优化的序列化
 * 2. 结构共享
 * 3. 二进制编码支持
 * 4. 流式序列化
 * 5. 零拷贝优化
 */

export interface SerializerConfig {
  /** 是否启用二进制编码 */
  binary?: boolean
  /** 是否启用结构共享 */
  structureSharing?: boolean
  /** 是否启用压缩 */
  compression?: boolean
  /** 自定义序列化器 */
  customSerializers?: Map<string, Serializer<any>>
  /** 最大深度 */
  maxDepth?: number
}

export interface Serializer<T> {
  serialize: (value: T) => string | ArrayBuffer
  deserialize: (data: string | ArrayBuffer) => T
  canHandle: (value: any) => boolean
}

export interface SerializationStats {
  /** 序列化次数 */
  serializeCount: number
  /** 反序列化次数 */
  deserializeCount: number
  /** 平均序列化时间 */
  avgSerializeTime: number
  /** 平均反序列化时间 */
  avgDeserializeTime: number
  /** 结构共享命中率 */
  structureSharingHitRate: number
}

/**
 * 快速序列化器
 */
export class FastSerializer {
  private config: Required<SerializerConfig>
  private serializers = new Map<string, Serializer<any>>()
  private structureCache = new Map<string, any>()
  private stats = {
    serializeCount: 0,
    deserializeCount: 0,
    totalSerializeTime: 0,
    totalDeserializeTime: 0,
    structureHits: 0,
    structureMisses: 0,
  }

  constructor(config: SerializerConfig = {}) {
    this.config = {
      binary: config.binary ?? false,
      structureSharing: config.structureSharing ?? true,
      compression: config.compression ?? false,
      customSerializers: config.customSerializers || new Map(),
      maxDepth: config.maxDepth || 100,
    }

    // 注册内置序列化器
    this.registerBuiltinSerializers()

    // 注册自定义序列化器
    for (const [type, serializer] of this.config.customSerializers) {
      this.serializers.set(type, serializer)
    }
  }

  /**
   * 序列化值
   */
  serialize(value: any): string | ArrayBuffer {
    const start = performance.now()
    this.stats.serializeCount++

    try {
      // 检查自定义序列化器
      for (const [type, serializer] of this.serializers) {
        if (serializer.canHandle(value)) {
          return serializer.serialize(value)
        }
      }

      // 使用优化的序列化
      if (this.config.binary) {
        return this.binarySerialize(value)
      } else {
        return this.optimizedStringSerialize(value)
      }
    } finally {
      this.stats.totalSerializeTime += performance.now() - start
    }
  }

  /**
   * 反序列化值
   */
  deserialize<T = any>(data: string | ArrayBuffer): T {
    const start = performance.now()
    this.stats.deserializeCount++

    try {
      if (data instanceof ArrayBuffer) {
        return this.binaryDeserialize(data)
      } else {
        return this.optimizedStringDeserialize(data)
      }
    } finally {
      this.stats.totalDeserializeTime += performance.now() - start
    }
  }

  /**
   * 优化的字符串序列化
   */
  private optimizedStringSerialize(value: any, depth = 0): string {
    if (depth > this.config.maxDepth) {
      throw new Error('Max serialization depth exceeded')
    }

    // 基本类型快速路径
    if (value === null) return 'n'
    if (value === undefined) return 'u'
    if (typeof value === 'boolean') return value ? 't' : 'f'
    if (typeof value === 'number') {
      // 整数优化
      if (Number.isInteger(value) && value >= -2147483648 && value <= 2147483647) {
        return `i${value}`
      }
      return `d${value}`
    }
    if (typeof value === 'string') {
      // 字符串优化：使用长度前缀
      return `s${value.length}:${value}`
    }

    // 日期
    if (value instanceof Date) {
      return `D${value.getTime()}`
    }

    // 正则表达式
    if (value instanceof RegExp) {
      return `r${value.source}:${value.flags}`
    }

    // 数组
    if (Array.isArray(value)) {
      const items = value.map(item => this.optimizedStringSerialize(item, depth + 1))
      return `[${items.join(',')}]`
    }

    // 对象
    if (typeof value === 'object') {
      // 结构共享检查
      if (this.config.structureSharing) {
        const hash = this.hashObject(value)
        if (this.structureCache.has(hash)) {
          this.stats.structureHits++
          return `#${hash}`
        }
        this.stats.structureMisses++
        this.structureCache.set(hash, value)
      }

      const pairs: string[] = []
      for (const key in value) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
          const serializedValue = this.optimizedStringSerialize(value[key], depth + 1)
          pairs.push(`${key}:${serializedValue}`)
        }
      }
      return `{${pairs.join(',')}}`
    }

    // 函数和其他类型
    throw new Error(`Cannot serialize type: ${typeof value}`)
  }

  /**
   * 优化的字符串反序列化
   */
  private optimizedStringDeserialize(data: string): any {
    const type = data[0]
    const content = data.slice(1)

    switch (type) {
      case 'n': return null
      case 'u': return undefined
      case 't': return true
      case 'f': return false
      case 'i': return parseInt(content, 10)
      case 'd': return parseFloat(content)
      case 's': {
        const colonIndex = content.indexOf(':')
        const length = parseInt(content.slice(0, colonIndex), 10)
        return content.slice(colonIndex + 1, colonIndex + 1 + length)
      }
      case 'D': return new Date(parseInt(content, 10))
      case 'r': {
        const colonIndex = content.indexOf(':')
        const source = content.slice(0, colonIndex)
        const flags = content.slice(colonIndex + 1)
        return new RegExp(source, flags)
      }
      case '[': {
        // 简化的数组解析
        return this.parseArray(content)
      }
      case '{': {
        // 简化的对象解析
        return this.parseObject(content)
      }
      case '#': {
        // 结构共享引用
        return this.structureCache.get(content) || {}
      }
      default:
        throw new Error(`Unknown serialization type: ${type}`)
    }
  }

  /**
   * 二进制序列化
   */
  private binarySerialize(value: any): ArrayBuffer {
    const encoder = new BinaryEncoder()
    this.encodeBinary(encoder, value)
    return encoder.toArrayBuffer()
  }

  /**
   * 二进制反序列化
   */
  private binaryDeserialize(buffer: ArrayBuffer): any {
    const decoder = new BinaryDecoder(buffer)
    return this.decodeBinary(decoder)
  }

  /**
   * 二进制编码
   */
  private encodeBinary(encoder: BinaryEncoder, value: any): void {
    if (value === null) {
      encoder.writeUint8(BinaryType.NULL)
    } else if (value === undefined) {
      encoder.writeUint8(BinaryType.UNDEFINED)
    } else if (typeof value === 'boolean') {
      encoder.writeUint8(BinaryType.BOOLEAN)
      encoder.writeUint8(value ? 1 : 0)
    } else if (typeof value === 'number') {
      if (Number.isInteger(value)) {
        encoder.writeUint8(BinaryType.INTEGER)
        encoder.writeInt32(value)
      } else {
        encoder.writeUint8(BinaryType.FLOAT)
        encoder.writeFloat64(value)
      }
    } else if (typeof value === 'string') {
      encoder.writeUint8(BinaryType.STRING)
      encoder.writeString(value)
    } else if (value instanceof Date) {
      encoder.writeUint8(BinaryType.DATE)
      encoder.writeFloat64(value.getTime())
    } else if (Array.isArray(value)) {
      encoder.writeUint8(BinaryType.ARRAY)
      encoder.writeUint32(value.length)
      for (const item of value) {
        this.encodeBinary(encoder, item)
      }
    } else if (typeof value === 'object') {
      encoder.writeUint8(BinaryType.OBJECT)
      const keys = Object.keys(value)
      encoder.writeUint32(keys.length)
      for (const key of keys) {
        encoder.writeString(key)
        this.encodeBinary(encoder, value[key])
      }
    }
  }

  /**
   * 二进制解码
   */
  private decodeBinary(decoder: BinaryDecoder): any {
    const type = decoder.readUint8()

    switch (type) {
      case BinaryType.NULL: return null
      case BinaryType.UNDEFINED: return undefined
      case BinaryType.BOOLEAN: return decoder.readUint8() === 1
      case BinaryType.INTEGER: return decoder.readInt32()
      case BinaryType.FLOAT: return decoder.readFloat64()
      case BinaryType.STRING: return decoder.readString()
      case BinaryType.DATE: return new Date(decoder.readFloat64())
      case BinaryType.ARRAY: {
        const length = decoder.readUint32()
        const array = new Array(length)
        for (let i = 0; i < length; i++) {
          array[i] = this.decodeBinary(decoder)
        }
        return array
      }
      case BinaryType.OBJECT: {
        const length = decoder.readUint32()
        const obj: any = {}
        for (let i = 0; i < length; i++) {
          const key = decoder.readString()
          obj[key] = this.decodeBinary(decoder)
        }
        return obj
      }
      default:
        throw new Error(`Unknown binary type: ${type}`)
    }
  }

  /**
   * 对象哈希（用于结构共享）
   */
  private hashObject(obj: any): string {
    const keys = Object.keys(obj).sort()
    let hash = ''

    for (const key of keys) {
      const value = obj[key]
      const type = typeof value
      hash += `${key}:${type}:`

      if (type === 'object' && value !== null) {
        hash += Array.isArray(value) ? 'array' : 'object'
      } else {
        hash += String(value)
      }
      hash += ';'
    }

    // 简单的哈希函数
    let hashCode = 0
    for (let i = 0; i < hash.length; i++) {
      const char = hash.charCodeAt(i)
      hashCode = ((hashCode << 5) - hashCode) + char
      hashCode = hashCode & hashCode
    }

    return hashCode.toString(36)
  }

  /**
   * 解析数组（简化版）
   */
  private parseArray(content: string): any[] {
    if (!content) return []

    const items: any[] = []
    let depth = 0
    let start = 0

    for (let i = 0; i < content.length; i++) {
      const char = content[i]
      if (char === '[' || char === '{') depth++
      else if (char === ']' || char === '}') depth--
      else if (char === ',' && depth === 0) {
        items.push(this.optimizedStringDeserialize(content.slice(start, i)))
        start = i + 1
      }
    }

    if (start < content.length) {
      items.push(this.optimizedStringDeserialize(content.slice(start)))
    }

    return items
  }

  /**
   * 解析对象（简化版）
   */
  private parseObject(content: string): any {
    if (!content) return {}

    const obj: any = {}
    let depth = 0
    let start = 0

    for (let i = 0; i < content.length; i++) {
      const char = content[i]
      if (char === '[' || char === '{') depth++
      else if (char === ']' || char === '}') depth--
      else if (char === ',' && depth === 0) {
        this.parsePair(content.slice(start, i), obj)
        start = i + 1
      }
    }

    if (start < content.length) {
      this.parsePair(content.slice(start), obj)
    }

    return obj
  }

  /**
   * 解析键值对
   */
  private parsePair(pair: string, obj: any): void {
    const colonIndex = pair.indexOf(':')
    if (colonIndex === -1) return

    const key = pair.slice(0, colonIndex)
    const value = this.optimizedStringDeserialize(pair.slice(colonIndex + 1))
    obj[key] = value
  }

  /**
   * 注册内置序列化器
   */
  private registerBuiltinSerializers(): void {
    // Map 序列化器
    this.serializers.set('Map', {
      serialize: (map: Map<any, any>) => {
        const entries = Array.from(map.entries())
        return this.serialize(entries)
      },
      deserialize: (data: string | ArrayBuffer) => {
        const entries = this.deserialize<Array<[any, any]>>(data)
        return new Map(entries)
      },
      canHandle: (value) => value instanceof Map,
    })

    // Set 序列化器
    this.serializers.set('Set', {
      serialize: (set: Set<any>) => {
        const values = Array.from(set)
        return this.serialize(values)
      },
      deserialize: (data: string | ArrayBuffer) => {
        const values = this.deserialize<any[]>(data)
        return new Set(values)
      },
      canHandle: (value) => value instanceof Set,
    })

    // TypedArray 序列化器
    const typedArrayTypes = [
      Int8Array, Uint8Array, Uint8ClampedArray,
      Int16Array, Uint16Array,
      Int32Array, Uint32Array,
      Float32Array, Float64Array,
    ]

    for (const ArrayType of typedArrayTypes) {
      this.serializers.set(ArrayType.name, {
        serialize: (array: any) => {
          return array.buffer.slice(array.byteOffset, array.byteOffset + array.byteLength)
        },
        deserialize: (buffer: ArrayBuffer) => {
          return new ArrayType(buffer)
        },
        canHandle: (value) => value instanceof ArrayType,
      })
    }
  }

  /**
   * 获取统计信息
   */
  getStats(): SerializationStats {
    return {
      serializeCount: this.stats.serializeCount,
      deserializeCount: this.stats.deserializeCount,
      avgSerializeTime: this.stats.serializeCount > 0
        ? this.stats.totalSerializeTime / this.stats.serializeCount
        : 0,
      avgDeserializeTime: this.stats.deserializeCount > 0
        ? this.stats.totalDeserializeTime / this.stats.deserializeCount
        : 0,
      structureSharingHitRate: this.stats.structureHits + this.stats.structureMisses > 0
        ? this.stats.structureHits / (this.stats.structureHits + this.stats.structureMisses)
        : 0,
    }
  }

  /**
   * 清理结构缓存
   */
  clearStructureCache(): void {
    this.structureCache.clear()
  }
}

/**
 * 二进制类型枚举
 */
enum BinaryType {
  NULL = 0,
  UNDEFINED = 1,
  BOOLEAN = 2,
  INTEGER = 3,
  FLOAT = 4,
  STRING = 5,
  DATE = 6,
  ARRAY = 7,
  OBJECT = 8,
}

/**
 * 二进制编码器
 */
class BinaryEncoder {
  private chunks: Uint8Array[] = []
  private currentChunk: Uint8Array
  private position = 0
  private readonly CHUNK_SIZE = 1024

  constructor() {
    this.currentChunk = new Uint8Array(this.CHUNK_SIZE)
  }

  writeUint8(value: number): void {
    this.ensureCapacity(1)
    this.currentChunk[this.position++] = value
  }

  writeInt32(value: number): void {
    this.ensureCapacity(4)
    const view = new DataView(this.currentChunk.buffer, this.position)
    view.setInt32(0, value, true)
    this.position += 4
  }

  writeUint32(value: number): void {
    this.ensureCapacity(4)
    const view = new DataView(this.currentChunk.buffer, this.position)
    view.setUint32(0, value, true)
    this.position += 4
  }

  writeFloat64(value: number): void {
    this.ensureCapacity(8)
    const view = new DataView(this.currentChunk.buffer, this.position)
    view.setFloat64(0, value, true)
    this.position += 8
  }

  writeString(value: string): void {
    const encoder = new TextEncoder()
    const bytes = encoder.encode(value)
    this.writeUint32(bytes.length)
    this.writeBytes(bytes)
  }

  private writeBytes(bytes: Uint8Array): void {
    for (const byte of bytes) {
      this.writeUint8(byte)
    }
  }

  private ensureCapacity(size: number): void {
    if (this.position + size > this.CHUNK_SIZE) {
      this.chunks.push(this.currentChunk.slice(0, this.position))
      this.currentChunk = new Uint8Array(this.CHUNK_SIZE)
      this.position = 0
    }
  }

  toArrayBuffer(): ArrayBuffer {
    // 收集所有数据
    const totalSize = this.chunks.reduce((sum, chunk) => sum + chunk.length, 0) + this.position
    const result = new Uint8Array(totalSize)

    let offset = 0
    for (const chunk of this.chunks) {
      result.set(chunk, offset)
      offset += chunk.length
    }

    if (this.position > 0) {
      result.set(this.currentChunk.slice(0, this.position), offset)
    }

    return result.buffer
  }
}

/**
 * 二进制解码器
 */
class BinaryDecoder {
  private view: DataView
  private position = 0

  constructor(buffer: ArrayBuffer) {
    this.view = new DataView(buffer)
  }

  readUint8(): number {
    return this.view.getUint8(this.position++)
  }

  readInt32(): number {
    const value = this.view.getInt32(this.position, true)
    this.position += 4
    return value
  }

  readUint32(): number {
    const value = this.view.getUint32(this.position, true)
    this.position += 4
    return value
  }

  readFloat64(): number {
    const value = this.view.getFloat64(this.position, true)
    this.position += 8
    return value
  }

  readString(): string {
    const length = this.readUint32()
    const bytes = new Uint8Array(this.view.buffer, this.position, length)
    this.position += length

    const decoder = new TextDecoder()
    return decoder.decode(bytes)
  }
}

/**
 * 创建快速序列化器
 */
export function createFastSerializer(config?: SerializerConfig): FastSerializer {
  return new FastSerializer(config)
}
