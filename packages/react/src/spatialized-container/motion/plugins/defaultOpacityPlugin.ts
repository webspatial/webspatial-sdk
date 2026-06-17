import type { MotionFieldPlugin } from './types'

/** Default ownership plugin for `opacity` handoff in native SpatialDiv playback. */
export const defaultOpacityPlugin: MotionFieldPlugin = {
  field: 'opacity',
  captureAuthoredValue({ authoredInputs }) {
    return authoredInputs.opacity
  },
  resolveTerminalOwner({ authoredValue }) {
    return authoredValue !== undefined ? 'authored' : 'native'
  },
  resolveInnerStyle({ suppressed, owner, authoredValue }) {
    if (suppressed || owner === 'native') {
      return { mode: 'omit' }
    }
    if (owner === 'authored' && authoredValue !== undefined) {
      return {
        mode: 'set',
        value: authoredValue as number | string,
      }
    }
    return { mode: 'default' }
  },
  resolveOuterSync({ owner, authoredValue }) {
    if (owner === 'authored' && authoredValue !== undefined) {
      return { mode: 'set', value: 1 }
    }
    if (owner === 'native') {
      return { mode: 'omit' }
    }
    return { mode: 'default' }
  },
}
