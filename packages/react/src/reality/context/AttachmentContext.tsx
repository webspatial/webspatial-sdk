import { createContext, useContext } from 'react'

type ContainersChangeCallback = (containers: HTMLElement[]) => void

export class AttachmentRegistry {
  // name → (instanceId → container)
  private containers = new Map<string, Map<string, HTMLElement>>()
  private listeners = new Map<string, Set<ContainersChangeCallback>>()

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
    if (!this.listeners.has(name)) {
      this.listeners.set(name, new Set())
    }
    this.listeners.get(name)!.add(cb)
    return () => {
      this.listeners.get(name)?.delete(cb)
    }
  }

  private notifyListeners(name: string) {
    const cs = this.getContainers(name)
    this.listeners.get(name)?.forEach(cb => cb(cs))
  }

  destroy() {
    this.containers.clear()
    this.listeners.clear()
  }
}

export const AttachmentContext = createContext<AttachmentRegistry | null>(null)
export const useAttachmentContext = () => useContext(AttachmentContext)
