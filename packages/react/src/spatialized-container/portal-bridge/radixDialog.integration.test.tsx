import * as Dialog from '@radix-ui/react-dialog'
import { act, render, screen } from '@testing-library/react'
import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  __portalBridgeTest__,
  armPortalBridgeInterception,
  registerPortalDocumentBridge,
} from './registry'
import { createFakePortalWindow } from './testUtils'

/**
 * Integration test against the REAL @radix-ui/react-dialog (devDependency,
 * test-only), exercising the actual DismissableLayer code path instead of
 * the mock in dismissableLayer.fixture.test.tsx.
 *
 * Verified against @radix-ui/react-dismissable-layer 1.1.15 dist: it does
 * NOT check `event.isTrusted` anywhere, so retargeting mirrored events onto
 * the placeholder is sufficient. Its dismissal machinery is:
 * - Escape: capture-phase `keydown` on `ownerDocument` (mirrored).
 * - Outside press: a document-level `pointerdown` listener (attached in a
 *   `setTimeout(0)`, hence the timer flushes below) combined with an
 *   `onPointerDownCapture` REACT-tree handler that marks presses inside the
 *   layer. Because the SDK portals spatial content with `createPortal`, the
 *   React synthetic capture crosses the portal boundary and marks
 *   inside-panel presses as inside; the bridge then delivers the mirrored
 *   document event that consumes that mark.
 */

/**
 * Mimics SpatializedContent: the placeholder stays in the host-document
 * React tree (inside Dialog.Content), while the interactive panel content
 * is portaled into the child-webview document.
 */
function SpatialPanelSim(props: {
  portalDocument: Document
  placeholderRef: React.RefObject<HTMLDivElement>
}) {
  return (
    <>
      <div data-testid="placeholder" ref={props.placeholderRef} />
      {createPortal(
        <button type="button">inside spatial panel</button>,
        props.portalDocument.body,
      )}
    </>
  )
}

function RadixFixture(props: {
  portalDocument: Document
  placeholderRef: React.RefObject<HTMLDivElement>
  onOpenChange: (open: boolean) => void
}) {
  const [open, setOpen] = useState(true)
  return (
    <Dialog.Root
      open={open}
      onOpenChange={next => {
        setOpen(next)
        props.onOpenChange(next)
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay data-testid="overlay" />
        <Dialog.Content data-testid="content">
          <Dialog.Title>Spatial dialog</Dialog.Title>
          <Dialog.Description>
            Real Radix dialog wrapping a simulated spatial panel.
          </Dialog.Description>
          <SpatialPanelSim
            portalDocument={props.portalDocument}
            placeholderRef={props.placeholderRef}
          />
          <Dialog.Close>Close</Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

describe('real Radix Dialog over the portal bridge', () => {
  afterEach(() => {
    __portalBridgeTest__.reset()
    document.body.innerHTML = ''
  })

  async function setup() {
    const onOpenChange = vi.fn()
    const { windowProxy, portalDocument } = createFakePortalWindow()
    const placeholderRef = React.createRef<HTMLDivElement>()

    // Same ordering as production: the spatialized container arms the
    // interception in its mount effect before DismissableLayer's effects
    // add document listeners; the portal registers with the bridge later.
    armPortalBridgeInterception()

    const view = render(
      <RadixFixture
        portalDocument={portalDocument}
        placeholderRef={placeholderRef}
        onOpenChange={onOpenChange}
      />,
    )
    expect(screen.getByTestId('content')).toBeTruthy()

    const unregister = registerPortalDocumentBridge({
      windowProxy,
      getPlaceholder: () => placeholderRef.current,
    })

    // DismissableLayer attaches its document pointerdown listener inside
    // window.setTimeout(0).
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 5))
    })

    const portalButton = portalDocument.querySelector('button')!
    expect(portalButton).not.toBeNull()

    return { onOpenChange, portalDocument, portalButton, unregister, view }
  }

  it('does not dismiss on pointerdown inside the spatial portal', async () => {
    const { onOpenChange, portalButton } = await setup()

    await act(async () => {
      portalButton.dispatchEvent(
        new MouseEvent('pointerdown', { bubbles: true, cancelable: true }),
      )
    })

    expect(onOpenChange).not.toHaveBeenCalled()
    expect(screen.getByTestId('content')).toBeTruthy()
  })

  it('dismisses on Escape pressed inside the spatial portal', async () => {
    const { onOpenChange, portalDocument } = await setup()

    await act(async () => {
      portalDocument.body.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Escape',
          bubbles: true,
          cancelable: true,
        }),
      )
    })

    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(screen.queryByTestId('content')).toBeNull()
  })

  it('still dismisses on pointerdown+pointerup+click outside in the host document', async () => {
    const { onOpenChange } = await setup()
    const overlay = screen.getByTestId('overlay')

    // Radix dismisses outside presses via pointerdown outside the React
    // tree (the overlay is outside Content's tree), optionally waiting for
    // the paired click.
    await act(async () => {
      overlay.dispatchEvent(
        new MouseEvent('pointerdown', { bubbles: true, cancelable: true }),
      )
      overlay.dispatchEvent(
        new MouseEvent('pointerup', { bubbles: true, cancelable: true }),
      )
      overlay.dispatchEvent(
        new MouseEvent('click', { bubbles: true, cancelable: true }),
      )
      await new Promise(resolve => setTimeout(resolve, 5))
    })

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('keeps working for a second dialog opened after the portal unregisters', async () => {
    // Simulates closing and reopening: the bridge stays armed between
    // portal lifetimes, so a re-registered portal replays the reopened
    // dialog's listeners.
    const first = await setup()
    first.unregister()
    first.view.unmount()

    const { onOpenChange, portalDocument } = await setup()
    await act(async () => {
      portalDocument.body.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Escape',
          bubbles: true,
          cancelable: true,
        }),
      )
    })

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
