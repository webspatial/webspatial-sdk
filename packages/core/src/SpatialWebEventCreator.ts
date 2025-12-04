import { SpatialWebMsgType } from './WebMsgCommand'

export function createSpatialEvent<T>(
  type: SpatialWebMsgType,
  detail: T,
): CustomEvent<T> {
  return new CustomEvent<T>(type, {
    bubbles: true,
    cancelable: false,
    detail,
  })
}
