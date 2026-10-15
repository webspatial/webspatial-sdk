const WEBSPATIAL_INSPECT_CHANGE_EVENT = 'webspatialinspectchange'

export function emitWebSpatialInspectChange() {
  if (typeof document === 'undefined') return
  document.dispatchEvent(new Event(WEBSPATIAL_INSPECT_CHANGE_EVENT))
}
