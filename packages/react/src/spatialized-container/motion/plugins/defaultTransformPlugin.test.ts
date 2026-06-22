import { describe, expect, test } from 'vitest'
import { defaultTransformPlugin } from './defaultTransformPlugin'

describe('defaultTransformPlugin', () => {
  test('captures authored transform from React-authored inputs only', () => {
    expect(
      defaultTransformPlugin.captureAuthoredValue({
        authoredInputs: { transform: 'translate3d(12px, 0px, 0px)' },
      }),
    ).toBe('translate3d(12px, 0px, 0px)')
    expect(
      defaultTransformPlugin.captureAuthoredValue({
        authoredInputs: {},
      }),
    ).toBeUndefined()
  })

  test('prefers authored terminal ownership when an explicit authored transform exists', () => {
    expect(
      defaultTransformPlugin.resolveTerminalOwner({
        authoredValue: 'translate3d(12px, 0px, 0px)',
      }),
    ).toBe('authored')
    expect(
      defaultTransformPlugin.resolveTerminalOwner({
        authoredValue: undefined,
      }),
    ).toBe('native')
  })

  test('omits inner DOM transform while native playback suppresses the field or keeps terminal control', () => {
    expect(
      defaultTransformPlugin.resolveInnerStyle({
        suppressed: true,
        owner: null,
        authoredValue: 'translate3d(12px, 0px, 0px)',
        rawValue: 'translate3d(50px, 0px, 0px)',
      }),
    ).toEqual({ mode: 'omit' })
    expect(
      defaultTransformPlugin.resolveInnerStyle({
        suppressed: false,
        owner: 'native',
        authoredValue: undefined,
        rawValue: 'translate3d(50px, 0px, 0px)',
      }),
    ).toEqual({ mode: 'omit' })
  })

  test('restores authored inner DOM transform when authored ownership wins terminal handoff', () => {
    expect(
      defaultTransformPlugin.resolveInnerStyle({
        suppressed: false,
        owner: 'authored',
        authoredValue: 'translate3d(12px, 0px, 0px)',
        rawValue: 'translate3d(50px, 0px, 0px)',
      }),
    ).toEqual({ mode: 'set', value: 'translate3d(12px, 0px, 0px)' })
  })

  test('keeps native terminal transform authoritative in outer sync when requested', () => {
    expect(
      defaultTransformPlugin.resolveOuterSync({
        owner: 'native',
        authoredValue: undefined,
        domValue: 'translate3d(50px, 0px, 0px)',
      }),
    ).toEqual({ mode: 'omit' })
    expect(
      defaultTransformPlugin.resolveOuterSync({
        owner: 'authored',
        authoredValue: 'translate3d(12px, 0px, 0px)',
        domValue: 'translate3d(50px, 0px, 0px)',
      }),
    ).toEqual({ mode: 'default' })
  })
})
