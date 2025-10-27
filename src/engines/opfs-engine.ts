/**
 * OPFS (Origin Private File System) 存储引擎
 * 
 * 基于浏览器的私有文件系统API实现的存储引擎
 * 
 * 特点：
 * - 存储容量大（通常几GB）
 * - 持久化存储
 * - 高性能文件操作
 * - 仅在HTTPS环境可用
 * - 需要浏览器支持
 * 
 * 浏览器兼容性：
 * - Chrome/Edge 86+
 * - Safari 15.2+
 * - Firefox (实验性支持)
 * 
 * @example
 * ```typescript
 * const engine = new OPFSEngine({
 *   directoryName: 'cache-data',
 * })
 * 
 * await engine.setItem('key', 'value')
 * const value = await engine.getItem('key')
 * ```
 */

import { BaseStorageEngine } from './base-engine'

/**
 * OPFS引擎配置
 */
export interface OPFSEngineOptions {
  /** 目录名称 */
  directoryName?: string

  /** 最大存储大小（字节） */
  maxSize?: number
}

/**
 * OPFS存储引擎
 */
export class OPFSEngine extends BaseStorageEngine {
  /** 引擎名称 */
  readonly name = 'opfs' as const

  /** 最大存储大小 */
  readonly maxSize: number

  /** 根目录句柄 */
  private root: FileSystemDirectoryHandle | null = null

  /** 缓存目录句柄 */
  private cacheDir: FileSystemDirectoryHandle | null = null

  /** 目录名称 */
  private directoryName: string

  /** 初始化状态 */
  private initPromise: Promise<void> | null = null

  /**
   * 创建OPFS引擎
   * 
   * @param options - 配置选项
   */
  constructor(options?: OPFSEngineOptions) {
    super()
    this.directoryName = options?.directoryName || 'ldesign-cache'
    this.maxSize = options?.maxSize || 1024 * 1024 * 1024 // 默认1GB

    // 异步初始化
    this.initPromise = this.initialize()
  }

  /**
   * 初始化OPFS引擎
   */
  private async initialize(): Promise<void> {
    try {
      // 检查API可用性
      if (
        typeof navigator === 'undefined'
        || !('storage' in navigator)
        || typeof (navigator.storage as any).getDirectory !== 'function'
      ) {
        this._available = false
        return
      }

      // 获取根目录
      this.root = await (navigator.storage as any).getDirectory() as FileSystemDirectoryHandle

      // 创建或获取缓存目录
      this.cacheDir = await this.root.getDirectoryHandle(this.directoryName, {
        create: true,
      })

      this._available = true

      // 计算已使用大小
      await this.updateUsedSize()
    }
    catch (error) {
      console.warn('[OPFSEngine] Initialization failed:', error)
      this._available = false
    }
  }

  /**
   * 确保已初始化
   */
  private async ensureInitialized(): Promise<void> {
    if (this.initPromise) {
      await this.initPromise
      this.initPromise = null
    }
  }

