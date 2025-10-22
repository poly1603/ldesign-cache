/**
 * 增量同步工具
 * 
 * 实现对象的增量（Delta）比较和合并，减少同步数据量
 */

/**
 * Delta 操作类型
 */
export type DeltaOperation = 'add' | 'update' | 'delete'

/**
 * Delta 变更
 */
export interface DeltaChange {
  /** 操作类型 */
  op: DeltaOperation
  /** 路径（使用点号分隔，如 'user.name'） */
  path: string
  /** 旧值 */
  oldValue?: any
  /** 新值 */
  newValue?: any
}

/**
 * Delta 结果
 */
export interface Delta {
  /** 变更列表 */
  changes: DeltaChange[]
  /** 是否有变更 */
  hasChanges: boolean
  /** 变更数量 */
  changeCount: number
}

/**
 * Delta 同步工具类
 */
export class DeltaSync {
  /**
   * 比较两个对象，生成增量变更
   * 
   * @param oldObj - 旧对象
   * @param newObj - 新对象
   * @param basePath - 基础路径（用于递归）
   * @returns Delta 变更
   */
  static diff(oldObj: any, newObj: any, basePath = ''): Delta {
    const changes: DeltaChange[] = []

    // 处理 null/undefined
    if (oldObj === newObj) {
      return { changes: [], hasChanges: false, changeCount: 0 }
    }

    if (oldObj === null || oldObj === undefined) {
      changes.push({
        op: 'add',
        path: basePath || '/',
        newValue: newObj,
      })
      return { changes, hasChanges: true, changeCount: changes.length }
    }

    if (newObj === null || newObj === undefined) {
      changes.push({
        op: 'delete',
        path: basePath || '/',
        oldValue: oldObj,
      })
      return { changes, hasChanges: true, changeCount: changes.length }
    }

    // 处理基本类型
    const oldType = typeof oldObj
    const newType = typeof newObj

    if (oldType !== 'object' || newType !== 'object') {
      if (oldObj !== newObj) {
        changes.push({
          op: 'update',
          path: basePath || '/',
          oldValue: oldObj,
          newValue: newObj,
        })
      }
      return { changes, hasChanges: changes.length > 0, changeCount: changes.length }
    }

    // 处理数组
    if (Array.isArray(oldObj) || Array.isArray(newObj)) {
      if (JSON.stringify(oldObj) !== JSON.stringify(newObj)) {
        changes.push({
          op: 'update',
          path: basePath || '/',
          oldValue: oldObj,
          newValue: newObj,
        })
      }
      return { changes, hasChanges: changes.length > 0, changeCount: changes.length }
    }

    // 处理对象
    const allKeys = new Set([
      ...Object.keys(oldObj),
      ...Object.keys(newObj),
    ])

    for (const key of allKeys) {
      const path = basePath ? `${basePath}.${key}` : key
      const oldValue = oldObj[key]
      const newValue = newObj[key]

      if (!(key in oldObj)) {
        // 新增字段
        changes.push({
          op: 'add',
          path,
          newValue,
        })
      }
      else if (!(key in newObj)) {
        // 删除字段
        changes.push({
          op: 'delete',
          path,
          oldValue,
        })
      }
      else if (typeof oldValue === 'object' && oldValue !== null && typeof newValue === 'object' && newValue !== null) {
        // 递归比较嵌套对象
        const nestedDelta = this.diff(oldValue, newValue, path)
        changes.push(...nestedDelta.changes)
      }
      else if (oldValue !== newValue) {
        // 值变更
        changes.push({
          op: 'update',
          path,
          oldValue,
          newValue,
        })
      }
    }

    return {
      changes,
      hasChanges: changes.length > 0,
      changeCount: changes.length,
    }
  }

  /**
   * 应用 Delta 变更到对象
   * 
   * @param obj - 基础对象
   * @param changes - Delta 变更列表
   * @returns 应用变更后的新对象
   */
  static patch(obj: any, changes: DeltaChange[]): any {
    if (!obj || typeof obj !== 'object') {
      obj = {}
    }

    // 深度克隆避免修改原对象
    const result = JSON.parse(JSON.stringify(obj))

    for (const change of changes) {
      const pathParts = change.path.split('.')
      let current = result

      // 导航到目标位置
      for (let i = 0; i < pathParts.length - 1; i++) {
        const part = pathParts[i]
        if (!(part in current)) {
          current[part] = {}
        }
        current = current[part]
      }

      const finalKey = pathParts[pathParts.length - 1]

      switch (change.op) {
        case 'add':
        case 'update':
          current[finalKey] = change.newValue
          break

        case 'delete':
          delete current[finalKey]
          break
      }
    }

    return result
  }

