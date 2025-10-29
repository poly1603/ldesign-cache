export interface InspectorOptions {
  enabled?: boolean
  logLevel?: 'debug' | 'info' | 'warn' | 'error'
}

export interface ProfilerData {
  operation: string
  duration: number
  timestamp: number
}


