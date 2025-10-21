// ============================================================================
// 类型守卫函数
// ============================================================================
/**
 * 检查值是否为可序列化的值
 */
export function isSerializableValue(value) {
    if (value === null || value === undefined) {
        return true;
    }
    const type = typeof value;
    if (type === 'string' || type === 'number' || type === 'boolean') {
        return true;
    }
    if (Array.isArray(value)) {
        return value.every(isSerializableValue);
    }
    if (type === 'object' && value.constructor === Object) {
        return Object.values(value).every(isSerializableValue);
    }
    return false;
}
/**
 * 检查是否为有效的存储引擎
 */
export function isValidStorageEngine(engine) {
    return ['localStorage', 'sessionStorage', 'cookie', 'indexedDB', 'memory'].includes(engine);
}
/**
 * 检查是否为有效的数据类型
 */
export function isValidDataType(type) {
    return ['string', 'number', 'boolean', 'object', 'array', 'binary'].includes(type);
}
/**
 * 检查是否为有效的缓存事件类型
 */
export function isValidCacheEventType(type) {
    return ['set', 'get', 'remove', 'clear', 'expired', 'error', 'strategy'].includes(type);
}
//# sourceMappingURL=index.js.map