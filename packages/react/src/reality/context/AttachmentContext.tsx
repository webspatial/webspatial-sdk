import { createContext, useContext } from 'react'

type ContainersChangeCallback = (containers: HTMLElement[]) => void

export class AttachmentRegistry {
  // name → (instanceId → container)
  private containers = new Map<string, Map<string, HTMLElement>>()
  private listeners = new Map<string, ContainersChangeCallback>()

  addContainer(name: string, instanceId: string, container: HTMLElement) {
    if (!this.containers.has(name)) {
      this.containers.set(name, new Map())
    }
    this.containers.get(name)!.set(instanceId, container)
    this.notifyListeners(name)
  }

  removeContainer(name: string, instanceId: string) {
    this.containers.get(name)?.delete(instanceId)
    if (this.containers.get(name)?.size === 0) {
      this.containers.delete(name)
    }
    this.notifyListeners(name)
  }

  getContainers(name: string): HTMLElement[] {
    const map = this.containers.get(name)
    return map ? Array.from(map.values()) : []
  }

  onContainersChange(name: string, cb: ContainersChangeCallback): () => void {
    const current = this.getContainers(name)
    if (current.length > 0) {
      cb(current)
    }
    const prev = this.listeners.get(name)
    if (prev) prev([])
    this.listeners.set(name, cb)
    return () => {
      if (this.listeners.get(name) === cb) {
        this.listeners.delete(name)
      }
    }
  }

  private notifyListeners(name: string) {
    const cs = this.getContainers(name)
    this.listeners.get(name)?.(cs)
  }

  destroy() {
    this.containers.clear()
    this.listeners.clear()
  }
}

export const AttachmentContext = createContext<AttachmentRegistry | null>(null)
export const useAttachmentContext = () => useContext(AttachmentContext)
