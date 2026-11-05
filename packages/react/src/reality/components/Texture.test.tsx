/* @vitest-environment jsdom */

import React from 'react'
import { cleanup, render, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Texture } from './Texture'

const mocks = vi.hoisted(() => {
  const texture = {
    id: 'native-texture',
    updateProperties: vi.fn(),
    destroy: vi.fn(),
  }
  const session = { createTexture: vi.fn() }
  const resourceRegistry = {
    add: vi.fn(),
    notify: vi.fn(),
    removeAndDestroy: vi.fn(),
  }
  return {
    texture,
    session,
    resourceRegistry,
    // A mounted Reality keeps the context identity stable across renders.
    context: { session, resourceRegistry },
  }
})

vi.mock('../context', () => ({
  useRealityContext: () => mocks.context,
}))

beforeEach(() => {
  vi.resetAllMocks()
  mocks.session.createTexture.mockResolvedValue(mocks.texture)
  mocks.texture.updateProperties.mockResolvedValue({ success: true })
})

afterEach(cleanup)

async function mountLoadedTexture() {
  const onLoad = vi.fn()
  const onError = vi.fn()
  const props = { id: 'texture', onLoad, onError }
  const view = render(<Texture {...props} url="/valid.png" />)
  await waitFor(() => expect(onLoad).toHaveBeenCalledTimes(1))
  onLoad.mockClear()
  mocks.resourceRegistry.notify.mockClear()
  return {
    ...view,
    onLoad,
    onError,
    reload: (url: string) => view.rerender(<Texture {...props} url={url} />),
  }
}

describe('Texture reload callbacks', () => {
  it('reports a failed URL update through onError', async () => {
    const view = await mountLoadedTexture()
    mocks.texture.updateProperties.mockResolvedValue({
      success: false,
      errorMessage: 'HTTP 404: texture not found',
    })

    view.reload('/invalid.png')

    await waitFor(() => expect(view.onError).toHaveBeenCalledTimes(1))
    expect(view.onError).toHaveBeenCalledWith(
      new Error('HTTP 404: texture not found'),
    )
    expect(view.onLoad).not.toHaveBeenCalled()
    expect(mocks.resourceRegistry.notify).not.toHaveBeenCalled()
    expect(mocks.session.createTexture).toHaveBeenCalledTimes(1)
    expect(mocks.texture.destroy).not.toHaveBeenCalled()
  })

  it('notifies resource subscribers and calls onLoad after a successful reload', async () => {
    const view = await mountLoadedTexture()

    view.reload('/replacement.png')

    await waitFor(() => expect(view.onLoad).toHaveBeenCalledTimes(1))
    expect(view.onError).not.toHaveBeenCalled()
    expect(mocks.resourceRegistry.notify).toHaveBeenCalledTimes(1)
    expect(mocks.resourceRegistry.notify).toHaveBeenCalledWith('texture')
    expect(mocks.texture.updateProperties).toHaveBeenCalledWith({
      url: new URL('/replacement.png', window.location.href).href,
    })
    expect(mocks.session.createTexture).toHaveBeenCalledTimes(1)
  })

  it('recovers on a later successful reload without recreating the texture', async () => {
    const view = await mountLoadedTexture()
    mocks.texture.updateProperties.mockResolvedValueOnce({
      success: false,
      errorMessage: 'Failed to update texture URL',
    })
    view.reload('/invalid.png')
    await waitFor(() => expect(view.onError).toHaveBeenCalledTimes(1))

    view.reload('/recovered.png')

    await waitFor(() => expect(view.onLoad).toHaveBeenCalledTimes(1))
    expect(view.onError).toHaveBeenCalledTimes(1)
    expect(mocks.resourceRegistry.notify).toHaveBeenCalledTimes(1)
    expect(mocks.session.createTexture).toHaveBeenCalledTimes(1)
    expect(mocks.texture.updateProperties).toHaveBeenCalledTimes(2)
  })
})
