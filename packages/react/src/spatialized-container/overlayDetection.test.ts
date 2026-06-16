import { describe, expect, it } from 'vitest'
import { isSpatialOverlayContent } from './overlayDetection'

// Scenario 3 / 5 overlay detection is an explicit, declarative opt-in via the
// `data-xr-overlay` marker. It is deliberately decoupled from any floating
// library: Radix-specific props must NOT be enough to trigger overlay mode, and
// ordinary nested SpatialDivs (incl. absolute/fixed) must never be detected.
describe('isSpatialOverlayContent', () => {
  it('detects the explicit data-xr-overlay marker (boolean attribute)', () => {
    expect(isSpatialOverlayContent({ 'data-xr-overlay': true })).toBe(true)
    expect(isSpatialOverlayContent({ 'data-xr-overlay': '' })).toBe(true)
    expect(isSpatialOverlayContent({ 'data-xr-overlay': 'overlay' })).toBe(true)
  })

  it('does NOT detect when the marker is absent', () => {
    expect(
      isSpatialOverlayContent({
        component: 'div',
        className: 'panel',
        style: { width: '200px', height: '100px' },
        children: 'content',
      }),
    ).toBe(false)
  })

  it('does NOT detect from Radix/floating-library props alone (no marker)', () => {
    expect(
      isSpatialOverlayContent({
        component: 'div',
        role: 'menu',
        'data-side': 'bottom',
        'data-align': 'end',
        'data-state': 'open',
        'data-radix-menu-content': '',
        style: { '--radix-popper-transform-origin': 'center top' },
      }),
    ).toBe(false)
  })

  it('does NOT detect a positioned (absolute/fixed) nested SpatialDiv', () => {
    expect(
      isSpatialOverlayContent({
        component: 'div',
        style: { position: 'absolute', top: '10px', left: '20px' },
      }),
    ).toBe(false)
    expect(
      isSpatialOverlayContent({
        component: 'div',
        style: { position: 'fixed', inset: '0' },
      }),
    ).toBe(false)
  })

  it('treats explicitly false marker values as not an overlay', () => {
    expect(isSpatialOverlayContent({ 'data-xr-overlay': false })).toBe(false)
    expect(isSpatialOverlayContent({ 'data-xr-overlay': 'false' })).toBe(false)
    expect(isSpatialOverlayContent({ 'data-xr-overlay': null })).toBe(false)
    expect(isSpatialOverlayContent({ 'data-xr-overlay': undefined })).toBe(
      false,
    )
  })
})
