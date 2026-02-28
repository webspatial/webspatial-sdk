import { EventEmitterProtocol } from './types/types'

export class EventEmitter implements EventEmitterProtocol {
  listeners: Record<string, Array<(object: any, data: any) => void>> = {}

  on(event: string, listener: (object: any, data: any) => void): void {
    if (!this.listeners[event]) {
      this.listeners[event] = []
    }
    this.listeners[event].push(listener)
  }

  emit(event: string, data: any): void {
    if (this.listeners[event]) {
      this.listeners[event].forEach(listener => {
        listener(this, data)
      })
    }
  }

  off(event: string, listener: (object: any, data: any) => void): void {
    if (this.listeners[event]) {
      // In TypeScript we remove listeners by index
      const index = this.listeners[event].indexOf(listener)
      if (index !== -1) {
        this.listeners[event].splice(index, 1)
      }
    }
  }

  reset(): void {
    this.listeners = {}
  }
}
