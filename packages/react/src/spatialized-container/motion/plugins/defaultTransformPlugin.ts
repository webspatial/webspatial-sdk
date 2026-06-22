import type { MotionFieldPlugin } from './types'

/** Default ownership plugin for `transform` handoff in native host-transform playback. */
export const defaultTransformPlugin: MotionFieldPlugin = {
  field: 'transform',
  captureAuthoredValue({ authoredInputs }) {
    return authoredInputs.transform
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
        value: authoredValue as string,
      }
    }
    return { mode: 'default' }
  },
  resolveOuterSync({ owner }) {
    if (owner === 'native') {
      return { mode: 'omit' }
    }
    return { mode: 'default' }
  },
}
