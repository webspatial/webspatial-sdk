import {
  ResourceMetadata,
  ResourceState,
  ResourceType,
  WRMInstrumentation,
  WRMStats,
  ResourceLoadOptions,
} from './types'

export class ResourceStateMachine {
  private metadata: ResourceMetadata
  private instrumentation: WRMInstrumentation

  constructor(
    id: string,
    type: ResourceType,
    instrumentation: WRMInstrumentation = {},
  ) {
    this.metadata = {
      id,
      type,
      state: ResourceState.NOT_LOADED,
    }
    this.instrumentation = instrumentation
  }

  getMetadata(): ResourceMetadata {
    return { ...this.metadata }
  }

  transitionTo(newState: ResourceState, error?: string): void {
    const oldState = this.metadata.state
    if (oldState === newState) return

    // Validate state transitions
    if (!this.isValidTransition(oldState, newState)) {
      console.warn(
        `Invalid state transition: ${oldState} -> ${newState} for resource ${this.metadata.id}`,
      )
      return
    }

    this.metadata.state = newState

    if (newState === ResourceState.LOADING) {
      this.metadata.loadStartTime = performance.now()
    } else if (
      newState === ResourceState.READY ||
      newState === ResourceState.EVICTED
    ) {
      this.metadata.loadEndTime = performance.now()
    }

    if (error) {
      this.metadata.error = error
    }

    // Notify instrumentation
    this.instrumentation.onResourceStateChange?.(this.metadata)

    if (newState === ResourceState.LOADING) {
      this.instrumentation.onResourceLoadStart?.(this.metadata)
    } else if (newState === ResourceState.READY) {
      this.instrumentation.onResourceLoadComplete?.(this.metadata)
    } else if (newState === ResourceState.EVICTED && this.metadata.error) {
      this.instrumentation.onResourceError?.(this.metadata)
    }
  }

  private isValidTransition(from: ResourceState, to: ResourceState): boolean {
    const transitions: Record<ResourceState, ResourceState[]> = {
      [ResourceState.NOT_LOADED]: [
        ResourceState.LOADING,
        ResourceState.EVICTED,
      ],
      [ResourceState.LOADING]: [ResourceState.READY, ResourceState.EVICTED],
      [ResourceState.READY]: [
        ResourceState.ATTACHED,
        ResourceState.STALE,
        ResourceState.EVICTED,
      ],
      [ResourceState.ATTACHED]: [ResourceState.STALE, ResourceState.EVICTED],
      [ResourceState.STALE]: [
        ResourceState.READY,
        ResourceState.ATTACHED,
        ResourceState.EVICTED,
      ],
      [ResourceState.EVICTED]: [ResourceState.NOT_LOADED],
    }

    return transitions[from]?.includes(to) ?? false
  }

  updateSize(size: number): void {
    this.metadata.size = size
  }

  addDependency(id: string): void {
    if (!this.metadata.dependencies) {
      this.metadata.dependencies = []
    }
    if (!this.metadata.dependencies.includes(id)) {
      this.metadata.dependencies.push(id)
    }
  }
}
