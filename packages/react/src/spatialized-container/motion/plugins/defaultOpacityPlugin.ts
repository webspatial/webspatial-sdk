import type { MotionFieldPlugin } from './types'

/** Default ownership plugin for `opacity` handoff in native SpatialDiv playback. */
export const defaultOpacityPlugin: MotionFieldPlugin = {
  field: 'opacity',
  styleKey: 'opacity',
  nativeSink: {
    kind: 'property',
    property: 'opacity',
  },
  readAuthoredValue({ authoredInputs }) {
    return authoredInputs.style?.opacity
  },
  readRawValue({ rawStyle }) {
    return rawStyle.opacity
  },
  readOuterDomValue({ computedStyle }) {
    return parseFloat(computedStyle.getPropertyValue('opacity'))
  },
  captureAuthoredValue({ authoredInputs }) {
    return authoredInputs.style?.opacity
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
