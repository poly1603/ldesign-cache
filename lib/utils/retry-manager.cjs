/*!
 * ***********************************
 * @ldesign/cache v0.1.1           *
 * Built with rollup               *
 * Build time: 2024-10-21 14:32:03 *
 * Build mode: production          *
 * Minified: No                    *
 * ***********************************
 */
'use strict';

class RetryManager {
  constructor() {
    Object.defineProperty(this, "defaultOptions", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: {
        maxAttempts: 3,
        initialDelay: 100,
        maxDelay: 1e4,
        factor: 2,
        strategy: "exponential",
        jitter: true,
        shouldRetry: () => true,
        onRetry: () => {
        },
        timeout: 3e4
      }
    });
  }
  /**
   * 执行带重试的操作
   */
  async retry(fn, options) {
    const opts = {
      ...this.defaultOptions,
      ...options
    };
    const startTime = Date.now();
    let lastError;
    for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
      try {
        const result = await this.withTimeout(fn(), opts.timeout);
        return {
          success: true,
          data: result,
          attempts: attempt,
          totalDuration: Date.now() - startTime
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (attempt === opts.maxAttempts || !opts.shouldRetry(lastError, attempt)) {
          break;
        }
        opts.onRetry(lastError, attempt);
        const delay = this.calculateDelay(attempt, opts);
        await this.sleep(delay);
      }
    }
    return {
      success: false,
      error: lastError,
      attempts: opts.maxAttempts,
      totalDuration: Date.now() - startTime
    };
  }
  /**
   * 计算重试延迟
   */
  calculateDelay(attempt, options) {
    let delay;
    switch (options.strategy) {
      case "exponential":
        delay = Math.min(options.initialDelay * options.factor ** (attempt - 1), options.maxDelay);
        break;
      case "linear":
        delay = Math.min(options.initialDelay * attempt, options.maxDelay);
        break;
      case "fibonacci":
        delay = Math.min(this.fibonacci(attempt) * options.initialDelay, options.maxDelay);
        break;
      case "fixed":
      default:
        delay = options.initialDelay;
        break;
    }
    if (options.jitter) {
      delay = delay * (0.5 + Math.random());
    }
    return delay;
  }
  /**
   * 斐波那契数列
   */
  fibonacci(n) {
    if (n <= 1) {
      return n;
    }
    let a = 0;
    let b = 1;
    for (let i = 2; i <= n; i++) {
      [a, b] = [b, a + b];
    }
    return b;
  }
  /**
   * 添加超时
   */
  async withTimeout(promise, timeout) {
    return Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error("Operation timeout")), timeout))]);
  }
  /**
   * 休眠
   */
  async sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
class CircuitBreaker {
  constructor(options = {}) {
    Object.defineProperty(this, "state", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "CLOSED"
    });
    Object.defineProperty(this, "failureCount", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: 0
    });
    Object.defineProperty(this, "successCount", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: 0
    });
    Object.defineProperty(this, "lastFailureTime", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "requests", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: []
    });
    Object.defineProperty(this, "options", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    this.options = {
      failureThreshold: 5,
      successThreshold: 3,
      timeout: 1e4,
      resetTimeout: 3e4,
      windowSize: 10,
      ...options
    };
  }
  /**
   * 执行操作
   */
  async execute(fn) {
    if (this.state === "OPEN") {
      if (this.shouldAttemptReset()) {
        this.state = "HALF_OPEN";
      } else {
        throw new Error("Circuit breaker is OPEN");
      }
    }
    try {
      const result = await this.withTimeout(fn());
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  /**
   * 成功处理
   */
  onSuccess() {
    this.recordRequest(true);
    if (this.state === "HALF_OPEN") {
      this.successCount++;
      if (this.successCount >= this.options.successThreshold) {
        this.reset();
      }
    }
  }
  /**
   * 失败处理
   */
  onFailure() {
    this.recordRequest(false);
    this.lastFailureTime = Date.now();
    if (this.state === "HALF_OPEN") {
      this.trip();
    } else if (this.state === "CLOSED") {
      this.failureCount++;
      if (this.getFailureRate() >= this.options.failureThreshold / this.options.windowSize) {
        this.trip();
      }
    }
  }
  /**
   * 记录请求
   */
  recordRequest(success) {
    this.requests.push(success);
    if (this.requests.length > this.options.windowSize) {
      this.requests.shift();
    }
  }
  /**
   * 获取失败率
   */
  getFailureRate() {
    if (this.requests.length === 0) {
      return 0;
    }
    const failures = this.requests.filter((r) => !r).length;
    return failures / this.requests.length;
  }
  /**
   * 是否应该尝试重置
   */
  shouldAttemptReset() {
    return this.lastFailureTime !== void 0 && Date.now() - this.lastFailureTime >= this.options.resetTimeout;
  }
  /**
   * 触发断路器
   */
  trip() {
    this.state = "OPEN";
    this.successCount = 0;
  }
  /**
   * 重置断路器
   */
  reset() {
    this.state = "CLOSED";
    this.failureCount = 0;
    this.successCount = 0;
    this.requests.length = 0;
  }
  /**
   * 添加超时
   */
  async withTimeout(promise) {
    return Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error("Operation timeout")), this.options.timeout))]);
  }
  /**
   * 获取状态
   */
  getState() {
    return this.state;
  }
  /**
   * 获取统计信息
   */
  getStats() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      failureRate: this.getFailureRate()
    };
  }
}
class FallbackHandler {
  constructor() {
    Object.defineProperty(this, "fallbacks", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: []
    });
  }
  /**
   * 添加降级方案
   */
  addFallback(fallback) {
    this.fallbacks.push(fallback);
    return this;
  }
  /**
   * 执行操作，失败时尝试降级
   */
  async execute(primary, options) {
    const errors = [];
    try {
      return await primary();
    } catch (error) {
      errors.push(error instanceof Error ? error : new Error(String(error)));
    }
    for (let i = 0; i < this.fallbacks.length; i++) {
      try {
        const result = await this.fallbacks[i]();
        options?.onFallback?.(i + 1, errors[errors.length - 1]);
        return result;
      } catch (error) {
        errors.push(error instanceof Error ? error : new Error(String(error)));
      }
    }
    throw new (globalThis.AggregateError || Error)(errors, "All fallback strategies failed");
  }
}
function withRetry(fn, options) {
  const retryManager = new RetryManager();
  return async (...args) => {
    const result = await retryManager.retry(async () => fn(...args), options);
    if (result.success) {
      return result.data;
    }
    throw result.error;
  };
}
function withCircuitBreaker(fn, options) {
  const circuitBreaker = new CircuitBreaker(options);
  return async (...args) => {
    return circuitBreaker.execute(async () => fn(...args));
  };
}
function withFallback(primary, ...fallbacks) {
  const handler = new FallbackHandler();
  fallbacks.forEach((fb) => handler.addFallback(fb));
  return async () => handler.execute(primary);
}

exports.CircuitBreaker = CircuitBreaker;
exports.FallbackHandler = FallbackHandler;
exports.RetryManager = RetryManager;
exports.withCircuitBreaker = withCircuitBreaker;
exports.withFallback = withFallback;
exports.withRetry = withRetry;
/*! End of @ldesign/cache | Powered by @ldesign/builder */
//# sourceMappingURL=retry-manager.cjs.map
