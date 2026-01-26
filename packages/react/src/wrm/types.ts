export enum ResourceState {
  NOT_LOADED = 'NOT_LOADED',
  LOADING = 'LOADING',
  READY = 'READY',
  ATTACHED = 'ATTACHED',
  STALE = 'STALE',
  EVICTED = 'EVICTED',
}

export enum ResourceType {
  MODEL = 'MODEL',
  TEXTURE = 'TEXTURE',
  MATERIAL = 'MATERIAL',
}

export interface ResourceMetadata {
  id: string
  type: ResourceType
  state: ResourceState
  size?: number // bytes
  loadStartTime?: number
  loadEndTime?: number
  error?: string
  dependencies?: string[]
}

export interface WRMStats {
  totalResources: number
  resourcesByState: Record<ResourceState, number>
  resourcesByType: Record<ResourceType, number>
  totalMemoryUsage: number
  activeLoadRequests: number
  cacheHitRate: number
}

export interface ResourceLoadOptions {
  priority?: 'high' | 'medium' | 'low'
  preload?: boolean
  signal?: AbortSignal
}

export type ResourceEventCallback = (metadata: ResourceMetadata) => void

export interface WRMInstrumentation {
  onResourceStateChange?: ResourceEventCallback
  onResourceLoadStart?: ResourceEventCallback
  onResourceLoadComplete?: ResourceEventCallback
  onResourceError?: ResourceEventCallback
  onMemoryPressure?: (stats: WRMStats) => void
}
