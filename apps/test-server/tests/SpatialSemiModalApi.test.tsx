import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@douyinfe/semi-ui', () => ({
  Modal: {},
}))

import {
  SpatialSemiModalApi,
  createSpatialSemiModalConfig,
} from '../src/pages/spatial-semi-modal/components/SpatialSemiModal'

beforeEach(() => {
  vi.stubGlobal('document', { body: {} })
})

describe('createSpatialSemiModalConfig', () => {
  it('wraps Semi imperative modal content in a fullscreen spatial overlay', () => {
    const onCancel = vi.fn()
    const config = createSpatialSemiModalConfig(
      {
        title: 'Delete file?',
        content: 'This cannot be undone.',
        layerName: 'confirm-layer',
        maskEnableXr: true,
        maskName: 'confirm-material-mask',
        maskStyle: {
          '--xr-background-material': 'regular',
          '--xr-back': '18px',
        },
        panelName: 'confirm-panel',
        onCancel,
      },
      'fallback-id',
    )

    const markup = renderToStaticMarkup(
      config.modalRender?.(<div>Confirm body</div>) ?? <div />,
    )

    expect(config.getPopupContainer?.()).toBe(document.body)
    expect(config.mask).toBe(false)
    expect(config.motion).toBe(false)
    expect(markup).toContain('data-xr-overlay="true"')
    expect(markup).toContain('data-name="confirm-layer"')
    expect(markup).toContain('data-name="confirm-material-mask"')
    expect(markup).toContain('--xr-background-material:regular')
    expect(markup).toContain('--xr-back:18px')
    expect(markup).toContain('data-name="confirm-panel"')
    expect(markup).toContain('Confirm body')
  })
})

describe('SpatialSemiModalApi', () => {
  it('keeps the spatial wrapper when an imperative modal is updated', () => {
    const updates: unknown[] = []
    const handle = SpatialSemiModalApi.create(
      config => {
        updates.push(config)
        return {
          destroy: vi.fn(),
          update: nextConfig => updates.push(nextConfig),
        }
      },
      'confirm',
      {
        title: 'Delete file?',
        content: 'Initial content',
      },
    )

    handle.update({
      title: 'Delete file?',
      content: 'Updated content',
    })

    expect(updates).toHaveLength(2)
    updates.forEach(config => {
      const modalConfig = config as ReturnType<
        typeof createSpatialSemiModalConfig
      >
      expect(modalConfig.mask).toBe(false)
      expect(modalConfig.motion).toBe(false)
      expect(modalConfig.modalRender).toEqual(expect.any(Function))
    })
  })
})
