/*!
 * ***********************************
 * @ldesign/cache v0.1.1           *
 * Built with rollup               *
 * Build time: 2024-10-21 14:32:03 *
 * Build mode: production          *
 * Minified: No                    *
 * ***********************************
 */
import { defineComponent, provide, onUnmounted, inject } from 'vue';
import { CacheManager } from '../core/cache-manager.js';

const CACHE_MANAGER_KEY = Symbol("cache-manager");
const CacheProvider = defineComponent({
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
    const cacheManager = new CacheManager(props.options);
    provide(CACHE_MANAGER_KEY, cacheManager);
    onUnmounted(() => {
      cacheManager.destroy().catch((err) => console.error("Failed to destroy CacheManager on unmount:", err));
    });
    return () => slots.default?.();
  }
});
function useCacheManager() {
  const cacheManager = inject(CACHE_MANAGER_KEY);
  if (!cacheManager) {
    throw new Error("CacheManager not found. Make sure to wrap your component with CacheProvider.");
  }
  return cacheManager;
}
function provideCacheManager(options) {
  const cacheManager = new CacheManager(options);
  provide(CACHE_MANAGER_KEY, cacheManager);
  return cacheManager;
}

export { CACHE_MANAGER_KEY, CacheProvider, provideCacheManager, useCacheManager };
/*! End of @ldesign/cache | Powered by @ldesign/builder */
//# sourceMappingURL=cache-provider.js.map
