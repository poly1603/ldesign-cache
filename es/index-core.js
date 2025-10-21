/*!
 * ***********************************
 * @ldesign/cache v0.1.1           *
 * Built with rollup               *
 * Build time: 2024-10-21 14:32:03 *
 * Build mode: production          *
 * Minified: No                    *
 * ***********************************
 */
import { CacheManager } from './core/cache-manager.js';
import { getPresetOptions } from './presets.js';
export { LocalStorageEngine } from './engines/local-storage-engine.js';
export { MemoryEngine } from './engines/memory-engine.js';
export { SessionStorageEngine } from './engines/session-storage-engine.js';
export { ErrorHandler } from './utils/error-handler.js';
export { EventEmitter } from './utils/event-emitter.js';

function createCoreCache(preset) {
  const options = preset ? getPresetOptions(preset) : void 0;
  return new CacheManager(options);
}

export { CacheManager, createCoreCache };
/*! End of @ldesign/cache | Powered by @ldesign/builder */
//# sourceMappingURL=index-core.js.map
