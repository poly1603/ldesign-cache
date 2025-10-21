/*!
 * ***********************************
 * @ldesign/cache v0.1.1           *
 * Built with rollup               *
 * Build time: 2024-10-21 14:32:03 *
 * Build mode: production          *
 * Minified: No                    *
 * ***********************************
 */
class SnapshotManager {
  constructor(cache) {
    Object.defineProperty(this, "cache", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: cache
    });
  }
  /**
   * 创建快照
   */
  async create(options = {}) {
    const {
      name,
      description,
      keys: includeKeys,
      excludeKeys = [],
      engine,
      metadata: customMetadata
    } = options;
    let keys = includeKeys || await this.cache.keys(engine);
    if (excludeKeys.length > 0) {
      keys = keys.filter((key) => !excludeKeys.includes(key));
    }
    const data = {};
    for (const key of keys) {
      const value = await this.cache.get(key);
      if (value !== null) {
        data[key] = value;
      }
    }
    const snapshot = {
      version: SnapshotManager.SNAPSHOT_VERSION,
      timestamp: Date.now(),
      data,
      metadata: {
        name,
        description,
        custom: customMetadata
      }
    };
    return snapshot;
  }
  /**
   * 恢复快照
   */
  async restore(snapshot, options = {}) {
    const {
      clear = false,
      keys: includeKeys,
      excludeKeys = [],
      engine
    } = options;
    if (snapshot.version !== SnapshotManager.SNAPSHOT_VERSION) {
      console.warn(`Snapshot version mismatch: ${snapshot.version} vs ${SnapshotManager.SNAPSHOT_VERSION}`);
    }
    if (clear) {
      await this.cache.clear(engine);
    }
    let keys = includeKeys || Object.keys(snapshot.data);
    if (excludeKeys.length > 0) {
      keys = keys.filter((key) => !excludeKeys.includes(key));
    }
    for (const key of keys) {
      const value = snapshot.data[key];
      if (value !== void 0) {
        await this.cache.set(key, value, {
          engine
        });
      }
    }
  }
  /**
   * 导出快照为 JSON 字符串
   */
  export(snapshot, pretty = false) {
    return JSON.stringify(snapshot, null, pretty ? 2 : 0);
  }
  /**
   * 从 JSON 字符串导入快照
   */
  import(json) {
    try {
      const snapshot = JSON.parse(json);
      if (!snapshot.version || !snapshot.timestamp || !snapshot.data) {
        throw new Error("Invalid snapshot format");
      }
      return snapshot;
    } catch (error) {
      throw new Error(`Failed to import snapshot: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  /**
   * 导出快照为 Blob（用于下载）
   */
  exportAsBlob(snapshot, pretty = false) {
    const json = this.export(snapshot, pretty);
    return new Blob([json], {
      type: "application/json"
    });
  }
  /**
   * 从 Blob 导入快照
   */
  async importFromBlob(blob) {
    const text = await blob.text();
    return this.import(text);
  }
  /**
   * 比较两个快照
   */
  compare(snapshot1, snapshot2) {
    const keys1 = new Set(Object.keys(snapshot1.data));
    const keys2 = new Set(Object.keys(snapshot2.data));
    const added = [];
    const removed = [];
    const modified = [];
    const unchanged = [];
    for (const key of keys2) {
      if (!keys1.has(key)) {
        added.push(key);
      } else {
        const value1 = JSON.stringify(snapshot1.data[key]);
        const value2 = JSON.stringify(snapshot2.data[key]);
        if (value1 === value2) {
          unchanged.push(key);
        } else {
          modified.push(key);
        }
      }
    }
    for (const key of keys1) {
      if (!keys2.has(key)) {
        removed.push(key);
      }
    }
    return {
      added,
      removed,
      modified,
      unchanged
    };
  }
  /**
   * 合并多个快照
   */
  merge(...snapshots) {
    if (snapshots.length === 0) {
      throw new Error("At least one snapshot is required");
    }
    const merged = {
      version: SnapshotManager.SNAPSHOT_VERSION,
      timestamp: Date.now(),
      data: {},
      metadata: {
        name: "Merged Snapshot",
        description: `Merged from ${snapshots.length} snapshots`
      }
    };
    for (const snapshot of snapshots) {
      Object.assign(merged.data, snapshot.data);
    }
    return merged;
  }
  /**
   * 获取快照统计信息
   */
  getStats(snapshot) {
    const keyCount = Object.keys(snapshot.data).length;
    const dataSize = new Blob([JSON.stringify(snapshot.data)]).size;
    const age = Date.now() - snapshot.timestamp;
    return {
      keyCount,
      dataSize,
      timestamp: snapshot.timestamp,
      age
    };
  }
}
Object.defineProperty(SnapshotManager, "SNAPSHOT_VERSION", {
  enumerable: true,
  configurable: true,
  writable: true,
  value: "1.0.0"
});
function createSnapshotManager(cache) {
  return new SnapshotManager(cache);
}

export { SnapshotManager, createSnapshotManager };
/*! End of @ldesign/cache | Powered by @ldesign/builder */
//# sourceMappingURL=snapshot-manager.js.map
