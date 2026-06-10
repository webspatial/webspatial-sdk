import { describe, expect, it } from 'vitest'
import { isFloatingOverlayContent } from './overlayDetection'

// Scenario 3 overlay detection: a nested `enable-xr` becomes an overlay child
// surface only when a floating UI library portaled it out of the parent content
// tree. These tests guard against the false-positive risk: ordinary nested
// SpatialDivs (incl. absolute/fixed positioned ones) must NOT be detected as
// overlays.
describe('isFloatingOverlayContent', () => {
  it('detects Radix dropdown content props (role + data-side)', () => {
    expect(
      isFloatingOverlayContent({
        component: 'div',
        role: 'menu',
        'data-side': 'bottom',
        'data-align': 'end',
        'data-state': 'open',
        children: 'items',
      }),
    ).toBe(true)
  })

  it('detects floating CSS custom properties on style', () => {
    expect(
      isFloatingOverlayContent({
        component: 'div',
        style: { '--radix-popper-transform-origin': 'center top' },
      }),
    ).toBe(true)
  })

  it('detects data-radix-* / data-floating-ui-* attributes', () => {
    expect(isFloatingOverlayContent({ 'data-radix-menu-content': '' })).toBe(
      true,
    )
    expect(isFloatingOverlayContent({ 'data-floating-ui-portal': '' })).toBe(
      true,
    )
  })

  it('does NOT detect an ordinary nested SpatialDiv', () => {
    expect(
      isFloatingOverlayContent({
        component: 'div',
        className: 'panel',
        style: { width: '200px', height: '100px' },
        children: 'content',
      }),
    ).toBe(false)
  })

  it('does NOT detect role alone without a floating positioning signal', () => {
    expect(isFloatingOverlayContent({ component: 'div', role: 'menu' })).toBe(
      false,
    )
    expect(isFloatingOverlayContent({ component: 'div', role: 'dialog' })).toBe(
      false,
    )
    expect(
      isFloatingOverlayContent({
        component: 'div',
        role: 'menu',
        style: { width: '200px' },
      }),
    ).toBe(false)
  })

  it('does NOT detect a positioned (absolute/fixed) nested SpatialDiv', () => {
    expect(
      isFloatingOverlayContent({
        component: 'div',
        style: { position: 'absolute', top: '10px', left: '20px' },
      }),
    ).toBe(false)
    expect(
      isFloatingOverlayContent({
        component: 'div',
        style: { position: 'fixed', inset: '0' },
      }),
    ).toBe(false)
  })
})
