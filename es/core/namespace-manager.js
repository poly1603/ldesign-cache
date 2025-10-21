/*!
 * ***********************************
 * @ldesign/cache v0.1.1           *
 * Built with rollup               *
 * Build time: 2024-10-21 14:32:03 *
 * Build mode: production          *
 * Minified: No                    *
 * ***********************************
 */
import { CacheManager } from './cache-manager.js';

class CacheNamespace {
  constructor(options) {
    Object.defineProperty(this, "options", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: options
    });
    Object.defineProperty(this, "manager", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "children", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: /* @__PURE__ */ new Map()
    });
    Object.defineProperty(this, "prefix", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    this.prefix = options.parent ? `${options.parent.prefix}:${options.name}` : options.name;
    const managerOptions = {
      ...options,
      keyPrefix: this.prefix
    };
    if (options.parent && options.inheritConfig) {
      Object.assign(managerOptions, options.parent.options);
    }
    this.manager = new CacheManager(managerOptions);
  }
  /**
   * 获取完整前缀
   */
  getPrefix() {
    return this.prefix;
  }
  /**
   * 创建子命名空间
   *
   * @param name - 子命名空间名称
   * @param options - 配置选项
   * @returns 子命名空间实例
   *
   * @example
   * ```typescript
   * const userNs = rootNs.namespace('user')
   * const profileNs = userNs.namespace('profile')
   * // 键会自动加前缀: root:user:profile:key
   * ```
   */
  namespace(name, options) {
    if (this.children.has(name)) {
      return this.children.get(name);
    }
    const child = new CacheNamespace({
      ...options,
      name,
      parent: this,
      inheritConfig: options?.inheritConfig ?? true
    });
    this.children.set(name, child);
    return child;
  }
  /**
   * 设置缓存
   */
  async set(key, value, options) {
    return this.manager.set(key, value, options);
  }
  /**
   * 获取缓存
   */
  async get(key) {
    return this.manager.get(key);
  }
  /**
   * 删除缓存
   */
  async remove(key) {
    return this.manager.remove(key);
  }
  /**
   * 检查键是否存在
   */
  async has(key) {
    return this.manager.has(key);
  }
  /**
   * 获取元数据
   */
  async getMetadata(key) {
    return this.manager.getMetadata(key);
  }
  /**
   * 清空当前命名空间的所有缓存
   *
   * @param includeChildren - 是否包含子命名空间
   */
  async clear(includeChildren = false) {
    const keys = await this.manager.keys();
    await Promise.all(keys.map(async (key) => this.manager.remove(key)));
    if (includeChildren) {
      await Promise.all(Array.from(this.children.values()).map(async (child) => child.clear(true)));
    }
  }
  /**
   * 获取所有键
   *
   * @param includeChildren - 是否包含子命名空间的键
   */
  async keys(includeChildren = false) {
    const currentKeys = await this.manager.keys();
    if (!includeChildren) {
      return currentKeys;
    }
    const childKeysArrays = await Promise.all(Array.from(this.children.values()).map(async (child) => child.keys(true)));
    return currentKeys.concat(...childKeysArrays);
  }
  /**
   * 批量操作
   */
  async mset(items, options) {
    return this.manager.mset(items, options);
  }
  async mget(keys) {
    return this.manager.mget(keys);
  }
  async mremove(keys) {
    return this.manager.mremove(keys);
  }
  /**
   * 获取或设置
   */
  async remember(key, fetcher, options) {
    return this.manager.remember(key, fetcher, options);
  }
  /**
   * 获取统计信息
   *
   * @param includeChildren - 是否包含子命名空间的统计
   */
  async getStats(includeChildren = false) {
    const stats = await this.manager.getStats();
    const result = {
      namespace: this.prefix,
      stats
    };
    if (includeChildren && this.children.size > 0) {
      const childStats = {};
      for (const [name, child] of this.children) {
        childStats[name] = await child.getStats(true);
      }
      result.children = childStats;
    }
    return result;
  }
  /**
   * 销毁命名空间
   *
   * @param includeChildren - 是否销毁子命名空间
   */
  async destroy(includeChildren = true) {
    if (includeChildren) {
      await Promise.all(Array.from(this.children.values()).map(async (child) => child.destroy(true)));
      this.children.clear();
    }
    await this.manager.destroy();
  }
  /**
   * 获取子命名空间
   */
  getChild(name) {
    return this.children.get(name);
  }
  /**
   * 获取所有子命名空间
   */
  getChildren() {
    return new Map(this.children);
  }
  /**
   * 导出命名空间数据
   *
   * @param filter - 可选的过滤函数
   * @returns 导出的键值对数组
   */
  async export(filter) {
    const keys = await this.keys(false);
    const result = [];
    for (const key of keys) {
      if (filter && !filter(key)) {
        continue;
      }
      const value = await this.get(key);
      if (value !== null) {
        result.push({
          key,
          value
        });
      }
    }
    return result;
  }
  /**
   * 导出完整的命名空间数据（包含子命名空间）
   */
  async exportFull(includeChildren = true) {
    const keys = await this.keys(false);
    const data = {};
    for (const key of keys) {
      data[key] = await this.get(key);
    }
    const result = {
      namespace: this.prefix,
      data
    };
    if (includeChildren && this.children.size > 0) {
      const childData = {};
      for (const [name, child] of this.children) {
        childData[name] = await child.exportFull(true);
      }
      result.children = childData;
    }
    return result;
  }
  /**
   * 导入命名空间数据
   *
   * @param data - 要导入的数据，支持数组或对象格式
   * @param options - 导入选项
   * @param options.transform - 导入前对条目进行转换（如键重命名/结构升级）
   */
  async import(data, options) {
    if (Array.isArray(data)) {
      let items = data;
      if (options?.transform) {
        items = items.map(options.transform);
      }
      const itemsObj = {};
      for (const item of items) {
        itemsObj[item.key] = item.value;
      }
      await this.mset(itemsObj);
    } else {
      if (data.data) {
        const items = Object.entries(data.data).map(([key, value]) => ({
          key,
          value
        }));
        await this.mset(items);
      }
      if (data.children) {
        for (const [name, childData] of Object.entries(data.children)) {
          const child = this.namespace(name);
          await child.import(childData);
        }
      }
    }
  }
}
function createNamespace(name, options) {
  return new CacheNamespace({
    ...options,
    name
  });
}

export { CacheNamespace, createNamespace };
/*! End of @ldesign/cache | Powered by @ldesign/builder */
//# sourceMappingURL=namespace-manager.js.map
