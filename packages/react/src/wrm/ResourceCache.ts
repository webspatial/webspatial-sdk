import {
  ResourceMetadata,
  ResourceState,
  ResourceType,
  WRMStats,
} from './types'

export class ResourceCache {
  private resources = new Map<string, ResourceMetadata>()
  private maxMemoryBytes = 50 * 1024 * 1024 // 50MB default
  private currentMemoryUsage = 0
  private accessOrder: string[] = [] // LRU tracking

  constructor(maxMemoryMB = 50) {
    this.maxMemoryBytes = maxMemoryMB * 1024 * 1024
  }

  set(id: string, metadata: ResourceMetadata): void {
    const existing = this.resources.get(id)
    if (existing?.size) {
      this.currentMemoryUsage -= existing.size
    }

    this.resources.set(id, metadata)
    if (metadata.size) {
      this.currentMemoryUsage += metadata.size
    }

    // Update access order for LRU
    this.updateAccessOrder(id)

    // Check memory pressure
    this.enforceMemoryLimit()
  }

  get(id: string): ResourceMetadata | undefined {
    const metadata = this.resources.get(id)
    if (metadata) {
      this.updateAccessOrder(id)
    }
    return metadata
  }

  has(id: string): boolean {
    return this.resources.has(id)
  }

  delete(id: string): boolean {
    const metadata = this.resources.get(id)
    if (metadata?.size) {
      this.currentMemoryUsage -= metadata.size
    }

    const index = this.accessOrder.indexOf(id)
    if (index > -1) {
      this.accessOrder.splice(index, 1)
    }

    return this.resources.delete(id)
  }

  getStats(): WRMStats {
    const stats: WRMStats = {
      totalResources: this.resources.size,
      resourcesByState: {} as Record<ResourceState, number>,
      resourcesByType: {} as Record<ResourceType, number>,
      totalMemoryUsage: this.currentMemoryUsage,
      activeLoadRequests: 0,
      cacheHitRate: 0,
    }

    // Initialize counters
    Object.values(ResourceState).forEach(state => {
      stats.resourcesByState[state] = 0
    })
    Object.values(ResourceType).forEach(type => {
      stats.resourcesByType[type] = 0
    })

    // Count resources by state and type
    this.resources.forEach(metadata => {
      stats.resourcesByState[metadata.state]++
      stats.resourcesByType[metadata.type]++
      if (metadata.state === ResourceState.LOADING) {
        stats.activeLoadRequests++
      }
    })

    return stats
  }

  getResourcesByState(state: ResourceState): ResourceMetadata[] {
    return Array.from(this.resources.values()).filter(r => r.state === state)
  }

  getStaleResources(): ResourceMetadata[] {
    return this.getResourcesByState(ResourceState.STALE)
  }

  private updateAccessOrder(id: string): void {
    const index = this.accessOrder.indexOf(id)
    if (index > -1) {
      this.accessOrder.splice(index, 1)
    }
    this.accessOrder.push(id)
  }

  private enforceMemoryLimit(): void {
    while (
      this.currentMemoryUsage > this.maxMemoryBytes &&
      this.accessOrder.length > 0
    ) {
      const oldestId = this.accessOrder[0]
      const metadata = this.resources.get(oldestId)

      if (metadata && metadata.state === ResourceState.STALE) {
        this.transitionToEvicted(oldestId)
      } else if (metadata) {
        // Mark as stale instead of immediate eviction
        this.transitionToStale(oldestId)
      }
    }
  }

  private transitionToStale(id: string): void {
    const metadata = this.resources.get(id)
    if (metadata && metadata.state !== ResourceState.ATTACHED) {
      metadata.state = ResourceState.STALE
      console.log(`Resource ${id} marked as stale due to memory pressure`)
    }
  }

  private transitionToEvicted(id: string): void {
    const metadata = this.resources.get(id)
    if (metadata) {
      metadata.state = ResourceState.EVICTED
      console.log(`Resource ${id} evicted due to memory pressure`)
      this.delete(id)
    }
  }
}
