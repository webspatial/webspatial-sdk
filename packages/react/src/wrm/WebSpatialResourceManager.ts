import { SpatialSession, SpatialObject } from '@webspatial/core-sdk'
import { ResourceStateMachine } from './ResourceStateMachine'
import { ResourceCache } from './ResourceCache'
import {
  ResourceMetadata,
  ResourceType,
  ResourceLoadOptions,
  WRMInstrumentation,
  WRMStats,
  ResourceState,
} from './types'

export class WebSpatialResourceManager {
  private cache: ResourceCache
  private stateMachines = new Map<string, ResourceStateMachine>()
  private activeLoads = new Map<string, Promise<SpatialObject>>()
  private instrumentation: WRMInstrumentation
  private maxConcurrentLoads = 3

  constructor(
    private session: SpatialSession,
    instrumentation: WRMInstrumentation = {},
    maxMemoryMB = 50,
  ) {
    this.cache = new ResourceCache(maxMemoryMB)
    this.instrumentation = instrumentation
  }

  setInstrumentation(instrumentation: WRMInstrumentation) {
    this.instrumentation = instrumentation
  }

  // Stage 0: Asset Preloading
  async preloadModel(
    id: string,
    url: string,
    options: ResourceLoadOptions = {},
  ): Promise<void> {
    if (this.cache.has(id)) {
      console.log(`Model ${id} already cached, skipping preload`)
      return
    }

    const stateMachine = new ResourceStateMachine(
      id,
      ResourceType.MODEL,
      this.instrumentation,
    )
    this.stateMachines.set(id, stateMachine)

    stateMachine.transitionTo(ResourceState.LOADING)

    try {
      // Queue the load with concurrency control
      const loadPromise = this.queueLoad(id, () =>
        this.session.createModelAsset({ url }),
      )
      this.cache.set(id, stateMachine.getMetadata())

      await loadPromise
      stateMachine.transitionTo(ResourceState.READY)

      // Update cache with final metadata
      this.cache.set(id, stateMachine.getMetadata())
    } catch (error) {
      stateMachine.transitionTo(
        ResourceState.EVICTED,
        error instanceof Error ? error.message : 'Unknown error',
      )
      throw error
    }
  }

  // Stage 0: Model Management
  async loadModel(
    id: string,
    url: string,
    options: ResourceLoadOptions = {},
  ): Promise<SpatialObject> {
    // Check cache first
    const cached = this.cache.get(id)
    if (cached && cached.state === ResourceState.READY) {
      console.log(`Model ${id} cache hit`)
      const resource = await this.activeLoads.get(id)!
      this.updateResourceState(id, ResourceState.ATTACHED)
      return resource
    }

    // Create state machine if new
    if (!this.stateMachines.has(id)) {
      const stateMachine = new ResourceStateMachine(
        id,
        ResourceType.MODEL,
        this.instrumentation,
      )
      this.stateMachines.set(id, stateMachine)
    }

    const stateMachine = this.stateMachines.get(id)!

    // Start loading if not already in progress
    if (!this.activeLoads.has(id)) {
      stateMachine.transitionTo(ResourceState.LOADING)

      const loadPromise = this.queueLoad(id, () =>
        this.session.createModelAsset({ url }),
      )
      this.activeLoads.set(id, loadPromise)

      loadPromise.then(
        resource => {
          stateMachine.transitionTo(ResourceState.READY)
          this.updateResourceState(id, ResourceState.ATTACHED)
          return resource
        },
        error => {
          stateMachine.transitionTo(
            ResourceState.EVICTED,
            error instanceof Error ? error.message : 'Unknown error',
          )
          throw error
        },
      )
    }

    return this.activeLoads.get(id)!
  }

  // Stage 0: Material Management
  async createMaterial(id: string, options: any): Promise<SpatialObject> {
    if (!this.stateMachines.has(id)) {
      const stateMachine = new ResourceStateMachine(
        id,
        ResourceType.MATERIAL,
        this.instrumentation,
      )
      this.stateMachines.set(id, stateMachine)
    }

    const stateMachine = this.stateMachines.get(id)!
    stateMachine.transitionTo(ResourceState.LOADING)

    try {
      const material = await this.session.createUnlitMaterial(options)
      stateMachine.transitionTo(ResourceState.READY)
      this.updateResourceState(id, ResourceState.ATTACHED)
      return material
    } catch (error) {
      stateMachine.transitionTo(
        ResourceState.EVICTED,
        error instanceof Error ? error.message : 'Unknown error',
      )
      throw error
    }
  }

  // Resource lifecycle management
  releaseResource(id: string): void {
    const stateMachine = this.stateMachines.get(id)
    if (stateMachine) {
      this.updateResourceState(id, ResourceState.STALE)
    }
  }

  destroyResource(id: string): void {
    const stateMachine = this.stateMachines.get(id)
    if (stateMachine) {
      this.updateResourceState(id, ResourceState.EVICTED)
      this.stateMachines.delete(id)
      this.activeLoads.delete(id)
      this.cache.delete(id)
    }
  }

  // Stage 1: Instrumentation & Devtools
  getStats(): WRMStats {
    return this.cache.getStats()
  }

  getResourceMetadata(id: string): ResourceMetadata | undefined {
    return this.cache.get(id)
  }

  getAllResources(): ResourceMetadata[] {
    return Array.from(this.stateMachines.values()).map(sm => sm.getMetadata())
  }

  getResourcesByState(state: ResourceState): ResourceMetadata[] {
    return this.cache.getResourcesByState(state)
  }

  private async queueLoad<T>(
    id: string,
    factory: () => Promise<T>,
  ): Promise<T> {
    // Simple concurrency control
    while (this.getActiveLoadCount() >= this.maxConcurrentLoads) {
      await new Promise(resolve => setTimeout(resolve, 10))
    }

    return factory()
  }

  private getActiveLoadCount(): number {
    return Array.from(this.stateMachines.values()).filter(
      sm => sm.getMetadata().state === ResourceState.LOADING,
    ).length
  }

  private updateResourceState(id: string, newState: ResourceState): void {
    const stateMachine = this.stateMachines.get(id)
    if (stateMachine) {
      stateMachine.transitionTo(newState)
      this.cache.set(id, stateMachine.getMetadata())
    }
  }

  // Cleanup
  destroy(): void {
    // Cancel all active loads
    this.activeLoads.forEach((promise, id) => {
      this.destroyResource(id)
    })

    this.stateMachines.clear()
    this.activeLoads.clear()
  }
}
