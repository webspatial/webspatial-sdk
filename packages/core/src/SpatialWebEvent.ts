interface SpatialWebEventData {
  id: string
  data: any
}

export class SpatialWebEvent {
  static eventReceiver: Map<string, Set<(data: any) => void>> = new Map()
  static init() {
    // inject __SpatialWebEvent
    window.__SpatialWebEvent = ({ id, data }: SpatialWebEventData) => {
      // console.log('__SpatialWebEvent', id, data)
      SpatialWebEvent.eventReceiver.get(id)?.forEach(fn => fn(data))
    }
  }

  static addEventReceiver(id: string, callback: (data: any) => void) {
    // A single `id` can have multiple receivers.
    if (!SpatialWebEvent.eventReceiver.has(id)) {
      SpatialWebEvent.eventReceiver.set(id, new Set())
    }
    SpatialWebEvent.eventReceiver.get(id)!.add(callback)
  }

  static removeEventReceiver(id: string, callback?: (data: any) => void) {
    // If callback is omitted, remove all receivers for the id.
    if (!callback) {
      SpatialWebEvent.eventReceiver.delete(id)
      return
    }

    const receivers = SpatialWebEvent.eventReceiver.get(id)
    if (!receivers) return
    receivers.delete(callback)
    if (receivers.size === 0) {
      SpatialWebEvent.eventReceiver.delete(id)
    }
  }
}
