export class SpatialWebEvent {
  static init() {
    // inject __SpatialWebEvent
    window.__SpatialWebEvent = (data: any) => {
      console.log('__SpatialWebEvent', data)
    }
  }
}
