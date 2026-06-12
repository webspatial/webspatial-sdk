interface SpatialWebEventData {
  id: string
  data: any
}

export class SpatialWebEvent {
  private static readonly eventReceiver: Map<string, Set<(data: any) => void>> =
    new Map()
  static init() {
    // inject __SpatialWebEvent
    window.__SpatialWebEvent = ({ id, data }: SpatialWebEventData) => {
      // console.log('__SpatialWebEvent', id, data)
      // Snapshot receivers so one callback cannot affect fan-out delivery.
      const receivers = Array.from(SpatialWebEvent.eventReceiver.get(id) ?? [])
      receivers.forEach(fn => {
        try {
          fn(data)
        } catch (error) {
          // Isolate receiver failures so remaining subscribers still run.
          console.error('SpatialWebEvent receiver failed', id, error)
        }
      })
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
