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

class ValidationError extends Error {
  constructor(message, field) {
    super(message);
    Object.defineProperty(this, "field", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: field
    });
    this.name = "ValidationError";
  }
}
class Validator {
  /**
   * 验证缓存键
   *
   * @param key - 缓存键
   * @throws {ValidationError} 当键无效时抛出错误
   *
   * @example
   * ```typescript
   * Validator.validateKey('user:123') // 通过
   * Validator.validateKey('') // 抛出错误
   * ```
   */
  static validateKey(key) {
    if (typeof key !== "string") {
      throw new ValidationError("Cache key must be a string", "key");
    }
    if (key.trim() === "") {
      throw new ValidationError("Cache key cannot be empty", "key");
    }
    if (key.length > 250) {
      throw new ValidationError("Cache key is too long (maximum 250 characters)", "key");
    }
    if (/\p{Cc}/u.test(key)) {
      throw new ValidationError("Cache key contains invalid control characters", "key");
    }
  }
  /**
   * 验证缓存值
   *
   * @param value - 缓存值
   * @throws {ValidationError} 当值无效时抛出错误
   */
  static validateValue(value) {
    if (value === void 0) {
      throw new ValidationError("Cache value cannot be undefined", "value");
    }
    try {
      JSON.stringify(value);
    } catch (error) {
      if (error instanceof Error && error.message.includes("circular")) {
        console.warn("Cache value contains circular references, will be simplified during serialization");
      } else {
        throw new ValidationError("Cache value is not serializable", "value");
      }
    }
  }
  /**
   * 验证TTL值
   *
   * @param ttl - 生存时间
   * @throws {ValidationError} 当TTL无效时抛出错误
   */
  static validateTTL(ttl) {
    if (ttl !== void 0) {
      if (typeof ttl !== "number") {
        throw new ValidationError("TTL must be a number", "ttl");
      }
      if (!Number.isFinite(ttl)) {
        throw new ValidationError("TTL must be a finite number", "ttl");
      }
      if (ttl < 0) {
        throw new ValidationError("TTL must be non-negative", "ttl");
      }
      if (ttl > 0 && ttl < 1e3) {
        console.warn("TTL is less than 1 second, this may cause frequent cache misses");
      }
      const oneYear = 365 * 24 * 60 * 60 * 1e3;
      if (ttl > oneYear) {
        console.warn("TTL is greater than 1 year, consider using persistent storage");
      }
    }
  }
  /**
   * 验证存储引擎
   *
   * @param engine - 存储引擎名称
   * @throws {ValidationError} 当引擎无效时抛出错误
   */
  static validateEngine(engine) {
    if (engine !== void 0) {
      const validEngines = ["localStorage", "sessionStorage", "cookie", "indexedDB", "memory"];
      if (typeof engine !== "string" || !validEngines.includes(engine)) {
        throw new ValidationError(`Invalid storage engine. Must be one of: ${validEngines.join(", ")}`, "engine");
      }
    }
  }
  /**
   * 验证设置选项
   *
   * @param options - 设置选项
   * @throws {ValidationError} 当选项无效时抛出错误
   */
  static validateSetOptions(options) {
    if (options !== void 0) {
      if (typeof options !== "object" || options === null) {
        throw new ValidationError("Options must be an object", "options");
      }
      const opts = options;
      if ("ttl" in opts) {
        this.validateTTL(opts.ttl);
      }
      if ("engine" in opts) {
        this.validateEngine(opts.engine);
      }
      if ("encrypt" in opts && typeof opts.encrypt !== "boolean") {
        throw new ValidationError("Encrypt option must be a boolean", "options.encrypt");
      }
      if ("obfuscateKey" in opts && typeof opts.obfuscateKey !== "boolean") {
        throw new ValidationError("ObfuscateKey option must be a boolean", "options.obfuscateKey");
      }
    }
  }
  /**
   * 验证缓存设置的完整输入
   *
   * @param key - 缓存键
   * @param value - 缓存值
   * @param options - 设置选项
   * @throws {ValidationError} 当任何参数无效时抛出错误
   *
   * @example
   * ```typescript
   * try {
   *   Validator.validateSetInput('user:123', userData, { ttl: 3600000 })
   *   // 验证通过，可以安全地设置缓存
   * } catch (error) {
   *   if (error instanceof ValidationError) {
   *     console.error(`Validation failed for ${error.field}: ${error.message}`)
   *   }
   * }
   * ```
   */
  static validateSetInput(key, value, options) {
    this.validateKey(key);
    this.validateValue(value);
    this.validateSetOptions(options);
  }
  /**
   * 创建自定义验证规则
   *
   * @param rules - 验证规则数组
   * @returns 验证函数
   */
  static createValidator(rules) {
    return (value, fieldName) => {
      for (const rule of rules) {
        if (!rule.validate(value)) {
          throw new ValidationError(rule.message, fieldName);
        }
      }
    };
  }
  /**
   * 批量验证
   *
   * @param validations - 验证配置数组
   * @throws {ValidationError} 当任何验证失败时抛出错误
   */
  static validateBatch(validations) {
    for (const {
      value,
      rules,
      fieldName
    } of validations) {
      const validator = this.createValidator(rules);
      validator(value, fieldName);
    }
  }
}
Object.defineProperty(Validator, "rules", {
  enumerable: true,
  configurable: true,
  writable: true,
  value: {
    /** 非空字符串 */
    nonEmptyString: {
      validate: (value) => typeof value === "string" && value.trim().length > 0,
      message: "Value must be a non-empty string"
    },
    /** 正整数 */
    positiveInteger: {
      validate: (value) => typeof value === "number" && Number.isInteger(value) && value > 0,
      message: "Value must be a positive integer"
    },
    /** 非负数 */
    nonNegativeNumber: {
      validate: (value) => typeof value === "number" && Number.isFinite(value) && value >= 0,
      message: "Value must be a non-negative number"
    },
    /** 布尔值 */
    boolean: {
      validate: (value) => typeof value === "boolean",
      message: "Value must be a boolean"
    },
    /** 对象 */
    object: {
      validate: (value) => typeof value === "object" && value !== null,
      message: "Value must be an object"
    },
    /** 数组 */
    array: {
      validate: (value) => Array.isArray(value),
      message: "Value must be an array"
    }
  }
});
const validateKey = Validator.validateKey;
const validateValue = Validator.validateValue;
const validateTTL = Validator.validateTTL;
const validateEngine = Validator.validateEngine;
const validateSetOptions = Validator.validateSetOptions;
const validateSetInput = Validator.validateSetInput;

exports.ValidationError = ValidationError;
exports.Validator = Validator;
exports.validateEngine = validateEngine;
exports.validateKey = validateKey;
exports.validateSetInput = validateSetInput;
exports.validateSetOptions = validateSetOptions;
exports.validateTTL = validateTTL;
exports.validateValue = validateValue;
/*! End of @ldesign/cache | Powered by @ldesign/builder */
//# sourceMappingURL=validator.cjs.map
