/* @vitest-environment jsdom */

import React from 'react'
import { act, cleanup, render, waitFor } from '@testing-library/react'
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
  it.each(['HTTP 404: texture not found', 'Failed to decode texture image'])(
    'reports a bridge failure through onError: %s',
    async errorMessage => {
      const view = await mountLoadedTexture()
      mocks.texture.updateProperties.mockResolvedValue({
        success: false,
        errorMessage,
      })

      view.reload('/invalid.png')

      await waitFor(() => expect(view.onError).toHaveBeenCalledTimes(1))
      expect(view.onError).toHaveBeenCalledWith(new Error(errorMessage))
      expect(view.onLoad).not.toHaveBeenCalled()
      expect(mocks.resourceRegistry.notify).not.toHaveBeenCalled()
      expect(mocks.session.createTexture).toHaveBeenCalledTimes(1)
      expect(mocks.texture.destroy).not.toHaveBeenCalled()
    },
  )

  it('uses a fallback message when the bridge provides an empty message', async () => {
    const view = await mountLoadedTexture()
    mocks.texture.updateProperties.mockResolvedValue({
      success: false,
      errorMessage: '',
    })

    view.reload('/invalid.png')

    await waitFor(() => expect(view.onError).toHaveBeenCalledTimes(1))
    expect(view.onError).toHaveBeenCalledWith(
      new Error('Failed to update texture URL'),
    )
    expect(view.onLoad).not.toHaveBeenCalled()
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

  it('continues to report rejected reload promises through onError', async () => {
    const view = await mountLoadedTexture()
    const error = new Error('Bridge transport failed')
    mocks.texture.updateProperties.mockRejectedValue(error)

    view.reload('/invalid.png')

    await waitFor(() => expect(view.onError).toHaveBeenCalledTimes(1))
    expect(view.onError).toHaveBeenCalledWith(error)
    expect(view.onLoad).not.toHaveBeenCalled()
    expect(mocks.resourceRegistry.notify).not.toHaveBeenCalled()
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

  it.each([true, false])(
    'ignores an obsolete reload completion with success=%s',
    async success => {
      const view = await mountLoadedTexture()
      let completeOld!: (result: {
        success: boolean
        errorMessage?: string
      }) => void
      mocks.texture.updateProperties.mockReturnValueOnce(
        new Promise(resolve => {
          completeOld = resolve
        }),
      )

      view.reload('/slow.png')
      view.reload('/latest.png')
      await waitFor(() => expect(view.onLoad).toHaveBeenCalledTimes(1))

      await act(async () => {
        completeOld({ success, errorMessage: 'Obsolete failure' })
      })

      expect(view.onLoad).toHaveBeenCalledTimes(1)
      expect(view.onError).not.toHaveBeenCalled()
      expect(mocks.resourceRegistry.notify).toHaveBeenCalledTimes(1)
    },
  )

  it('does not call callbacks after unmount during a failed reload', async () => {
    const view = await mountLoadedTexture()
    let complete!: (result: { success: boolean; errorMessage: string }) => void
    mocks.texture.updateProperties.mockReturnValueOnce(
      new Promise(resolve => {
        complete = resolve
      }),
    )
    view.reload('/slow.png')
    view.unmount()

    await act(async () => {
      complete({ success: false, errorMessage: 'Late failure' })
    })

    expect(view.onLoad).not.toHaveBeenCalled()
    expect(view.onError).not.toHaveBeenCalled()
    expect(mocks.resourceRegistry.notify).not.toHaveBeenCalled()
    expect(mocks.resourceRegistry.removeAndDestroy).toHaveBeenCalledWith(
      'texture',
    )
  })

  it('handles a failed reload when onError is omitted', async () => {
    const onLoad = vi.fn()
    const view = render(
      <Texture id="texture" url="/valid.png" onLoad={onLoad} />,
    )
    await waitFor(() => expect(onLoad).toHaveBeenCalledTimes(1))
    onLoad.mockClear()
    mocks.texture.updateProperties.mockResolvedValue({
      success: false,
      errorMessage: 'Failed to update texture URL',
    })

    await act(async () => {
      view.rerender(<Texture id="texture" url="/invalid.png" onLoad={onLoad} />)
    })

    expect(mocks.texture.updateProperties).toHaveBeenCalledTimes(1)
    expect(onLoad).not.toHaveBeenCalled()
  })

  it('preserves initial texture creation error handling', async () => {
    const error = new Error('Failed to load texture')
    mocks.session.createTexture.mockRejectedValue(error)
    const onLoad = vi.fn()
    const onError = vi.fn()

    render(
      <Texture
        id="texture"
        url="/invalid.png"
        onLoad={onLoad}
        onError={onError}
      />,
    )

    await waitFor(() => expect(onError).toHaveBeenCalledTimes(1))
    expect(onError).toHaveBeenCalledWith(error)
    expect(onLoad).not.toHaveBeenCalled()
    expect(mocks.texture.updateProperties).not.toHaveBeenCalled()
  })
})
