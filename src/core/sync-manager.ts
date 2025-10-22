import type { CacheEvent, StorageEngine } from '../types'
import type { CacheManager } from './cache-manager'

import { EventEmitter } from '../utils'

/**
 * 冲突解决策略
 */
export type ConflictResolutionStrategy = 'last-write-wins' | 'first-write-wins' | 'version-vector' | 'custom'

/**
 * 同步配置
 */
export interface SyncOptions {
  /** 是否启用同步 */
  enabled?: boolean
  /** 同步通道名称 */
  channel?: string
  /** 同步延迟（毫秒） */
  debounce?: number
  /** 同步的存储引擎 */
  engines?: StorageEngine[]
  /** 同步事件类型 */
  events?: Array<'set' | 'remove' | 'clear'>
  /** 冲突解决策略 */
  conflictResolution?: ConflictResolutionStrategy
  /** 自定义冲突解决函数 */
  customResolver?: (local: SyncData, remote: SyncData) => SyncData
  /** 是否启用增量同步 */
  enableDeltaSync?: boolean
  /** 是否启用离线队列 */
  enableOfflineQueue?: boolean
  /** 离线队列最大大小 */
  maxOfflineQueueSize?: number
  /** 是否压缩同步消息 */
  compressMessages?: boolean
  /** 批量同步间隔（毫秒） */
  batchInterval?: number
}

/**
 * 同步数据结构
 */
export interface SyncData {
  value: any
  timestamp: number
  version: number
  vectorClock?: Record<string, number>
  source: string
}

/**
 * 同步消息
 */
interface SyncMessage {
  type: 'set' | 'remove' | 'clear' | 'sync' | 'ping' | 'batch' | 'conflict'
  key?: string
  value?: any
  data?: SyncData
  options?: any
  timestamp: number
  version?: number
  vectorClock?: Record<string, number>
  source: string
  batch?: Array<{ type: string, key: string, data: SyncData }>
}

/**
 * 离线队列项
 */
interface OfflineQueueItem {
  message: SyncMessage
  timestamp: number
  retries: number
}

/**
 * 跨标签页同步管理器（增强版）
 * 
 * 使用 BroadcastChannel API 或 storage 事件实现跨标签页缓存同步
 * 
 * 新增特性：
 * - 冲突解决机制（LWW、版本向量）
 * - 增量同步优化
 * - 离线队列支持
 * - 批量同步
 * - 同步状态管理
 */
export class SyncManager {
  private channel?: BroadcastChannel
  private storageHandler?: (e: StorageEvent) => void
  private readonly sourceId: string
  private readonly emitter = new EventEmitter<SyncMessage>()
  private syncTimer?: number

  // 版本管理
  private versionCounter: number = 0
  private vectorClock: Record<string, number> = {}
  private localData: Map<string, SyncData> = new Map()

  // 离线队列
  private offlineQueue: OfflineQueueItem[] = []
  private isOnline: boolean = true

  // 批量同步
  private batchQueue: SyncMessage[] = []
  private batchTimer?: number

  // 同步状态
  private syncStats = {
    sent: 0,
    received: 0,
    conflicts: 0,
    resolved: 0,
    queued: 0,
  }

