// @vitest-environment jsdom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@douyinfe/semi-ui', () => ({
  Modal: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="semi-modal">{children}</div>
  ),
}))

vi.mock('@webspatial/react-sdk', () => ({
  PortalSurface: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="portal-surface">{children}</div>
  ),
  useSpatialPortalContainer: () => document.body,
}))

import PortalSurfaceModalPage from '../src/pages/portal-surface-modal'

function getByText(root: HTMLElement, text: string): HTMLElement {
  const node = Array.from(root.querySelectorAll('*')).find(
    element => element.textContent === text,
  )
  if (!(node instanceof HTMLElement)) {
    throw new Error(`Unable to find text: ${text}`)
  }
  return node
}

describe('PortalSurfaceModalPage', () => {
  it('renders the nested demo PortalSurface inside the nested SpatialDiv owner', () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    let root: Root | undefined

    act(() => {
      root = createRoot(container)
      root.render(<PortalSurfaceModalPage />)
    })

    act(() => {
      getByText(container, 'Open From Nested Surface').click()
    })

    const nestedOwner = document.querySelector(
      '[data-name="portal-surface-modal-owner-parent"]',
    )
    const portalSurface = container.querySelector(
      '[data-testid="portal-surface"]',
    )

    expect(nestedOwner).not.toBeNull()
    expect(nestedOwner?.contains(portalSurface)).toBe(true)

    act(() => {
      root?.unmount()
    })
    container.remove()
  })
})
