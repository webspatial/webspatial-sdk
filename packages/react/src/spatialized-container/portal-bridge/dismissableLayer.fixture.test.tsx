import { render } from '@testing-library/react'
import React, { useEffect, useRef } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { __portalBridgeTest__, registerPortalDocumentBridge } from './registry'
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

    // The portal registers before the layer mounts: the bridge patches the
    // host document while at least one portal is active, so listeners the
    // layer adds afterwards are mirrored live. (Listeners added while NO
    // portal is registered are not recorded — a known Phase-1 limitation
    // that matters when the dialog's own panel is the first/only portal
    // and finishes its async registration after DismissableLayer's
    // effects. See the summary note in registry.ts teardown.)
    let placeholder: HTMLElement | null = null
    const unregister = registerPortalDocumentBridge({
      windowProxy,
      // Lazy resolution, like `portalInstanceObject.dom`: the placeholder
      // does not exist yet at registration time.
      getPlaceholder: () => placeholder,
    })

    // Host tree: the dialog "Content" subtree contains the spatial
    // placeholder, exactly like a Radix Dialog.Content wrapping a
    // `<div enable-xr>` panel.
    const { container } = render(
      <MockDismissableLayer onDismiss={onDismiss}>
        <div data-testid="placeholder" />
      </MockDismissableLayer>,
    )
    placeholder = container.querySelector(
      '[data-testid="placeholder"]',
    ) as HTMLElement

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