  /**
   * 计算 Delta 大小（字节）
   * 
   * @param changes - Delta 变更列表
   * @returns 字节大小
   */
  static calculateDeltaSize(changes: DeltaChange[]): number {
    return new Blob([JSON.stringify(changes)]).size
  }

  /**
   * 计算完整对象大小（字节）
   * 
   * @param obj - 对象
   * @returns 字节大小
   */
  static calculateObjectSize(obj: any): number {
    return new Blob([JSON.stringify(obj)]).size
  }

  /**
   * 检查是否值得使用 Delta 同步
   * 
   * @param oldObj - 旧对象
   * @param newObj - 新对象
   * @returns 是否值得（Delta 更小）
   */
  static shouldUseDelta(oldObj: any, newObj: any): boolean {
    const delta = this.diff(oldObj, newObj)

    if (!delta.hasChanges) {
      return false // 没有变更，不需要同步
    }

    const deltaSize = this.calculateDeltaSize(delta.changes)
    const fullSize = this.calculateObjectSize(newObj)

    // 如果 Delta 小于完整对象的 30%，值得使用
    return deltaSize < fullSize * 0.3
  }

  /**
   * 优化 Delta（移除冗余变更）
   * 
   * @param changes - 原始变更
   * @returns 优化后的变更
   */
  static optimize(changes: DeltaChange[]): DeltaChange[] {
    // 移除相同路径的重复变更（保留最后一个）
    const pathMap = new Map<string, DeltaChange>()

    for (const change of changes) {
      pathMap.set(change.path, change)
    }

    return Array.from(pathMap.values())
  }

  /**
   * 合并多个 Delta
   * 
   * @param deltas - Delta 列表
   * @returns 合并后的 Delta
   */
  static merge(deltas: Delta[]): Delta {
    const allChanges: DeltaChange[] = []

    for (const delta of deltas) {
      allChanges.push(...delta.changes)
    }

    const optimized = this.optimize(allChanges)

    return {
      changes: optimized,
      hasChanges: optimized.length > 0,
      changeCount: optimized.length,
    }
  }

  /**
   * 压缩 Delta（使用简短的键名）
   * 
   * @param changes - 变更列表
   * @returns 压缩后的数据
   */
  static compress(changes: DeltaChange[]): any {
    return changes.map(c => ({
      o: c.op === 'add' ? 'a' : c.op === 'update' ? 'u' : 'd',
      p: c.path,
      ov: c.oldValue,
      nv: c.newValue,
    }))
  }

  /**
   * 解压 Delta
   * 
   * @param compressed - 压缩的数据
   * @returns 变更列表
   */
  static decompress(compressed: any[]): DeltaChange[] {
    return compressed.map(c => ({
      op: c.o === 'a' ? 'add' : c.o === 'u' ? 'update' : 'delete',
      path: c.p,
      oldValue: c.ov,
      newValue: c.nv,
    }))
  }
}

/**
 * 创建增量同步装饰器
 * 
 * @param cache - 缓存管理器
 * @returns 增强的缓存管理器
 */
export function withDeltaSync<T extends { set: any, get: any }>(cache: T): T & {
  deltaSet: (key: string, value: any, options?: any) => Promise<void>
  deltaGet: (key: string) => Promise<any>
} {
  // 存储上次的值
  const lastValues = new Map<string, any>()

  return {
    ...cache,

    /**
     * 使用 Delta 同步设置值
     */
    async deltaSet(key: string, value: any, options?: any) {
      const oldValue = lastValues.get(key)

      if (!oldValue) {
        // 首次设置，使用完整对象
        await cache.set(key, value, options)
        lastValues.set(key, value)
        return
      }

      // 检查是否值得使用 Delta
      if (DeltaSync.shouldUseDelta(oldValue, value)) {
        const delta = DeltaSync.diff(oldValue, value)

        // 存储 Delta
        await cache.set(`${key}:delta`, {
          base: oldValue,
          changes: delta.changes,
          timestamp: Date.now(),
        }, options)

        console.log(`✅ Delta sync: ${delta.changeCount} changes (saved ${DeltaSync.calculateObjectSize(value) - DeltaSync.calculateDeltaSize(delta.changes)
          } bytes)`)
      }
      else {
        // Delta 不划算，使用完整对象
        await cache.set(key, value, options)
      }

      lastValues.set(key, value)
    },

    /**
     * 获取值（支持 Delta 恢复）
     */
    async deltaGet(key: string) {
      // 先尝试获取完整对象
      const full = await cache.get(key)
      if (full !== null) {
        lastValues.set(key, full)
        return full
      }

      // 尝试获取 Delta
      const deltaData = await cache.get(`${key}:delta`)
      if (deltaData && deltaData.base && deltaData.changes) {
        const restored = DeltaSync.patch(deltaData.base, deltaData.changes)
        lastValues.set(key, restored)
        return restored
      }

      return null
    },
  }
}