  /**
   * 编码键名为安全的文件名
   * 
   * @param key - 缓存键
   * @returns 安全的文件名
   */
  private encodeKey(key: string): string {
    // 使用Base64编码，替换文件系统不安全字符
    try {
      return btoa(encodeURIComponent(key))
        .replace(/\//g, '_')
        .replace(/\+/g, '-')
        .replace(/=/g, '')
    }
    catch {
      // 降级到简单替换
      return key.replace(/[^a-zA-Z0-9-_]/g, '_')
    }
  }

  /**
   * 解码文件名为原始键
   * 
   * @param fileName - 文件名
   * @returns 原始缓存键
   */
  private decodeKey(fileName: string): string {
    try {
      const restored = fileName
        .replace(/_/g, '/')
        .replace(/-/g, '+')
      return decodeURIComponent(atob(restored))
    }
    catch {
      return fileName
    }
  }

  /**
   * 设置缓存项
   */
  async setItem(key: string, value: string, ttl?: number): Promise<void> {
    await this.ensureInitialized()

    if (!this.cacheDir) {
      throw new Error('OPFS not initialized')
    }

    const fileName = this.encodeKey(key)

    try {
      // 创建或获取文件句柄
      const fileHandle = await this.cacheDir.getFileHandle(fileName, {
        create: true,
      })

      // 写入数据
      const writable = await fileHandle.createWritable()

      // 构建存储数据（包含TTL信息）
      const data = JSON.stringify({
        value,
        expiresAt: ttl ? Date.now() + ttl : undefined,
        createdAt: Date.now(),
      })

      await writable.write(data)
      await writable.close()

      // 更新已使用大小（简化）
      this._usedSize += data.length
    }
    catch (error) {
      console.error('[OPFSEngine] setItem failed:', error)
      throw error
    }
  }

  /**
   * 获取缓存项
   */
  async getItem(key: string): Promise<string | null> {
    await this.ensureInitialized()

    if (!this.cacheDir) {
      return null
    }

    const fileName = this.encodeKey(key)

    try {
      const fileHandle = await this.cacheDir.getFileHandle(fileName)
      const file = await fileHandle.getFile()
      const content = await file.text()

      // 解析数据
      const data = JSON.parse(content)

      // 检查是否过期
      if (data.expiresAt && Date.now() > data.expiresAt) {
        // 过期，删除文件
        await this.removeItem(key)
        return null
      }

      return data.value
    }
    catch {
      return null
    }
  }

  /**
   * 删除缓存项
   */
  async removeItem(key: string): Promise<void> {
    await this.ensureInitialized()

    if (!this.cacheDir) {
      return
    }

    const fileName = this.encodeKey(key)

    try {
      await this.cacheDir.removeEntry(fileName)
      // 简化：不精确计算大小变化
      await this.updateUsedSize()
    }
    catch {
      // 文件不存在，忽略错误
    }
  }

  /**
   * 清空所有缓存项
   */
  async clear(): Promise<void> {
    await this.ensureInitialized()

    if (!this.root || !this.cacheDir) {
      return
    }

    try {
      // 删除整个缓存目录
      await this.root.removeEntry(this.directoryName, { recursive: true })

      // 重新创建目录
      this.cacheDir = await this.root.getDirectoryHandle(this.directoryName, {
        create: true,
      })

      this._usedSize = 0
    }
    catch (error) {
      console.error('[OPFSEngine] clear failed:', error)
    }
  }

  /**
   * 获取所有键名
   */
  async keys(): Promise<string[]> {
    await this.ensureInitialized()

    if (!this.cacheDir) {
      return []
    }

    const keys: string[] = []

    try {
      // 遍历目录
      for await (const entry of (this.cacheDir as any).values()) {
        if (entry.kind === 'file') {
          const key = this.decodeKey(entry.name)
          keys.push(key)
        }
      }
    }
    catch (error) {
      console.error('[OPFSEngine] keys failed:', error)
    }

    return keys
  }

  /**
   * 检查键是否存在
   */
  async hasItem(key: string): Promise<boolean> {
    await this.ensureInitialized()

    if (!this.cacheDir) {
      return false
    }

    const fileName = this.encodeKey(key)

    try {
      await this.cacheDir.getFileHandle(fileName)
      return true
    }
    catch {
      return false
    }
  }

  /**
   * 获取缓存项数量
   */
  async length(): Promise<number> {
    const keyList = await this.keys()
    return keyList.length
  }

  /**
   * 清理过期项
   */
  async cleanup(): Promise<void> {
    await this.ensureInitialized()

    if (!this.cacheDir) {
      return
    }

    const now = Date.now()
    const keysToRemove: string[] = []

    try {
      // 遍历所有文件
      for await (const entry of (this.cacheDir as any).values()) {
        if (entry.kind === 'file') {
          try {
            const fileHandle = await this.cacheDir.getFileHandle(entry.name)
            const file = await fileHandle.getFile()
            const content = await file.text()
            const data = JSON.parse(content)

            // 检查是否过期
            if (data.expiresAt && now > data.expiresAt) {
              keysToRemove.push(this.decodeKey(entry.name))
            }
          }
          catch {
            // 解析失败，跳过
          }
        }
      }

      // 删除过期项
      for (const key of keysToRemove) {
        await this.removeItem(key)
      }
    }
    catch (error) {
      console.error('[OPFSEngine] cleanup failed:', error)
    }
  }

  /**
   * 更新已使用大小
   */
  protected async updateUsedSize(): Promise<void> {
    if (!this.cacheDir) {
      this._usedSize = 0
      return
    }

    let totalSize = 0

    try {
      for await (const entry of (this.cacheDir as any).values()) {
        if (entry.kind === 'file') {
          try {
            const fileHandle = await this.cacheDir.getFileHandle(entry.name)
            const file = await fileHandle.getFile()
            totalSize += file.size
          }
          catch {
            // 跳过无法访问的文件
          }
        }
      }
    }
    catch (error) {
      console.error('[OPFSEngine] updateUsedSize failed:', error)
    }

    this._usedSize = totalSize
  }
}

