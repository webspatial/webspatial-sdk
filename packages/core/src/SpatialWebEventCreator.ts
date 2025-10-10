import { SpatialWebMsgType } from './WebMsgCommand'

export function createSpatialEvent<T>(
  type: SpatialWebMsgType,
  detail: T,
  options?: {
    target?: any
    currentTarget?: any
    bubbles?: boolean
    cancelable?: boolean
  },
): CustomEvent<T> & { target?: any; currentTarget?: any } {
  const event = new CustomEvent<T>(type, {
    detail,
    bubbles: options?.bubbles ?? false,
    cancelable: options?.cancelable ?? false,
  })
  // overwrite target
  if (options?.target) {
    Object.defineProperty(event, 'target', {
      value: options.target,
      writable: false,
    })
  }
  // overwrite currentTarget
  if (options?.currentTarget) {
    Object.defineProperty(event, 'currentTarget', {
      value: options.currentTarget,
      writable: false,
    })
  }
  return event
}
