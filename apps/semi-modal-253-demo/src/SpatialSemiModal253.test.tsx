import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@douyinfe/semi-ui', () => ({
  Modal: () => null,
}))

import {
  SpatialSemiModalLayer,
  createSpatialSemiModalCommandConfig,
} from './SpatialSemiModal253'

describe('Semi 2.53 spatial modal fallback', () => {
  it('renders mask and panel as owned spatial surfaces without modalRender', () => {
    const markup = renderToStaticMarkup(
      <SpatialSemiModalLayer
        layerName="legacy-modal-layer"
        maskEnableXr
        maskName="legacy-material-mask"
        maskStyle={{
          '--xr-background-material': 'thin',
          '--xr-back': '24px',
        }}
        panelName="legacy-modal-panel"
      />,
    )

    expect(markup).toContain('data-name="legacy-modal-layer"')
    expect(markup).toContain('data-name="legacy-material-mask"')
    expect(markup).toContain('data-name="legacy-modal-panel"')
    expect(markup).toContain('--xr-background-material:thin')
    expect(markup).toContain('--xr-back:24px')
  })

  it('creates command configs that do not depend on Semi modalRender', () => {
    const config = createSpatialSemiModalCommandConfig(
      'confirm',
      {
        title: 'Delete file?',
        content: 'This cannot be undone.',
      },
      'legacy-confirm',
    )

    expect('modalRender' in config).toBe(false)
    expect(config.layerName).toBe('legacy-confirm-layer')
    expect(config.maskName).toBe('legacy-confirm-mask')
    expect(config.panelName).toBe('legacy-confirm-panel')
    expect(config.mask).toBe(true)
    expect(config.maskEnableXr).toBe(true)
    expect(config.hasCancel).toBe(true)
  })

  it('uses info-style command defaults for info dialogs', () => {
    const config = createSpatialSemiModalCommandConfig(
      'info',
      {
        title: 'Saved',
        content: 'The operation completed.',
      },
      'legacy-info',
    )

    expect(config.hasCancel).toBe(false)
    expect(config.okText).toBe('OK')
    expect(config.maskName).toBe('legacy-info-mask')
  })
})
