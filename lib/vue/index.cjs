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

var cacheProvider = require('./cache-provider.cjs');
var useCache = require('./use-cache.cjs');
var useCacheHelpers = require('./use-cache-helpers.cjs');
var useCacheStats = require('./use-cache-stats.cjs');



exports.CACHE_MANAGER_KEY = cacheProvider.CACHE_MANAGER_KEY;
exports.CacheProvider = cacheProvider.CacheProvider;
exports.provideCacheManager = cacheProvider.provideCacheManager;
exports.useCacheManager = cacheProvider.useCacheManager;
exports.useCache = useCache.useCache;
exports.useCacheAsync = useCacheHelpers.useCacheAsync;
exports.useCacheBoolean = useCacheHelpers.useCacheBoolean;
exports.useCacheCounter = useCacheHelpers.useCacheCounter;
exports.useCacheList = useCacheHelpers.useCacheList;
exports.useCacheObject = useCacheHelpers.useCacheObject;
exports.useCacheStats = useCacheStats.useCacheStats;
/*! End of @ldesign/cache | Powered by @ldesign/builder */
//# sourceMappingURL=index.cjs.map
