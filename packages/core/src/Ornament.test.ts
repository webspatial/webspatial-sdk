import { describe, expect, it } from 'vitest'
import {
  DEFAULT_ORNAMENT_OPTIONS,
  normalizeOrnamentOptions,
  serializeOrnamentOptionsForProtocol,
} from './Ornament'

describe('Ornament options', () => {
  it('applies documented defaults', () => {
    expect(normalizeOrnamentOptions()).toEqual(DEFAULT_ORNAMENT_OPTIONS)
  })

  it('rejects top-center attachment anchors while preserving valid content alignment', () => {
    expect(
      normalizeOrnamentOptions({
        attachmentAnchor: 'top',
        contentAlignment: 'top',
      }),
    ).toMatchObject({
      attachmentAnchor: 'bottom',
      contentAlignment: 'top',
    })

    expect(
      normalizeOrnamentOptions({
        attachmentAnchor: 'topFront',
        contentAlignment: 'topFront',
      }),
    ).toMatchObject({
      attachmentAnchor: 'bottom',
      contentAlignment: 'topFront',
    })
  })

  it('recovers invalid visibility and size values', () => {
    expect(
      normalizeOrnamentOptions({
        visibility: 'collapsed' as any,
        width: 0,
        height: Number.NaN,
      }),
    ).toMatchObject({
      visibility: 'visible',
      width: 200,
      height: 150,
    })
  })

  it('normalizes corner radius and background material', () => {
    expect(
      normalizeOrnamentOptions({
        cornerRadius: {
          topLeading: 12,
          topTrailing: -1,
          bottomLeading: Number.NaN,
          bottomTrailing: 24,
        },
        backgroundMaterial: 'thin',
      }),
    ).toMatchObject({
      cornerRadius: {
        topLeading: 12,
        topTrailing: 0,
        bottomLeading: 0,
        bottomTrailing: 24,
      },
      backgroundMaterial: 'thin',
    })

    expect(
      normalizeOrnamentOptions({
        backgroundMaterial: 'invalid' as any,
      }),
    ).toMatchObject({
      backgroundMaterial: 'none',
    })
  })

  it('serializes corner radius for create protocol query params', () => {
    const options = normalizeOrnamentOptions({
      cornerRadius: {
        topLeading: 8,
        topTrailing: 10,
        bottomLeading: 12,
        bottomTrailing: 14,
      },
      backgroundMaterial: 'regular',
    })

    expect(serializeOrnamentOptionsForProtocol(options)).toMatchObject({
      cornerRadius:
        '{"topLeading":8,"bottomLeading":12,"topTrailing":10,"bottomTrailing":14}',
      backgroundMaterial: 'regular',
    })
  })
})
