/**
 * 防抖节流工具函数
 * @module @ldesign/cache/core/utils/debounce
 */

/**
 * 防抖函数返回类型
 */
export interface DebouncedFunction<T extends (...args: any[]) => any> {
  /** 调用防抖函数 */
  (...args: Parameters<T>): void
  /** 取消待执行的调用 */
  cancel(): void
  /** 立即执行待执行的调用 */
  flush(): void
  /** 检查是否有待执行的调用 */
  pending(): boolean
}

/**
 * 防抖选项
 */
export interface DebounceOptions {
  /** 等待时间（毫秒） */
  wait: number
  /** 是否在延迟开始前调用 */
  leading?: boolean
  /** 是否在延迟结束后调用 */
  trailing?: boolean
  /** 最大等待时间（毫秒） */
  maxWait?: number
}

/**
 * 创建防抖函数
 * 
 * 在连续调用时，只有最后一次调用会在指定延迟后执行
 * 
 * @param func - 要防抖的函数
 * @param options - 防抖选项
 * @returns 防抖后的函数
 * 
 * @example
 * ```typescript
 * const debouncedSave = debounce(
 *   (data) => cache.set('draft', data),
 *   { wait: 500 }
 * )
 * 
 * // 连续调用只会保存最后一次
 * debouncedSave({ text: 'hello' })
 * debouncedSave({ text: 'hello world' })
 * debouncedSave({ text: 'hello world!' })
 * // 500ms 后只执行一次，保存 { text: 'hello world!' }
 * ```
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  options: DebounceOptions,
): DebouncedFunction<T> {
  const { wait, leading = false, trailing = true, maxWait } = options

  let timerId: ReturnType<typeof setTimeout> | undefined
  let lastArgs: Parameters<T> | undefined
  let lastThis: any
  let lastCallTime: number | undefined
  let lastInvokeTime = 0
  let result: ReturnType<T> | undefined

  const useMaxWait = maxWait !== undefined
  const maxing = useMaxWait ? Math.max(maxWait, wait) : 0

  /**
   * 调用原函数
   */
  function invokeFunc(time: number): ReturnType<T> | undefined {
    const args = lastArgs!
    const thisArg = lastThis

    lastArgs = undefined
    lastThis = undefined
    lastInvokeTime = time
    result = func.apply(thisArg, args)
    return result
  }

  /**
   * 计算剩余等待时间
   */
  function remainingWait(time: number): number {
    const timeSinceLastCall = time - (lastCallTime ?? 0)
    const timeSinceLastInvoke = time - lastInvokeTime
    const timeWaiting = wait - timeSinceLastCall

    return useMaxWait
      ? Math.min(timeWaiting, maxing - timeSinceLastInvoke)
      : timeWaiting
  }

  /**
   * 检查是否应该调用
   */
  function shouldInvoke(time: number): boolean {
    const timeSinceLastCall = time - (lastCallTime ?? 0)
    const timeSinceLastInvoke = time - lastInvokeTime

    return (
      lastCallTime === undefined
      || timeSinceLastCall >= wait
      || timeSinceLastCall < 0
      || (useMaxWait && timeSinceLastInvoke >= maxing)
    )
  }

  /**
   * 定时器到期时的处理
   */
  function timerExpired(): void {
    const time = Date.now()

    if (shouldInvoke(time)) {
      return trailingEdge(time)
    }

    // 重新设置定时器
    timerId = setTimeout(timerExpired, remainingWait(time))
  }

  /**
   * 前沿调用
   */
  function leadingEdge(time: number): ReturnType<T> | undefined {
    lastInvokeTime = time
    timerId = setTimeout(timerExpired, wait)

    return leading ? invokeFunc(time) : result
  }

  /**
   * 后沿调用
   */
  function trailingEdge(time: number): ReturnType<T> | undefined {
    timerId = undefined

    if (trailing && lastArgs) {
      return invokeFunc(time)
    }

    lastArgs = undefined
    lastThis = undefined
    return result
  }

  /**
   * 取消待执行的调用
   */
  function cancel(): void {
    if (timerId !== undefined) {
      clearTimeout(timerId)
    }
    lastInvokeTime = 0
    lastArgs = undefined
    lastCallTime = undefined
    lastThis = undefined
    timerId = undefined
  }

  /**
   * 立即执行待执行的调用
   */
  function flush(): ReturnType<T> | undefined {
    if (timerId === undefined) {
      return result
    }
    return trailingEdge(Date.now())
  }

  /**
   * 检查是否有待执行的调用
   */
  function pending(): boolean {
    return timerId !== undefined
  }

  /**
   * 防抖函数主体
   */
  function debounced(this: any, ...args: Parameters<T>): void {
    const time = Date.now()
    const isInvoking = shouldInvoke(time)

    lastArgs = args
    lastThis = this
    lastCallTime = time

    if (isInvoking) {
      if (timerId === undefined) {
        leadingEdge(lastCallTime)
        return
      }
      if (useMaxWait) {
        // 处理最大等待时间
        timerId = setTimeout(timerExpired, wait)
        invokeFunc(lastCallTime)
        return
      }
    }

    if (timerId === undefined) {
      timerId = setTimeout(timerExpired, wait)
    }
  }

  debounced.cancel = cancel
  debounced.flush = flush
  debounced.pending = pending

  return debounced as DebouncedFunction<T>
}

