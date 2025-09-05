import { SpatialTapEvent, SpatialTapEventDetail, Vec3 } from './types/types'

export function createSpatialTapEvent(location3D: Vec3): SpatialTapEvent {
  return new CustomEvent<SpatialTapEventDetail>('spatialtap', {
    bubbles: false,
    cancelable: false,
    detail: {
      location3D,
    },
  }) as SpatialTapEvent
}
