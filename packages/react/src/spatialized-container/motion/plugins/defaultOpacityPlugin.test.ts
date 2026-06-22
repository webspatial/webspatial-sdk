import { describe, expect, test } from 'vitest'
import { defaultOpacityPlugin } from './defaultOpacityPlugin'

describe('defaultOpacityPlugin', () => {
  test('reads authored opacity from React style descriptor input', () => {
    expect(
      defaultOpacityPlugin.readAuthoredValue({
        authoredInputs: {
          style: {
            opacity: 0.75,
          },
        },
      }),
    ).toBe(0.75)
    expect(
      defaultOpacityPlugin.readAuthoredValue({
        authoredInputs: {},
      }),
    ).toBeUndefined()
  })

  test('captures authored opacity from React-authored inputs only', () => {
    expect(
      defaultOpacityPlugin.captureAuthoredValue({
        authoredInputs: { style: { opacity: 0.75 } },
      }),
    ).toBe(0.75)
    expect(
      defaultOpacityPlugin.captureAuthoredValue({
        authoredInputs: {},
      }),
    ).toBeUndefined()
  })

  test('prefers authored terminal ownership when an explicit authored opacity exists', () => {
    expect(
      defaultOpacityPlugin.resolveTerminalOwner({
        authoredValue: 0.75,
      }),
    ).toBe('authored')
    expect(
      defaultOpacityPlugin.resolveTerminalOwner({
        authoredValue: undefined,
      }),
    ).toBe('native')
  })

  test('omits inner DOM opacity while native playback suppresses the field or keeps terminal control', () => {
    expect(
      defaultOpacityPlugin.resolveInnerStyle({
        suppressed: true,
        owner: null,
        authoredValue: 0.75,
        rawValue: 0.4,
      }),
    ).toEqual({ mode: 'omit' })
    expect(
      defaultOpacityPlugin.resolveInnerStyle({
        suppressed: false,
        owner: 'native',
        authoredValue: undefined,
        rawValue: 0.4,
      }),
    ).toEqual({ mode: 'omit' })
  })

  test('restores authored inner DOM opacity when authored ownership wins terminal handoff', () => {
    expect(
      defaultOpacityPlugin.resolveInnerStyle({
        suppressed: false,
        owner: 'authored',
        authoredValue: 0.75,
        rawValue: 0.4,
      }),
    ).toEqual({ mode: 'set', value: 0.75 })
  })

  test('neutralizes outer native opacity for authored handoff and keeps native terminal opacity otherwise', () => {
    expect(
      defaultOpacityPlugin.resolveOuterSync({
        owner: 'authored',
        authoredValue: 0.75,
        domValue: 0.4,
      }),
    ).toEqual({ mode: 'set', value: 1 })
    expect(
      defaultOpacityPlugin.resolveOuterSync({
        owner: 'native',
        authoredValue: undefined,
        domValue: 0.4,
      }),
    ).toEqual({ mode: 'omit' })
    expect(
      defaultOpacityPlugin.resolveOuterSync({
        owner: null,
        authoredValue: undefined,
        domValue: 0.4,
      }),
    ).toEqual({ mode: 'default' })
  })
})
