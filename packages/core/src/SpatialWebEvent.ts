interface SpatialWebEventData {
  id: string
  data: any
}

export class SpatialWebEvent {
  static eventReceiver: Record<string, Set<(data: any) => void>> = {}
  static init() {
    // inject __SpatialWebEvent
    window.__SpatialWebEvent = ({ id, data }: SpatialWebEventData) => {
      // console.log('__SpatialWebEvent', id, data)
      const receivers = SpatialWebEvent.eventReceiver[id]
      if (!receivers) return
      receivers.forEach(receiver => receiver(data))
    }
  }

  static addEventReceiver(id: string, callback: (data: any) => void) {
    // A single `id` can have multiple receivers.
    SpatialWebEvent.eventReceiver[id] ??= new Set()
    SpatialWebEvent.eventReceiver[id].add(callback)
  }

  static removeEventReceiver(id: string, callback?: (data: any) => void) {
    // If callback is omitted, remove all receivers for the id.
    if (!callback) {
      delete SpatialWebEvent.eventReceiver[id]
      return
    }

    const receivers = SpatialWebEvent.eventReceiver[id]
    if (!receivers) return
    receivers.delete(callback)
    if (receivers.size === 0) {
      delete SpatialWebEvent.eventReceiver[id]
    }
  }
}
