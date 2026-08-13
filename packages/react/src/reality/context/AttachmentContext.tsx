import { createContext, useContext } from 'react'

export type ContainerEntry = { instanceId: string; container: HTMLElement }

type ContainersChangeCallback = (containers: ContainerEntry[]) => void

export class AttachmentRegistry {
  // asset id → (instanceId → container)
  private containers = new Map<string, Map<string, HTMLElement>>()
  private listeners = new Map<string, ContainersChangeCallback>()

  addContainer(assetId: string, instanceId: string, container: HTMLElement) {
    if (!this.containers.has(assetId)) {
      this.containers.set(assetId, new Map())
    }
    this.containers.get(assetId)!.set(instanceId, container)
    this.notifyListeners(assetId)
  }

  removeContainer(assetId: string, instanceId: string) {
    this.containers.get(assetId)?.delete(instanceId)
    if (this.containers.get(assetId)?.size === 0) {
      this.containers.delete(assetId)
    }
    this.notifyListeners(assetId)
  }

  getContainers(assetId: string): ContainerEntry[] {
    const map = this.containers.get(assetId)
    if (!map) return []
    return Array.from(map, ([instanceId, container]) => ({
      instanceId,
      container,
    }))
  }

  onContainersChange(
    assetId: string,
    cb: ContainersChangeCallback,
  ): () => void {
    const current = this.getContainers(assetId)
    if (current.length > 0) {
      cb(current)
    }
    const prev = this.listeners.get(assetId)
    if (prev) prev([])
    this.listeners.set(assetId, cb)
    return () => {
      if (this.listeners.get(assetId) === cb) {
        this.listeners.delete(assetId)
      }
    }
  }

  private notifyListeners(assetId: string) {
    const cs = this.getContainers(assetId)
    this.listeners.get(assetId)?.(cs)
  }

  destroy() {
    this.containers.clear()
    this.listeners.clear()
  }
}

export const AttachmentContext = createContext<AttachmentRegistry | null>(null)
export const useAttachmentContext = () => useContext(AttachmentContext)
