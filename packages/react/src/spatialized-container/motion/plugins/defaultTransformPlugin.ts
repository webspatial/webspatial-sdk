import type { MotionFieldPlugin } from './types'

/** Default ownership plugin for `transform` handoff in native host-transform playback. */
export const defaultTransformPlugin: MotionFieldPlugin = {
  field: 'transform',
  styleKey: 'transform',
  nativeSink: {
    kind: 'transform',
  },
  readAuthoredValue({ authoredInputs }) {
    return authoredInputs.style?.transform
  },
  readRawValue({ rawStyle }) {
    return rawStyle.transform
  },
  readOuterDomValue({ transformMatrix }) {
    return transformMatrix
  },
  captureAuthoredValue({ authoredInputs }) {
    return authoredInputs.style?.transform
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
