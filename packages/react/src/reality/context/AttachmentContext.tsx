import { createContext, useContext } from 'react'

type ContainerChangeCallback = (container: HTMLElement | null) => void

export class AttachmentRegistry {
  private containers = new Map<string, HTMLElement>()
  private listeners = new Map<string, Set<ContainerChangeCallback>>()

  setContainer(name: string, container: HTMLElement) {
    this.containers.set(name, container)
    this.listeners.get(name)?.forEach(cb => cb(container))
  }

  getContainer(name: string): HTMLElement | undefined {
    return this.containers.get(name)
  }

  onContainerChange(
    name: string,
    cb: ContainerChangeCallback,
  ): () => void {
    const existing = this.containers.get(name)
    if (existing) {
      cb(existing)
    }
    if (!this.listeners.has(name)) {
      this.listeners.set(name, new Set())
    }
    this.listeners.get(name)!.add(cb)
    return () => {
      this.listeners.get(name)?.delete(cb)
    }
  }

  removeContainer(name: string) {
    this.containers.delete(name)
    this.listeners.get(name)?.forEach(cb => cb(null))
  }

  destroy() {
    this.containers.clear()
    this.listeners.clear()
  }
}

export const AttachmentContext = createContext<AttachmentRegistry | null>(null)
export const useAttachmentContext = () => useContext(AttachmentContext)
