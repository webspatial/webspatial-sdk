import React from 'react'
import { act, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/** Creates a CSSStyleDeclaration stub for portal inheritance tests. */
function createComputedStyleStub(values: Record<string, string> = {}) {
  return {
    getPropertyValue: (name: string) => values[name] ?? '',
  } as CSSStyleDeclaration
}

describe('Spatialized2DElementContainer portal content ownership', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    document.body.innerHTML = ''
    vi.clearAllMocks()
    vi.unstubAllGlobals()
  })

  it('keeps authored portal-root opacity outside visionos runtime', async () => {
    const childDocument = document.implementation.createHTMLDocument('portal')
    const updateProperties = vi.fn()
    const portalInstanceObject = {
      computedStyle: createComputedStyleStub(),
    } as any

    vi.doMock('../utils', () => ({
      getSession: () => ({
        createSpatialized2DElement: vi.fn().mockResolvedValue({
          windowProxy: { document: childDocument } as WindowProxy,
          updateProperties,
        }),
      }),
    }))
    vi.doMock('../utils/windowStyleSync', () => ({
      setOpenWindowStyle: vi.fn(),
      syncParentHeadToChild: vi.fn().mockResolvedValue(undefined),
    }))
    vi.doMock('../utils/useSyncHeadStyles', () => ({
      useSyncHeadStyles: vi.fn(),
    }))
    vi.doMock('./hooks/useSpatialContentReady', () => ({
      useSpatialContentReady: vi.fn(),
    }))
    vi.doMock('../runtime/detect', () => ({
      detectSpatialRuntime: vi.fn(() => null),
    }))
    vi.doMock('./SpatializedContainer', () => {
      /** Renders the portal content path without the full runtime container stack. */
      function MockSpatializedContainer(props: any) {
        const [element, setElement] = React.useState(null)

        React.useEffect(() => {
          Promise.resolve(props.createSpatializedElement()).then(setElement)
        }, [props])

        if (!element) return null

        return React.createElement(props.spatializedContent, {
          component: 'div',
          style: props.style,
          spatializedElement: element,
          portalInstanceObject,
          'data-testid': 'portal-root',
          children: React.createElement(
            'span',
            {
              'data-testid': 'portal-child',
              style: { opacity: 0.4 },
            },
            'Portal child',
          ),
        })
      }

      return { SpatializedContainer: MockSpatializedContainer }
    })

    const { Spatialized2DElementContainer } = await import(
      './Spatialized2DElementContainer'
    )

    render(
      React.createElement(Spatialized2DElementContainer as any, {
        component: 'div',
        style: {
          opacity: 0.25,
          transform: 'translate3d(10px, 20px, 30px)',
          color: 'rgb(255, 0, 0)',
        },
      }),
    )

    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })

    const portalRoot = childDocument.body.querySelector(
      '[data-testid="portal-root"]',
    ) as HTMLDivElement | null
    const portalChild = childDocument.body.querySelector(
      '[data-testid="portal-child"]',
    ) as HTMLSpanElement | null

    expect(portalRoot).toBeTruthy()
    expect(portalRoot?.style.opacity).toBe('0.25')
    expect(portalRoot?.style.transform).toBe('none')
    expect(portalRoot?.style.color).toBe('rgb(255, 0, 0)')
    expect(portalChild?.style.opacity).toBe('0.4')
    expect(updateProperties).toHaveBeenCalled()
  })

  it('neutralizes portal-root opacity in visionos runtime', async () => {
    const childDocument = document.implementation.createHTMLDocument('portal')
    const updateProperties = vi.fn()
    const portalInstanceObject = {
      computedStyle: createComputedStyleStub(),
    } as any

    vi.doMock('../utils', () => ({
      getSession: () => ({
        createSpatialized2DElement: vi.fn().mockResolvedValue({
          windowProxy: { document: childDocument } as WindowProxy,
          updateProperties,
        }),
      }),
    }))
    vi.doMock('../utils/windowStyleSync', () => ({
      setOpenWindowStyle: vi.fn(),
      syncParentHeadToChild: vi.fn().mockResolvedValue(undefined),
    }))
    vi.doMock('../utils/useSyncHeadStyles', () => ({
      useSyncHeadStyles: vi.fn(),
    }))
    vi.doMock('./hooks/useSpatialContentReady', () => ({
      useSpatialContentReady: vi.fn(),
    }))
    vi.doMock('../runtime/detect', () => ({
      detectSpatialRuntime: vi.fn(() => 'visionos'),
    }))
    vi.doMock('./SpatializedContainer', () => {
      /** Renders the portal content path without the full runtime container stack. */
      function MockSpatializedContainer(props: any) {
        const [element, setElement] = React.useState(null)

        React.useEffect(() => {
          Promise.resolve(props.createSpatializedElement()).then(setElement)
        }, [props])

        if (!element) return null

        return React.createElement(props.spatializedContent, {
          component: 'div',
          style: props.style,
          spatializedElement: element,
          portalInstanceObject,
          'data-testid': 'portal-root',
          children: React.createElement(
            'span',
            {
              'data-testid': 'portal-child',
              style: { opacity: 0.4 },
            },
            'Portal child',
          ),
        })
      }

      return { SpatializedContainer: MockSpatializedContainer }
    })

    const { Spatialized2DElementContainer } = await import(
      './Spatialized2DElementContainer'
    )

    render(
      React.createElement(Spatialized2DElementContainer as any, {
        component: 'div',
        style: {
          opacity: 0.25,
          transform: 'translate3d(10px, 20px, 30px)',
          color: 'rgb(255, 0, 0)',
        },
      }),
    )

    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })

    const portalRoot = childDocument.body.querySelector(
      '[data-testid="portal-root"]',
    ) as HTMLDivElement | null
    const portalChild = childDocument.body.querySelector(
      '[data-testid="portal-child"]',
    ) as HTMLSpanElement | null

    expect(portalRoot).toBeTruthy()
    expect(portalRoot?.style.opacity).toBe('1')
    expect(portalRoot?.style.transform).toBe('none')
    expect(portalRoot?.style.color).toBe('rgb(255, 0, 0)')
    expect(portalChild?.style.opacity).toBe('0.4')
    expect(updateProperties).toHaveBeenCalled()
  })
})
