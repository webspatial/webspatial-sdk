import { render } from '@testing-library/react'
import React, { useEffect, useRef } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  __portalBridgeTest__,
  armPortalBridgeInterception,
  registerPortalDocumentBridge,
} from './registry'
import { createFakePortalWindow } from './testUtils'

/**
 * Faithful mock of Radix's DismissableLayer dismissal logic (Radix itself is
 * not a dependency of this repo). Like the real implementation it:
 * - listens for `pointerdown` on the owner document in the capture phase and
 *   treats the press as "outside" when `!node.contains(event.target)`
 * - listens for `keydown` and dismisses on Escape
 * - does NOT check `event.isTrusted`, so retargeting the mirrored event onto
 *   the placeholder is sufficient — no synthetic-trust hacks are needed.
 */
function MockDismissableLayer(props: {
  onDismiss: () => void
  children: React.ReactNode
}) {
  const { onDismiss, children } = props
  const nodeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ownerDocument = nodeRef.current!.ownerDocument
    const handlePointerDown = (event: Event) => {
      const node = nodeRef.current
      if (node && !node.contains(event.target as Node)) {
        onDismiss()
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onDismiss()
      }
    }
    ownerDocument.addEventListener('pointerdown', handlePointerDown, {
      capture: true,
    })
    ownerDocument.addEventListener('keydown', handleKeyDown)
    return () => {
      ownerDocument.removeEventListener('pointerdown', handlePointerDown, {
        capture: true,
      })
      ownerDocument.removeEventListener('keydown', handleKeyDown)
    }
  }, [onDismiss])

  return <div ref={nodeRef}>{children}</div>
}

describe('DismissableLayer-style fixture over the portal bridge', () => {
  afterEach(() => {
    __portalBridgeTest__.reset()
    document.body.innerHTML = ''
  })

  function setup() {
    const onDismiss = vi.fn()
    const { windowProxy, portalDocument } = createFakePortalWindow()
    const button = portalDocument.createElement('button')
    portalDocument.body.appendChild(button)

    // Realistic Radix Dialog sequence for a dialog whose content wraps a
    // `<div enable-xr>` panel:
    // 1. the spatialized container's mount effect arms the interception
    //    (child effects run before ancestor effects in the same commit),
    // 2. DismissableLayer's effect adds its document listeners,
    // 3. the portal registers with the bridge only later, after async
    //    native element creation, and replays the recorded listeners.
    armPortalBridgeInterception()

    // Host tree: the dialog "Content" subtree contains the spatial
    // placeholder, exactly like a Radix Dialog.Content wrapping a
    // `<div enable-xr>` panel.
    const { container } = render(
      <MockDismissableLayer onDismiss={onDismiss}>
        <div data-testid="placeholder" />
      </MockDismissableLayer>,
    )
    const placeholder = container.querySelector(
      '[data-testid="placeholder"]',
    ) as HTMLElement

    const unregister = registerPortalDocumentBridge({
      windowProxy,
      getPlaceholder: () => placeholder,
    })

    return { onDismiss, placeholder, portalDocument, button, unregister }
  }

  it('does not dismiss on pointerdown inside the spatial portal', () => {
    const { onDismiss, button } = setup()

    button.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }))

    expect(onDismiss).not.toHaveBeenCalled()
  })

  it('dismisses on Escape pressed inside the spatial portal', () => {
    const { onDismiss, portalDocument } = setup()

    portalDocument.body.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    )

    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('still dismisses on pointerdown outside the content in the host document', () => {
    const { onDismiss } = setup()
    const outside = document.createElement('div')
    document.body.appendChild(outside)

    outside.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }))

    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('stops bridging after the portal unregisters', () => {
    const { onDismiss, portalDocument, unregister } = setup()
    unregister()

    portalDocument.body.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    )

    expect(onDismiss).not.toHaveBeenCalled()
  })
})
