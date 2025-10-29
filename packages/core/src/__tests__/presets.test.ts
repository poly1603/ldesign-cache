/**
 * Presets 测试
 */
import { describe, it, expect } from 'vitest'
import {
  createBrowserCache,
  createNodeCache,
  createOfflineCache,
  createSSRCache,
  getPresetOptions,
} from '../presets'

describe('Presets', () => {
  describe('createBrowserCache', () => {
    it('应该返回浏览器环境配置', () => {
      const config = createBrowserCache()

      expect(config).toHaveProperty('defaultEngine', 'localStorage')
      expect(config).toHaveProperty('defaultTTL')
      expect(config.defaultTTL).toBeGreaterThan(0)
    })

    it('应该支持自定义选项', () => {
      const config = createBrowserCache({ defaultTTL: 5000 })

      expect(config.defaultTTL).toBe(5000)
    })
  })

  describe('createNodeCache', () => {
    it('应该返回 Node.js 环境配置', () => {
      const config = createNodeCache()

      expect(config).toHaveProperty('defaultEngine', 'memory')
      expect(config).toHaveProperty('defaultTTL')
    })
  })

  describe('createOfflineCache', () => {
    it('应该返回离线环境配置', () => {
      const config = createOfflineCache()

      expect(config).toHaveProperty('defaultEngine', 'indexedDB')
      expect(config).toHaveProperty('defaultTTL')
    })
  })

  describe('createSSRCache', () => {
    it('应该返回 SSR 环境配置', () => {
      const config = createSSRCache()

      expect(config).toHaveProperty('defaultEngine', 'memory')
      expect(config).toHaveProperty('defaultTTL')
    })
  })

  describe('getPresetOptions', () => {
    it('应该返回 browser 预设', () => {
      const config = getPresetOptions('browser')
      expect(config.defaultEngine).toBe('localStorage')
    })

    it('应该返回 node 预设', () => {
      const config = getPresetOptions('node')
      expect(config.defaultEngine).toBe('memory')
    })

    it('应该返回 offline 预设', () => {
      const config = getPresetOptions('offline')
      expect(config.defaultEngine).toBe('indexedDB')
    })

    it('应该返回 ssr 预设', () => {
      const config = getPresetOptions('ssr')
      expect(config.defaultEngine).toBe('memory')
    })
  })
})

