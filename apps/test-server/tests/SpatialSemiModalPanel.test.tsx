import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { SpatialSemiModalLayer } from '../src/pages/spatial-semi-modal/components/SpatialSemiModalPanel'

describe('SpatialSemiModalLayer', () => {
  it('renders mask and dialog panel in one fullscreen spatial overlay surface', () => {
    const markup = renderToStaticMarkup(
      <SpatialSemiModalLayer
        mask
        layerName="delete-confirm-dialog-layer"
        panelName="delete-confirm-dialog"
      >
        <div>Delete dialog</div>
      </SpatialSemiModalLayer>,
    )

    expect(markup).toContain('data-xr-overlay="true"')
    expect(markup).toContain('data-name="delete-confirm-dialog-layer"')
    expect(markup).toContain('data-spatial-semi-modal-mask="true"')
    expect(markup).toContain('data-name="delete-confirm-dialog"')
    expect(markup).toContain('width:100vw')
    expect(markup).toContain('height:100vh')
    expect(markup).toContain('Delete dialog')
  })

  it('can render the mask as a custom spatial material surface', () => {
    const markup = renderToStaticMarkup(
      <SpatialSemiModalLayer
        mask
        maskEnableXr
        maskName="floating-material-mask"
        maskStyle={{
          background: 'rgba(15, 23, 42, 0.2)',
          '--xr-background-material': 'thin',
          '--xr-back': '24px',
        }}
      >
        <div>Material dialog</div>
      </SpatialSemiModalLayer>,
    )

    expect(markup).toContain('data-name="floating-material-mask"')
    expect(markup).toContain('background:rgba(15, 23, 42, 0.2)')
    expect(markup).toContain('--xr-background-material:thin')
    expect(markup).toContain('--xr-back:24px')
    expect(markup).toContain('Material dialog')
  })
})
