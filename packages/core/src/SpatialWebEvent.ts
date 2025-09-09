interface SpatialWebEventData {
  id: string
  data: any
}

export class SpatialWebEvent {
  static eventReceiver: Record<string, (data: any) => void> = {}
  static init() {
    // inject __SpatialWebEvent
    window.__SpatialWebEvent = ({ id, data }: SpatialWebEventData) => {
      // console.log('__SpatialWebEvent', id, data)
      SpatialWebEvent.eventReceiver[id]?.(data)
    }
  }

  static addEventReceiver(id: string, callback: (data: any) => void) {
    SpatialWebEvent.eventReceiver[id] = callback
  }

  static removeEventReceiver(id: string) {
    delete SpatialWebEvent.eventReceiver[id]
  }
}
