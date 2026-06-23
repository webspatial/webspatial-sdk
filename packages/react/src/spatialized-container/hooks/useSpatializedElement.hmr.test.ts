import { act, render } from '@testing-library/react'
import React, { useMemo } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { useSpatializedElement } from './useSpatializedElement'

describe('useSpatializedElement HMR-style effect re-run', () => {
  it('keeps the live element until a replacement is attached', async () => {
    const attachSpatializedElement = vi.fn()
    const portalInstanceObject = { attachSpatializedElement } as any

    const first = { destroy: vi.fn(), id: 'first' } as any
    const second = { destroy: vi.fn(), id: 'second' } as any

    function Test({ generation }: { generation: number }) {
      const createSpatializedElement = useMemo(
        () =>
          generation === 0
            ? () => Promise.resolve(first)
            : () => Promise.resolve(second),
        [generation],
      )
      const el = useSpatializedElement(
        createSpatializedElement,
        portalInstanceObject,
      )
      return React.createElement('div', { 'data-id': (el as any)?.id ?? '' })
    }

    const r = render(React.createElement(Test, { generation: 0 }))

    await act(async () => {
      await Promise.resolve()
    })

    expect(r.container.querySelector('div')?.getAttribute('data-id')).toBe(
      'first',
    )
    expect(first.destroy).not.toHaveBeenCalled()

    await act(async () => {
      r.rerender(React.createElement(Test, { generation: 1 }))
      await Promise.resolve()
    })

    expect(first.destroy).toHaveBeenCalledTimes(1)
    expect(second.destroy).not.toHaveBeenCalled()
    expect(r.container.querySelector('div')?.getAttribute('data-id')).toBe(
      'second',
    )

    r.unmount()
    expect(second.destroy).toHaveBeenCalledTimes(1)
  })

  it('ignores rejected creation promises after cleanup', async () => {
    const attachSpatializedElement = vi.fn()
    const portalInstanceObject = { attachSpatializedElement } as any
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    let reject: ((error: Error) => void) | undefined
    const createSpatializedElement = vi.fn(
      () =>
        new Promise<any>((_resolve, rejectPromise) => {
          reject = rejectPromise
        }),
    )

    function Test() {
      useSpatializedElement(createSpatializedElement, portalInstanceObject)
      return null
    }

    const r = render(React.createElement(Test))
    r.unmount()

    await act(async () => {
      reject?.(new Error('stale create failed'))
      await Promise.resolve()
    })

    expect(attachSpatializedElement).not.toHaveBeenCalled()
    expect(errorSpy).not.toHaveBeenCalled()
    errorSpy.mockRestore()
  })
})
