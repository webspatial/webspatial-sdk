// Acceptance matrix: degraded paths MUST strip `onSpatialContentReady` and never invoke it.

import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { InsideAttachmentContext } from '../reality/context/InsideAttachmentContext'

vi.mock('../utils/getSession', () => ({
  getSession: () => ({}),
}))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('SpatializedContainer attachment-degraded path', () => {
  it('does NOT invoke onSpatialContentReady or leak it as a DOM attribute', async () => {
    const { SpatializedContainer } = await import('./SpatializedContainer')
    const onSpatialContentReady = vi.fn()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const view = render(
      <InsideAttachmentContext.Provider value={true}>
        {React.createElement(SpatializedContainer, {
          component: 'div',
          'data-testid': 'attachment-host',
          onSpatialContentReady,
        } as any)}
      </InsideAttachmentContext.Provider>,
    )

    const el = view.container.querySelector('[data-testid="attachment-host"]')
    expect(el).toBeTruthy()
    expect(el?.getAttribute('onSpatialContentReady')).toBeNull()
    expect(onSpatialContentReady).not.toHaveBeenCalled()
    expect(warn).toHaveBeenCalled()

    view.unmount()
    expect(onSpatialContentReady).not.toHaveBeenCalled()
    warn.mockRestore()
  })
})
