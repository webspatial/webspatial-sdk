// import { SpatialWebEvent } from './SpatialWebEvent'
// import { SpatialDragEvent, SpatialDragEventDetail } from './types/types'
import { SpatialWebMsgType } from './WebMsgCommand'

export function createSpatialEvent<T>(
  type: SpatialWebMsgType,
  detail: T,
): CustomEvent<T> {
  return new CustomEvent<T>(type, {
    bubbles: false,
    cancelable: false,
    detail,
  })
}

// export function createSpatialTapEvent(
//   detail: SpatialTapEventDetail,
// ): SpatialTapEvent {
//   //   return new CustomEvent<SpatialTapEventDetail>('spatialtap', {
//   //     bubbles: false,
//   //     cancelable: false,
//   //     detail,
//   //   }) as SpatialTapEvent
//   return createSpatialEvent(SpatialWebMsgType.spatialtap, detail)
// }

// export function createSpatialDragEvent(
//   detail: SpatialDragEventDetail,
// ): SpatialDragEvent {
//   return new CustomEvent<SpatialDragEventDetail>('spatialdrag', {
//     bubbles: false,
//     cancelable: false,
//     detail,
//   }) as SpatialDragEvent
// }
