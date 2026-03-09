/**
 * Extra performance-only metrics.
 */

export interface PerformanceMetrics {
  operation: 'get' | 'set' | 'delete' | 'clear'
  responseTime: number
  timestamp: number
  success: boolean
}
