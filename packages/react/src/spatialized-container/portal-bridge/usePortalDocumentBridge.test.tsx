import { render } from '@testing-library/react'
import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { PortalInstanceObject } from '../context/PortalInstanceContext'
import { usePortalDocumentBridge } from './usePortalDocumentBridge'
import { createFakePortalWindow } from './testUtils'

type RegisterParams = {
  windowProxy: WindowProxy
  getPlaceholder: () => HTMLElement | null
}

const unregisterMock = vi.fn()
const registerMock = vi.fn((_params: RegisterParams) => unregisterMock)

vi.mock('./registry', () => ({
  registerPortalDocumentBridge: (params: RegisterParams) =>
    registerMock(params),
}))

function Harness(props: {
  windowProxy: WindowProxy | null
  portalInstanceObject: PortalInstanceObject | null
}) {
  usePortalDocumentBridge(props.windowProxy, props.portalInstanceObject)
  return null
}

function createPortalInstanceObjectMock(overrides: {
  dom?: HTMLElement
  queriedDom?: HTMLElement
}) {
  return {
    spatialId: 'spatial-1',
    dom: overrides.dom,
    spatializedContainerObject: {
      querySpatialDomBySpatialId: vi.fn(() => overrides.queriedDom),
    },
  } as unknown as PortalInstanceObject
}

describe('usePortalDocumentBridge', () => {
  afterEach(() => {
    registerMock.mockClear()
    unregisterMock.mockClear()
  })

  it('registers on mount and unregisters on unmount', () => {
    const { windowProxy } = createFakePortalWindow()
    const portalInstanceObject = createPortalInstanceObjectMock({})

    const { unmount } = render(
      <Harness
        windowProxy={windowProxy}
        portalInstanceObject={portalInstanceObject}
      />,
    )

    expect(registerMock).toHaveBeenCalledTimes(1)
    expect(registerMock.mock.calls[0][0]).toMatchObject({ windowProxy })
    expect(unregisterMock).not.toHaveBeenCalled()

    unmount()
    expect(unregisterMock).toHaveBeenCalledTimes(1)
  })

  it('resolves the placeholder lazily from the cached dom with query fallback', () => {
    const { windowProxy } = createFakePortalWindow()
    const cachedDom = document.createElement('div')
    const queriedDom = document.createElement('span')

    const withoutCache = createPortalInstanceObjectMock({ queriedDom })
    render(
      <Harness windowProxy={windowProxy} portalInstanceObject={withoutCache} />,
    )
    const lazyGetter = registerMock.mock.calls[0][0].getPlaceholder
    expect(lazyGetter()).toBe(queriedDom)

    // The getter re-reads portalInstanceObject.dom on every call, so a
    // late-arriving cache takes precedence over the query fallback.
    Object.defineProperty(withoutCache, 'dom', {
      configurable: true,
      get: () => cachedDom,
    })
    expect(lazyGetter()).toBe(cachedDom)
  })

  it('does not register without a windowProxy or portal instance', () => {
    const portalInstanceObject = createPortalInstanceObjectMock({})
    const { windowProxy } = createFakePortalWindow()

    render(
      <Harness
        windowProxy={null}
        portalInstanceObject={portalInstanceObject}
      />,
    )
    render(<Harness windowProxy={windowProxy} portalInstanceObject={null} />)

    expect(registerMock).not.toHaveBeenCalled()
  })
})
