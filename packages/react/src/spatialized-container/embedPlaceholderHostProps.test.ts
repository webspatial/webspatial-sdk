import { describe, expect, it } from 'vitest'

import { embedPlaceholderHostProps } from './embedPlaceholderHostProps'

describe('embedPlaceholderHostProps', () => {
  it('leaves non-embed hosts unchanged', () => {
    const rest = { src: 'duck.glb', type: 'model/gltf-binary', className: 'x' }
    expect(embedPlaceholderHostProps('div', rest)).toBe(rest)
    expect(embedPlaceholderHostProps('section', rest)).toEqual(rest)
  })

  it('forces empty src on embed and drops Model src/type from the host', () => {
    expect(
      embedPlaceholderHostProps('embed', {
        src: 'https://example.test/duck.glb',
        type: 'model/gltf-binary',
        className: 'slot',
        style: { width: '80px' },
      }),
    ).toEqual({
      className: 'slot',
      style: { width: '80px' },
      src: '',
    })
  })

  it('still sets empty src when embed has no Model src', () => {
    expect(embedPlaceholderHostProps('embed', { id: 'slot-a' })).toEqual({
      id: 'slot-a',
      src: '',
    })
  })
})
