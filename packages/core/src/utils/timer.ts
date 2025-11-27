/**
 * 定时器工具函数
 * @module @ldesign/cache/core/utils/timer
 */

/**
 * 定时器管理器
 */
export class TimerManager {
  private timers = new Map<string, ReturnType<typeof setTimeout>>()

  /**
   * 设置定时器
   * @param id - 定时器 ID
   * @param callback - 回调函数
   * @param delay - 延迟时间（毫秒）
   */
  set(id: string, callback: () => void, delay: number): void {
    this.clear(id)
    const timer = setTimeout(() => {
      callback()
      this.timers.delete(id)
    }, delay)
    
    // 在 Node.js 环境中，允许进程退出
    if (typeof timer.unref === 'function') {
      timer.unref()
    }
    
    this.timers.set(id, timer)
  }

  /**
   * 清除定时器
   * @param id - 定时器 ID
   */
  clear(id: string): void {
    const timer = this.timers.get(id)
    if (timer) {
      clearTimeout(timer)
      this.timers.delete(id)
    }
  }

  /**
   * 清除所有定时器
   */
  clearAll(): void {
    for (const timer of this.timers.values()) {
      clearTimeout(timer)
    }
    this.timers.clear()
  }

  /**
   * 获取定时器数量
   */
  get size(): number {
    return this.timers.size
  }
}

/**
 * 延迟执行
 * @param ms - 延迟时间（毫秒）
 * @returns Promise
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 测量函数执行时间
 * @param fn - 要测量的函数
 * @returns 执行时间（毫秒）和函数返回值
 */
export async function measureTime<T>(fn: () => T | Promise<T>): Promise<{ time: number, result: T }> {
  const start = performance.now()
  const result = await fn()
  const time = performance.now() - start
  return { time, result }
}

