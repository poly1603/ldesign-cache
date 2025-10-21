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

var cacheManager = require('./core/cache-manager.cjs');
var presets = require('./presets.cjs');
var localStorageEngine = require('./engines/local-storage-engine.cjs');
var memoryEngine = require('./engines/memory-engine.cjs');
var sessionStorageEngine = require('./engines/session-storage-engine.cjs');
var errorHandler = require('./utils/error-handler.cjs');
var eventEmitter = require('./utils/event-emitter.cjs');

function createCoreCache(preset) {
  const options = preset ? presets.getPresetOptions(preset) : void 0;
  return new cacheManager.CacheManager(options);
}

exports.CacheManager = cacheManager.CacheManager;
exports.LocalStorageEngine = localStorageEngine.LocalStorageEngine;
exports.MemoryEngine = memoryEngine.MemoryEngine;
exports.SessionStorageEngine = sessionStorageEngine.SessionStorageEngine;
exports.ErrorHandler = errorHandler.ErrorHandler;
exports.EventEmitter = eventEmitter.EventEmitter;
exports.createCoreCache = createCoreCache;
/*! End of @ldesign/cache | Powered by @ldesign/builder */
//# sourceMappingURL=index-core.cjs.map