/**
 * 节流函数返回类型
 */
export interface ThrottledFunction<T extends (...args: any[]) => any> {
  /** 调用节流函数 */
  (...args: Parameters<T>): ReturnType<T> | undefined
  /** 取消待执行的调用 */
  cancel(): void
  /** 立即执行待执行的调用 */
  flush(): ReturnType<T> | undefined
}

/**
 * 节流选项
 */
export interface ThrottleOptions {
  /** 等待时间（毫秒） */
  wait: number
  /** 是否在节流开始时调用 */
  leading?: boolean
  /** 是否在节流结束后调用 */
  trailing?: boolean
}

/**
 * 创建节流函数
 * 
 * 在指定时间内最多只执行一次
 * 
 * @param func - 要节流的函数
 * @param options - 节流选项
 * @returns 节流后的函数
 * 
 * @example
 * ```typescript
 * const throttledUpdate = throttle(
 *   (data) => cache.set('stats', data),
 *   { wait: 1000 }
 * )
 * 
 * // 每秒最多执行一次
 * setInterval(() => {
 *   throttledUpdate({ count: Math.random() })
 * }, 100)
 * ```
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  options: ThrottleOptions,
): ThrottledFunction<T> {
  const { wait, leading = true, trailing = true } = options

  return debounce(func, {
    wait,
    leading,
    trailing,
    maxWait: wait,
  }) as ThrottledFunction<T>
}

/**
 * 创建带缓存的防抖函数
 * 
 * 适用于缓存操作，支持按键防抖
 * 
 * @param func - 要防抖的函数，第一个参数为键
 * @param wait - 等待时间（毫秒）
 * @returns 按键防抖的函数
 * 
 * @example
 * ```typescript
 * const debouncedSet = createKeyedDebounce(
 *   (key, value) => cache.set(key, value),
 *   500
 * )
 * 
 * // 相同键的调用会被防抖
 * debouncedSet('user', { name: 'Alice' })
 * debouncedSet('user', { name: 'Bob' })
 * // 500ms 后只执行一次，设置 { name: 'Bob' }
 * 
 * // 不同键的调用独立
 * debouncedSet('settings', { theme: 'dark' })
 * // 两个键各自独立防抖
 * ```
 */
export function createKeyedDebounce<T extends (key: string, ...args: any[]) => any>(
  func: T,
  wait: number,
): {
  (key: string, ...args: Parameters<T> extends [string, ...infer R] ? R : never): void
  cancel(key?: string): void
  flush(key?: string): void
  pending(key?: string): boolean
} {
  const debouncers = new Map<string, DebouncedFunction<T>>()

  function getDebouncer(key: string): DebouncedFunction<T> {
    let debouncer = debouncers.get(key)
    if (!debouncer) {
      debouncer = debounce(func, { wait })
      debouncers.set(key, debouncer)
    }
    return debouncer
  }

  function debouncedFunc(key: string, ...args: any[]): void {
    const debouncer = getDebouncer(key)
    ;(debouncer as any)(key, ...args)
  }

  debouncedFunc.cancel = (key?: string): void => {
    if (key) {
      debouncers.get(key)?.cancel()
      debouncers.delete(key)
    }
    else {
      for (const debouncer of debouncers.values()) {
        debouncer.cancel()
      }
      debouncers.clear()
    }
  }

  debouncedFunc.flush = (key?: string): void => {
    if (key) {
      debouncers.get(key)?.flush()
    }
    else {
      for (const debouncer of debouncers.values()) {
        debouncer.flush()
      }
    }
  }

  debouncedFunc.pending = (key?: string): boolean => {
    if (key) {
      return debouncers.get(key)?.pending() ?? false
    }
    for (const debouncer of debouncers.values()) {
      if (debouncer.pending()) {
        return true
      }
    }
    return false
  }

  return debouncedFunc as any
}

/**
 * 创建带缓存的节流函数
 * 
 * 适用于缓存操作，支持按键节流
 * 
 * @param func - 要节流的函数，第一个参数为键
 * @param wait - 等待时间（毫秒）
 * @returns 按键节流的函数
 */
export function createKeyedThrottle<T extends (key: string, ...args: any[]) => any>(
  func: T,
  wait: number,
): {
  (key: string, ...args: Parameters<T> extends [string, ...infer R] ? R : never): void
  cancel(key?: string): void
  flush(key?: string): void
} {
  const throttlers = new Map<string, ThrottledFunction<T>>()

  function getThrottler(key: string): ThrottledFunction<T> {
    let throttler = throttlers.get(key)
    if (!throttler) {
      throttler = throttle(func, { wait })
      throttlers.set(key, throttler)
    }
    return throttler
  }

  function throttledFunc(key: string, ...args: any[]): void {
    const throttler = getThrottler(key)
    ;(throttler as any)(key, ...args)
  }

  throttledFunc.cancel = (key?: string): void => {
    if (key) {
      throttlers.get(key)?.cancel()
      throttlers.delete(key)
    }
    else {
      for (const throttler of throttlers.values()) {
        throttler.cancel()
      }
      throttlers.clear()
    }
  }

  throttledFunc.flush = (key?: string): void => {
    if (key) {
      throttlers.get(key)?.flush()
    }
    else {
      for (const throttler of throttlers.values()) {
        throttler.flush()
      }
    }
  }

  return throttledFunc as any
}
