import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { act, render } from '@testing-library/react'
import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { getSpatialPortalContainerContext } from '../../useSpatialPortalContainer'
import { useSpatialPortalContainer } from '../../useSpatialPortalContainer'
import { createFakePortalWindow } from './testUtils'

/**
 * Real @radix-ui/react-dropdown-menu (test-only devDependency) submenu
 * scenario: a dropdown whose trigger lives INSIDE a spatial panel. Without
 * a container override, Radix portals Content/SubContent to the HOST
 * document.body — the wrong document (renders on the flat page behind the
 * panel) and the wrong coordinate space. With
 * `container={useSpatialPortalContainer()}` passed to each
 * DropdownMenu.Portal, the menu and submenu render inside the panel's own
 * document.
 *
 * The panel harness below replicates exactly what `SpatializedContent`
 * does in production: provide the panel body via the globalThis-anchored
 * context, then `createPortal` the subtree into the panel document.
 */

const CONTEXT_KEY = '__WEBSPATIAL_PORTAL_CONTAINER_CONTEXT__'

function SpatialPanelSim(props: {
  portalDocument: Document
  children: React.ReactNode
}) {
  const Context = getSpatialPortalContainerContext()
  return createPortal(
    <Context.Provider value={props.portalDocument.body}>
      {props.children}
    </Context.Provider>,
    props.portalDocument.body,
  )
}

function FruitMenu(props: {
  onOpenChange: (open: boolean) => void
  onSelect: (value: string) => void
  useContainer: boolean
}) {
  const spatialContainer = useSpatialPortalContainer()
  const container = props.useContainer ? spatialContainer : undefined
  const [open, setOpen] = useState(true)
  return (
    <DropdownMenu.Root
      open={open}
      onOpenChange={next => {
        setOpen(next)
        props.onOpenChange(next)
      }}
    >
      <DropdownMenu.Trigger data-testid="trigger">Fruit</DropdownMenu.Trigger>
      <DropdownMenu.Portal container={container}>
        <DropdownMenu.Content data-testid="menu-content">
          <DropdownMenu.Item onSelect={() => props.onSelect('apple')}>
            Apple
          </DropdownMenu.Item>
          <DropdownMenu.Sub open>
            <DropdownMenu.SubTrigger data-testid="sub-trigger">
              More fruit
            </DropdownMenu.SubTrigger>
            <DropdownMenu.Portal container={container}>
              <DropdownMenu.SubContent data-testid="sub-content">
                <DropdownMenu.Item onSelect={() => props.onSelect('cherry')}>
                  Cherry
                </DropdownMenu.Item>
              </DropdownMenu.SubContent>
            </DropdownMenu.Portal>
          </DropdownMenu.Sub>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

describe('real Radix DropdownMenu submenu inside a spatial panel', () => {
  beforeAll(() => {
    // Radix popper (floating-ui autoUpdate) requires ResizeObserver, which
    // jsdom does not implement.
    if (typeof globalThis.ResizeObserver === 'undefined') {
      globalThis.ResizeObserver = class {
        observe() {}
        unobserve() {}
        disconnect() {}
      } as unknown as typeof ResizeObserver
    }
  })

  afterEach(() => {
    delete (globalThis as Record<string, unknown>)[CONTEXT_KEY]
    document.body.innerHTML = ''
  })

  async function setup(useContainer: boolean) {
    const onOpenChange = vi.fn()
    const onSelect = vi.fn()
    const { portalDocument } = createFakePortalWindow()

    render(
      <SpatialPanelSim portalDocument={portalDocument}>
        <FruitMenu
          onOpenChange={onOpenChange}
          onSelect={onSelect}
          useContainer={useContainer}
        />
      </SpatialPanelSim>,
    )

    // DismissableLayer attaches document listeners in setTimeout(0).
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 5))
    })

    return { onOpenChange, onSelect, portalDocument }
  }

  it('renders Content AND SubContent inside the panel document with the container override', async () => {
    const { portalDocument } = await setup(true)

    const content = portalDocument.querySelector('[data-testid="menu-content"]')
    const subContent = portalDocument.querySelector(
      '[data-testid="sub-content"]',
    )
    expect(content).not.toBeNull()
    expect(subContent).not.toBeNull()
    expect(content!.ownerDocument).toBe(portalDocument)
    expect(subContent!.ownerDocument).toBe(portalDocument)

    // Nothing menu-related leaked onto the host page.
    expect(document.querySelector('[data-testid="menu-content"]')).toBeNull()
    expect(document.querySelector('[data-testid="sub-content"]')).toBeNull()
  })

  it('without the override, SubContent lands on the host body (the documented limitation)', async () => {
    const { portalDocument } = await setup(false)

    // Trigger renders in the panel...
    expect(
      portalDocument.querySelector('[data-testid="trigger"]'),
    ).not.toBeNull()
    // ...but the menu content is portaled to the HOST document - wrong
    // document and coordinate space for a trigger inside the panel.
    const subContent = document.querySelector('[data-testid="sub-content"]')
    expect(subContent).not.toBeNull()
    expect(subContent!.ownerDocument).toBe(document)
  })

  it('Escape inside the panel closes the menu (ownerDocument-scoped listeners)', async () => {
    const { onOpenChange, portalDocument } = await setup(true)

    // With the menu content living in the panel document, Radix registers
    // its Escape listener on that document directly - no bridge mirroring
    // involved on this path.
    await act(async () => {
      portalDocument
        .querySelector('[data-testid="menu-content"]')!
        .dispatchEvent(
          new KeyboardEvent('keydown', {
            key: 'Escape',
            bubbles: true,
            cancelable: true,
          }),
        )
    })

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('selecting the submenu item works inside the panel document', async () => {
    const { onSelect, portalDocument } = await setup(true)

    const cherry = Array.from(
      portalDocument.querySelectorAll('[role="menuitem"]'),
    ).find(el => el.textContent === 'Cherry')!
    expect(cherry).toBeTruthy()

    await act(async () => {
      cherry.dispatchEvent(
        new MouseEvent('pointerdown', { bubbles: true, cancelable: true }),
      )
      cherry.dispatchEvent(
        new MouseEvent('pointerup', { bubbles: true, cancelable: true }),
      )
      cherry.dispatchEvent(
        new MouseEvent('click', { bubbles: true, cancelable: true }),
      )
    })

    expect(onSelect).toHaveBeenCalledWith('cherry')
  })
})
