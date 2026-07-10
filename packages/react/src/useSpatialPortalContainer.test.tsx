import { render, screen } from '@testing-library/react'
import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  getSpatialPortalContainerContext,
  useSpatialPortalContainer,
} from './useSpatialPortalContainer'

const CONTEXT_KEY = '__WEBSPATIAL_PORTAL_CONTAINER_CONTEXT__'

function Probe() {
  const container = useSpatialPortalContainer()
  return (
    <div data-testid="probe">
      {container ? (container.tagName ?? 'element') : 'null'}
    </div>
  )
}

describe('useSpatialPortalContainer', () => {
  afterEach(() => {
    delete (globalThis as Record<string, unknown>)[CONTEXT_KEY]
    document.body.innerHTML = ''
    vi.resetModules()
  })

  it('returns null outside spatialized content (plain web / SSR-safe default)', () => {
    render(<Probe />)
    expect(screen.getByTestId('probe').textContent).toBe('null')
  })

  it('returns the provided portal container inside the provider', () => {
    const portalDocument = document.implementation.createHTMLDocument()
    const Context = getSpatialPortalContainerContext()
    render(
      <Context.Provider value={portalDocument.body}>
        <Probe />
      </Context.Provider>,
    )
    expect(screen.getByTestId('probe').textContent).toBe('BODY')
  })

  it('shares one context identity across duplicate SDK module instances', async () => {
    const first = getSpatialPortalContainerContext()

    // Simulate a second SDK copy (HMR / linked package): fresh module
    // instance, same globalThis.
    vi.resetModules()
    const secondCopy = await import('./useSpatialPortalContainer')
    expect(secondCopy.getSpatialPortalContainerContext).not.toBe(
      getSpatialPortalContainerContext,
    )
    expect(secondCopy.getSpatialPortalContainerContext()).toBe(first)

    // Provider from copy 1, consumer hook from copy 2 — must connect.
    const portalDocument = document.implementation.createHTMLDocument()
    function SecondCopyProbe() {
      const container = secondCopy.useSpatialPortalContainer()
      return <div data-testid="probe2">{container ? 'connected' : 'null'}</div>
    }
    render(
      <first.Provider value={portalDocument.body}>
        <SecondCopyProbe />
      </first.Provider>,
    )
    expect(screen.getByTestId('probe2').textContent).toBe('connected')
  })
})