  constructor(
    private manager: CacheManager,
    private options: SyncOptions = {},
  ) {
    this.sourceId = this.generateSourceId()
    this.vectorClock[this.sourceId] = 0

    if (options.enabled !== false) {
      this.initialize()
    }

    // 监听在线/离线状态
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleOnline())
      window.addEventListener('offline', () => this.handleOffline())
      this.isOnline = navigator.onLine
    }
  }

  /**
   * 生成唯一源ID
   */
  private generateSourceId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 初始化同步
   */
  private initialize(): void {
    if (this.supportsBroadcastChannel()) {
      this.initBroadcastChannel()
    }
    else if (this.supportsStorageEvent()) {
      this.initStorageEvent()
    }

    // 监听本地缓存事件
    this.setupLocalListeners()
  }

  /**
   * 检查是否支持 BroadcastChannel
   */
  private supportsBroadcastChannel(): boolean {
    return typeof BroadcastChannel !== 'undefined'
  }

  /**
   * 检查是否支持 storage 事件
   */
  private supportsStorageEvent(): boolean {
    return typeof window !== 'undefined' && 'storage' in window
  }

  /**
   * 初始化 BroadcastChannel
   */
  private initBroadcastChannel(): void {
    const channelName = this.options.channel || 'ldesign-cache-sync'
    this.channel = new BroadcastChannel(channelName)

    this.channel.onmessage = (event) => {
      this.handleSyncMessage(event.data)
    }
  }

  /**
   * 初始化 storage 事件监听
   */
  private initStorageEvent(): void {
    if (typeof window === 'undefined') { return }

    this.storageHandler = (e: StorageEvent) => {
      if (!e.key?.startsWith('__sync__')) { return }

      try {
        const message: SyncMessage = JSON.parse(e.newValue || '{}')
        this.handleSyncMessage(message)
      }
      catch (error) {
        console.warn('Failed to parse sync message:', error)
      }
    }

    window.addEventListener('storage', this.storageHandler)
  }

  /**
   * 设置本地缓存事件监听
   */
  private setupLocalListeners(): void {
    const events = this.options.events || ['set', 'remove', 'clear']

    events.forEach((event) => {
      this.manager.on(event, (e: CacheEvent) => {
        if (this.shouldSync(e.engine)) {
          // 更新版本号和向量时钟
          this.versionCounter++
          this.vectorClock[this.sourceId] = this.versionCounter

          // 创建同步数据
          const syncData: SyncData = {
            value: e.value,
            timestamp: e.timestamp,
            version: this.versionCounter,
            vectorClock: { ...this.vectorClock },
            source: this.sourceId,
          }

          // 保存本地数据副本
          if (e.key) {
            this.localData.set(e.key, syncData)
          }

          // 广播消息
          this.broadcastMessage({
            type: event as any,
            key: e.key,
            value: e.value,
            data: syncData,
            timestamp: e.timestamp,
            version: this.versionCounter,
            vectorClock: { ...this.vectorClock },
            source: this.sourceId,
          })
        }
      })
    })
  }

  /**
   * 判断是否需要同步
   */
  private shouldSync(engine: StorageEngine): boolean {
    if (!this.options.engines) {
      // 默认同步 localStorage 和 sessionStorage
      return engine === 'localStorage' || engine === 'sessionStorage'
    }
    return this.options.engines.includes(engine)
  }

  /**
   * 广播同步消息
   */
  private broadcastMessage(message: SyncMessage): void {
    // 离线时加入队列
    if (!this.isOnline && this.options.enableOfflineQueue) {
      this.enqueueOfflineMessage(message)
      return
    }

    // 批量同步
    if (this.options.batchInterval && this.options.batchInterval > 0) {
      this.batchQueue.push(message)

      if (!this.batchTimer) {
        this.batchTimer = window.setTimeout(() => {
          this.flushBatchQueue()
        }, this.options.batchInterval)
      }
      return
    }

    // 防抖处理
    if (this.options.debounce) {
      if (this.syncTimer) {
        clearTimeout(this.syncTimer)
      }
      this.syncTimer = window.setTimeout(() => {
        this.sendMessage(message)
      }, this.options.debounce)
    }
    else {
      this.sendMessage(message)
    }
  }

  /**
   * 加入离线队列
   */
  private enqueueOfflineMessage(message: SyncMessage): void {
    const maxSize = this.options.maxOfflineQueueSize || 1000

    if (this.offlineQueue.length >= maxSize) {
      // 移除最旧的消息
      this.offlineQueue.shift()
    }

    this.offlineQueue.push({
      message,
      timestamp: Date.now(),
      retries: 0,
    })

    this.syncStats.queued++
  }

  /**
   * 刷新批量队列
   */
  private flushBatchQueue(): void {
    if (this.batchQueue.length === 0) {
      return
    }

    // 构造批量消息
    const batchMessage: SyncMessage = {
      type: 'batch',
      timestamp: Date.now(),
      source: this.sourceId,
      batch: this.batchQueue.map(msg => ({
        type: msg.type,
        key: msg.key || '',
        data: msg.data!,
      })),
    }

    this.sendMessage(batchMessage)
    this.batchQueue = []
    this.batchTimer = undefined
  }

  /**
   * 发送消息
   */
  private sendMessage(message: SyncMessage): void {
    if (this.channel) {
      this.channel.postMessage(message)
    }
    else if (typeof window !== 'undefined' && window.localStorage) {
      // 使用 localStorage 作为后备方案
      const key = `__sync__${Date.now()}`
      try {
        window.localStorage.setItem(key, JSON.stringify(message))
        // 立即删除，仅触发 storage 事件
        window.localStorage.removeItem(key)
      }
      catch (error) {
        console.warn('Failed to send sync message:', error)
      }
    }

    // 更新统计
    this.syncStats.sent++

    // 触发本地事件
    this.emitter.emit('sync', message)
  }

  /**
   * 处理同步消息（增强版）
   */
  private async handleSyncMessage(message: SyncMessage): Promise<void> {
    // 忽略自己发送的消息
    if (message.source === this.sourceId) { return }

    this.syncStats.received++

    try {
      switch (message.type) {
        case 'set':
          if (message.key && message.data) {
            await this.handleSetMessage(message.key, message.data)
          }
          else if (message.key && message.value !== undefined) {
            // 向后兼容旧格式
            await this.manager.set(message.key, message.value, message.options)
          }
          break

        case 'remove':
          if (message.key) {
            await this.manager.remove(message.key)
          }
          break

        case 'clear':
          await this.manager.clear()
          break

        case 'batch':
          // 批量消息处理
          if (message.batch) {
            await this.handleBatchMessage(message.batch)
          }
          break

        case 'sync':
          // 全量同步请求
          await this.handleSyncRequest()
          break

        case 'ping':
          // 心跳消息
          this.sendMessage({
            type: 'ping',
            timestamp: Date.now(),
            source: this.sourceId,
          })
          break

        case 'conflict':
          // 冲突通知
          this.emitter.emit('conflict' as any, message)
          break
      }

      // 更新向量时钟
      if (message.vectorClock) {
        this.mergeVectorClock(message.vectorClock)
      }
    }
    catch (error) {
      console.error('Failed to handle sync message:', error)
    }
  }

  /**
   * 处理 set 消息（带冲突解决）
   */
  private async handleSetMessage(key: string, remoteData: SyncData): Promise<void> {
    const localData = this.localData.get(key)

    // 没有本地数据，直接应用
    if (!localData) {
      await this.manager.set(key, remoteData.value)
      this.localData.set(key, remoteData)
      return
    }

    // 检测冲突
    if (this.hasConflict(localData, remoteData)) {
      this.syncStats.conflicts++
      const resolved = await this.resolveConflict(key, localData, remoteData)

      if (resolved) {
        await this.manager.set(key, resolved.value)
        this.localData.set(key, resolved)
        this.syncStats.resolved++
      }
    }
    else {
      // 无冲突，直接应用远程数据
      await this.manager.set(key, remoteData.value)
      this.localData.set(key, remoteData)
    }
  }

  /**
   * 处理批量消息
   */
  private async handleBatchMessage(batch: Array<{ type: string, key: string, data: SyncData }>): Promise<void> {
    for (const item of batch) {
      try {
        if (item.type === 'set') {
          await this.handleSetMessage(item.key, item.data)
        }
        else if (item.type === 'remove') {
          await this.manager.remove(item.key)
        }
      }
      catch (error) {
        console.error(`Failed to handle batch item ${item.key}:`, error)
      }
    }
  }

  /**
   * 检测是否有冲突
   */
  private hasConflict(local: SyncData, remote: SyncData): boolean {
    const strategy = this.options.conflictResolution || 'last-write-wins'

    switch (strategy) {
      case 'version-vector':
        return this.hasVectorClockConflict(local.vectorClock, remote.vectorClock)

      case 'last-write-wins':
      case 'first-write-wins':
        // 基于时间戳的策略不需要冲突检测，直接比较
        return false

      case 'custom':
        // 自定义策略总是检测冲突，让用户决定
        return true

      default:
        return false
    }
  }

  /**
   * 检测向量时钟冲突
   */
  private hasVectorClockConflict(
    local?: Record<string, number>,
    remote?: Record<string, number>,
  ): boolean {
    if (!local || !remote) {
      return false
    }

    let localNewer = false
    let remoteNewer = false

    // 比较所有源的版本号
    const allSources = new Set([...Object.keys(local), ...Object.keys(remote)])

    for (const source of allSources) {
      const localVersion = local[source] || 0
      const remoteVersion = remote[source] || 0

      if (localVersion > remoteVersion) {
        localNewer = true
      }
      else if (remoteVersion > localVersion) {
        remoteNewer = true
      }
    }

    // 如果双方都有更新，说明有冲突
    return localNewer && remoteNewer
  }

  /**
   * 解决冲突
   */
  private async resolveConflict(
    key: string,
    local: SyncData,
    remote: SyncData,
  ): Promise<SyncData | null> {
    const strategy = this.options.conflictResolution || 'last-write-wins'

    switch (strategy) {
      case 'last-write-wins':
        return remote.timestamp > local.timestamp ? remote : local

      case 'first-write-wins':
        return local.timestamp < remote.timestamp ? local : remote

      case 'version-vector':
        // 向量时钟无法自动解决并发冲突，使用时间戳作为后备
        return remote.timestamp > local.timestamp ? remote : local

      case 'custom':
        if (this.options.customResolver) {
          try {
            return this.options.customResolver(local, remote)
          }
          catch (error) {
            console.error('Custom resolver failed:', error)
            // 失败时回退到 LWW
            return remote.timestamp > local.timestamp ? remote : local
          }
        }
        return remote.timestamp > local.timestamp ? remote : local

      default:
        return remote
    }
  }

  /**
   * 合并向量时钟
   */
  private mergeVectorClock(remoteClock: Record<string, number>): void {
    for (const [source, version] of Object.entries(remoteClock)) {
      const currentVersion = this.vectorClock[source] || 0
      this.vectorClock[source] = Math.max(currentVersion, version)
    }
  }

  /**
   * 处理同步请求
   */
  private async handleSyncRequest(): Promise<void> {
    // 获取所有数据并广播
    const keys = await this.manager.keys()
    for (const key of keys) {
      const value = await this.manager.get(key)
      if (value !== null) {
        this.broadcastMessage({
          type: 'set',
          key,
          value,
          timestamp: Date.now(),
          source: this.sourceId,
        })
      }
    }
  }

  /**
   * 请求全量同步
   */
  async requestSync(): Promise<void> {
    this.sendMessage({
      type: 'sync',
      timestamp: Date.now(),
      source: this.sourceId,
    })
  }

  /**
   * 发送心跳
   */
  ping(): void {
    this.sendMessage({
      type: 'ping',
      timestamp: Date.now(),
      source: this.sourceId,
    })
  }

  /**
   * 处理上线事件
   */
  private handleOnline(): void {
    console.log('[SyncManager] Online detected, processing offline queue')
    this.isOnline = true

    // 处理离线队列
    this.processOfflineQueue()
  }

  /**
   * 处理离线事件
   */
  private handleOffline(): void {
    console.log('[SyncManager] Offline detected')
    this.isOnline = false
  }

  /**
   * 处理离线队列
   */
  private async processOfflineQueue(): Promise<void> {
    if (this.offlineQueue.length === 0) {
      return
    }

    console.log(`[SyncManager] Processing ${this.offlineQueue.length} queued messages`)

    const maxRetries = 3
    const queue = [...this.offlineQueue]
    this.offlineQueue = []

    for (const item of queue) {
      try {
        this.sendMessage(item.message)
        this.syncStats.queued--
      }
      catch (error) {
        console.error('Failed to send queued message:', error)

        // 重试机制
        if (item.retries < maxRetries) {
          item.retries++
          this.offlineQueue.push(item)
        }
        else {
          console.warn('Message dropped after max retries:', item.message)
          this.syncStats.queued--
        }
      }
    }
  }

  /**
   * 获取同步状态
   */
  getSyncStatus(): {
    isOnline: boolean
    stats: typeof this.syncStats
    queueSize: number
    vectorClock: Record<string, number>
  } {
    return {
      isOnline: this.isOnline,
      stats: { ...this.syncStats },
      queueSize: this.offlineQueue.length,
      vectorClock: { ...this.vectorClock },
    }
  }

  /**
   * 清空离线队列
   */
  clearOfflineQueue(): void {
    this.syncStats.queued -= this.offlineQueue.length
    this.offlineQueue = []
  }

  /**
   * 监听同步事件
   */
  on(event: 'sync' | 'conflict', listener: (message: SyncMessage) => void): void {
    this.emitter.on(event, listener)
  }

  /**
   * 移除监听器
   */
  off(event: 'sync' | 'conflict', listener: (message: SyncMessage) => void): void {
    this.emitter.off(event, listener)
  }

  /**
   * 销毁同步管理器
   */
  destroy(): void {
    if (this.channel) {
      this.channel.close()
      this.channel = undefined
    }

    if (this.storageHandler && typeof window !== 'undefined') {
      window.removeEventListener('storage', this.storageHandler)
      window.removeEventListener('online', () => this.handleOnline())
      window.removeEventListener('offline', () => this.handleOffline())
      this.storageHandler = undefined
    }

    if (this.syncTimer) {
      clearTimeout(this.syncTimer)
      this.syncTimer = undefined
    }

    if (this.batchTimer) {
      clearTimeout(this.batchTimer)
      this.batchTimer = undefined
    }

    this.emitter.removeAllListeners()
    this.localData.clear()
    this.offlineQueue = []
    this.batchQueue = []
  }
}

/**
 * 缓存预热管理器
 * 
 * 支持缓存数据的导入导出和预热
 */
