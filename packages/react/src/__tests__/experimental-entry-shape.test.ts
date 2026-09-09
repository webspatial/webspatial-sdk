import { describe, expect, it } from 'vitest'
import * as ExperimentalEntry from '../experimental'
import type {
  OrnamentPoint3D,
  OrnamentProps,
  OrnamentVisibility,
} from '../experimental'

type OrnamentTypeSurface = Pick<
  OrnamentProps,
  'attachmentAnchor' | 'contentAlignment' | 'visibility'
>

const ornamentTypeSurface: OrnamentTypeSurface = {
  attachmentAnchor: 'bottom' satisfies OrnamentPoint3D,
  contentAlignment: 'back' satisfies OrnamentPoint3D,
  visibility: 'visible' satisfies OrnamentVisibility,
}

describe('experimental-entry public surface', () => {
  describe('Opt-in unstable runtime exports', () => {
    it('exports `Ornament` as a defined runtime value', () => {
      expect(ExperimentalEntry.Ornament).toBeDefined()
      expect(typeof ExperimentalEntry.Ornament).toBe('function')
    })

    it('keeps Ornament prop helper types available from the experimental entry', () => {
      expect(ornamentTypeSurface).toEqual({
        attachmentAnchor: 'bottom',
        contentAlignment: 'back',
        visibility: 'visible',
      })
    })
  })

  describe('Does not accidentally re-export stable entry internals', () => {
    it('does not export stable-only primitive facades (e.g. Model, Reality)', () => {
      expect(
        (ExperimentalEntry as Record<string, unknown>).Model,
      ).toBeUndefined()
      expect(
        (ExperimentalEntry as Record<string, unknown>).Reality,
      ).toBeUndefined()
    })
  })
})
