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

function isSerializableValue(value) {
  if (value === null || value === void 0) {
    return true;
  }
  const type = typeof value;
  if (type === "string" || type === "number" || type === "boolean") {
    return true;
  }
  if (Array.isArray(value)) {
    return value.every(isSerializableValue);
  }
  if (type === "object" && value.constructor === Object) {
    return Object.values(value).every(isSerializableValue);
  }
  return false;
}
function isValidStorageEngine(engine) {
  return ["localStorage", "sessionStorage", "cookie", "indexedDB", "memory"].includes(engine);
}
function isValidDataType(type) {
  return ["string", "number", "boolean", "object", "array", "binary"].includes(type);
}
function isValidCacheEventType(type) {
  return ["set", "get", "remove", "clear", "expired", "error", "strategy"].includes(type);
}

exports.isSerializableValue = isSerializableValue;
exports.isValidCacheEventType = isValidCacheEventType;
exports.isValidDataType = isValidDataType;
exports.isValidStorageEngine = isValidStorageEngine;
/*! End of @ldesign/cache | Powered by @ldesign/builder */
//# sourceMappingURL=index.cjs.map
