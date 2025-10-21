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

async function batchGet(cache, keys, options = {}) {
  const {
    continueOnError = true,
    concurrency = 10
  } = options;
  const results = /* @__PURE__ */ new Map();
  for (let i = 0; i < keys.length; i += concurrency) {
    const batch = keys.slice(i, i + concurrency);
    const promises = batch.map(async (key) => {
      try {
        const value = await cache.get(key);
        return {
          key,
          value,
          error: null
        };
      } catch (error) {
        if (!continueOnError) {
          throw error;
        }
        return {
          key,
          value: null,
          error
        };
      }
    });
    const settled = await Promise.allSettled(promises);
    for (const result of settled) {
      if (result.status === "fulfilled") {
        results.set(result.value.key, result.value.value);
      } else if (continueOnError) {
        console.warn(`Failed to get key: ${result.reason}`);
      }
    }
  }
  return results;
}
async function batchSet(cache, items, options = {}) {
  const {
    concurrency = 10,
    collectErrors = false
  } = options;
  let success = 0;
  let failed = 0;
  const failedKeys = [];
  const errors = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const promises = batch.map(async ({
      key,
      value,
      options: itemOptions
    }) => {
      try {
        await cache.set(key, value, itemOptions);
        return {
          success: true,
          key
        };
      } catch (error) {
        return {
          success: false,
          key,
          error
        };
      }
    });
    const results = await Promise.allSettled(promises);
    for (const result of results) {
      if (result.status === "fulfilled") {
        if (result.value.success) {
          success++;
        } else {
          failed++;
          failedKeys.push(result.value.key);
          if (collectErrors && result.value.error) {
            errors.push({
              key: result.value.key,
              error: result.value.error
            });
          }
        }
      } else {
        failed++;
      }
    }
  }
  return {
    success,
    failed,
    failedKeys: failedKeys.length > 0 ? failedKeys : void 0,
    errors: errors.length > 0 ? errors : void 0
  };
}
async function batchRemove(cache, keys, options = {}) {
  const {
    concurrency = 10
  } = options;
  let success = 0;
  let failed = 0;
  const failedKeys = [];
  for (let i = 0; i < keys.length; i += concurrency) {
    const batch = keys.slice(i, i + concurrency);
    const promises = batch.map(async (key) => {
      try {
        await cache.remove(key);
        return {
          success: true,
          key
        };
      } catch {
        return {
          success: false,
          key
        };
      }
    });
    const results = await Promise.allSettled(promises);
    for (const result of results) {
      if (result.status === "fulfilled" && result.value.success) {
        success++;
      } else {
        failed++;
        if (result.status === "fulfilled") {
          failedKeys.push(result.value.key);
        }
      }
    }
  }
  return {
    success,
    failed,
    failedKeys: failedKeys.length > 0 ? failedKeys : void 0
  };
}
async function batchHas(cache, keys, options = {}) {
  const {
    concurrency = 10
  } = options;
  const results = /* @__PURE__ */ new Map();
  for (let i = 0; i < keys.length; i += concurrency) {
    const batch = keys.slice(i, i + concurrency);
    const promises = batch.map(async (key) => {
      try {
        const exists = await cache.has(key);
        return {
          key,
          exists
        };
      } catch {
        return {
          key,
          exists: false
        };
      }
    });
    const settled = await Promise.allSettled(promises);
    for (const result of settled) {
      if (result.status === "fulfilled") {
        results.set(result.value.key, result.value.exists);
      } else {
        results.set("", false);
      }
    }
  }
  return results;
}
class BatchHelper {
  constructor(cache) {
    Object.defineProperty(this, "cache", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: cache
    });
  }
  /**
   * 批量获取
   */
  async get(keys, options) {
    return batchGet(this.cache, keys, options);
  }
  /**
   * 批量设置
   */
  async set(items, options) {
    return batchSet(this.cache, items, options);
  }
  /**
   * 批量删除
   */
  async remove(keys, options) {
    return batchRemove(this.cache, keys, options);
  }
  /**
   * 批量检查
   */
  async has(keys, options) {
    return batchHas(this.cache, keys, options);
  }
}
function createBatchHelper(cache) {
  return new BatchHelper(cache);
}

exports.BatchHelper = BatchHelper;
exports.batchGet = batchGet;
exports.batchHas = batchHas;
exports.batchRemove = batchRemove;
exports.batchSet = batchSet;
exports.createBatchHelper = createBatchHelper;
/*! End of @ldesign/cache | Powered by @ldesign/builder */
//# sourceMappingURL=batch-helpers.cjs.map
