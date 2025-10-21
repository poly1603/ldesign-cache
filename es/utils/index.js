/*!
 * ***********************************
 * @ldesign/cache v0.1.1           *
 * Built with rollup               *
 * Build time: 2024-10-21 14:32:03 *
 * Build mode: production          *
 * Minified: No                    *
 * ***********************************
 */
export { BatchHelper, batchGet, batchHas, batchRemove, batchSet, createBatchHelper } from './batch-helpers.js';
export { Compressor, withCompression } from './compressor.js';
export { ErrorHandler, handleErrors, isErrorType, normalizeError, safeAsync, safeSync } from './error-handler.js';
export { EventEmitter } from './event-emitter.js';
export { ThrottledEventEmitter, createThrottledEmitter, debounce, throttle } from './event-throttle.js';
export { MinHeap, createMinHeap, createMinHeapFromArray } from './min-heap.js';
export { ObjectPool, cacheItemPool, metadataPool } from './object-pool.js';
export { PerformanceProfiler, createProfiler, disableProfiling, enableProfiling, generateGlobalReport, globalProfiler } from './performance-profiler.js';
export { Prefetcher, withPrefetching } from './prefetcher.js';
export { CircuitBreaker, FallbackHandler, RetryManager, withCircuitBreaker, withFallback, withRetry } from './retry-manager.js';
export { SerializationCache, createSerializationCache, deserializeWithCache, globalDeserializeCache, globalSerializeCache, serializeWithCache } from './serialization-cache.js';
export { ValidationError, Validator, validateEngine, validateKey, validateSetInput, validateSetOptions, validateTTL, validateValue } from './validator.js';

function isBrowser() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}
function isNode() {
  return typeof globalThis !== "undefined" && typeof globalThis.process !== "undefined" && typeof globalThis.process?.versions === "object" && Boolean(globalThis.process?.versions?.node);
}
function isWebWorker() {
  return typeof globalThis !== "undefined" && typeof globalThis.importScripts === "function" && typeof navigator !== "undefined";
}
function isSSR() {
  return !isBrowser() && !isNode() && !isWebWorker();
}
function isValidInput(input) {
  return input != null;
}
function isEmpty(value) {
  return value == null || value === "";
}
function isNonEmptyString(value) {
  return typeof value === "string" && value.length > 0;
}
function safeJsonParse(json, defaultValue) {
  if (!isNonEmptyString(json)) {
    return defaultValue;
  }
  try {
    return JSON.parse(json);
  } catch {
    return defaultValue;
  }
}
function safeJsonStringify(value, space) {
  try {
    return JSON.stringify(value, null, space);
  } catch (error) {
    console.warn("[Utils] JSON stringify failed:", error);
    return String(value);
  }
}
function deepClone(obj) {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }
  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }
  if (obj instanceof RegExp) {
    return new RegExp(obj.source, obj.flags);
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => deepClone(item));
  }
  if (obj.constructor === Object) {
    const cloned = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        cloned[key] = deepClone(obj[key]);
      }
    }
    return cloned;
  }
  return obj;
}
function deepMerge(target, ...sources) {
  if (!sources.length) {
    return target;
  }
  const source = sources.shift();
  if (!source) {
    return target;
  }
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sourceValue = source[key];
      const targetValue = target[key];
      if (sourceValue && typeof sourceValue === "object" && !Array.isArray(sourceValue) && targetValue && typeof targetValue === "object" && !Array.isArray(targetValue)) {
        target[key] = deepMerge(targetValue, sourceValue);
      } else {
        target[key] = sourceValue;
      }
    }
  }
  return deepMerge(target, ...sources);
}
function once(func) {
  let called = false;
  let result;
  return (...args) => {
    if (!called) {
      called = true;
      result = func(...args);
      return result;
    }
    return result;
  };
}
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) {
    return "0 Bytes";
  }
  if (bytes < 0) {
    return `-${formatBytes(-bytes, decimals)}`;
  }
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = bytes / k ** i;
  return `${Number.parseFloat(size.toFixed(dm))} ${sizes[i]}`;
}
function formatNumber(num) {
  return num.toLocaleString();
}
function formatPercentage(value, decimals = 1) {
  return `${(value * 100).toFixed(decimals)}%`;
}
function generateId(prefix) {
  const id = Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
  return prefix ? `${prefix}_${id}` : id;
}
function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === "x" ? r : r & 3 | 8;
    return v.toString(16);
  });
}
async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
async function withTimeout(promise, timeoutMs, timeoutMessage = "Operation timed out") {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]);
}
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export { clamp, deepClone, deepMerge, delay, formatBytes, formatNumber, formatPercentage, generateId, generateUUID, isBrowser, isEmpty, isNode, isNonEmptyString, isSSR, isValidInput, isWebWorker, once, randomInt, safeJsonParse, safeJsonStringify, withTimeout };
/*! End of @ldesign/cache | Powered by @ldesign/builder */
//# sourceMappingURL=index.js.map
