import { describe, expect, it } from 'vitest'
import * as ExperimentalEntry from '../experimental'

describe('experimental-entry public surface', () => {
  describe('Opt-in unstable runtime exports', () => {
    it('exports `Ornament` as a defined runtime value', () => {
      expect(ExperimentalEntry.Ornament).toBeDefined()
      expect(typeof ExperimentalEntry.Ornament).toBe('function')
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
