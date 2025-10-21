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

var vue = require('vue');
var cacheManager = require('../core/cache-manager.cjs');

const CACHE_MANAGER_KEY = Symbol("cache-manager");
const CacheProvider = vue.defineComponent({
  name: "CacheProvider",
  props: {
    options: {
      type: Object,
      default: () => ({})
    }
  },
  setup(props, {
    slots
  }) {
    const cacheManager$1 = new cacheManager.CacheManager(props.options);
    vue.provide(CACHE_MANAGER_KEY, cacheManager$1);
    vue.onUnmounted(() => {
      cacheManager$1.destroy().catch((err) => console.error("Failed to destroy CacheManager on unmount:", err));
    });
    return () => slots.default?.();
  }
});
function useCacheManager() {
  const cacheManager = vue.inject(CACHE_MANAGER_KEY);
  if (!cacheManager) {
    throw new Error("CacheManager not found. Make sure to wrap your component with CacheProvider.");
  }
  return cacheManager;
}
function provideCacheManager(options) {
  const cacheManager$1 = new cacheManager.CacheManager(options);
  vue.provide(CACHE_MANAGER_KEY, cacheManager$1);
  return cacheManager$1;
}

exports.CACHE_MANAGER_KEY = CACHE_MANAGER_KEY;
exports.CacheProvider = CacheProvider;
exports.provideCacheManager = provideCacheManager;
exports.useCacheManager = useCacheManager;
/*! End of @ldesign/cache | Powered by @ldesign/builder */
//# sourceMappingURL=cache-provider.cjs.map
