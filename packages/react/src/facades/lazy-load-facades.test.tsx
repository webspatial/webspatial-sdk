import { act, cleanup, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import React, { createRef, forwardRef } from 'react'
import { __resetBootStateForTests, bootSpatial } from '../runtime/boot'
import {
  __resetSpatialBridgeForTests,
  __setSpatialImplLoaderForTests,
  type SpatialImplementation,
} from '../runtime/bridge'
import * as reality from '../reality'
import { Model } from './Model'
import { Reality } from './Reality'
import {
  AttachmentEntity,
  Box,
  BoxEntity,
  Cone,
  ConeEntity,
  Cylinder,
  CylinderEntity,
  Entity,
  ModelEntity,
  Plane,
  PlaneEntity,
  Sphere,
  SphereEntity,
} from './entities'
import {
  AttachmentAsset,
  Material,
  ModelAsset,
  Texture,
  UnlitMaterial,
} from './resources'
import { SceneGraph, World } from './SceneGraph'
import {
  __resetWithSpatialized2DElementContainerCacheForTests,
  withSpatialized2DElementContainer,
} from './withSpatialized2DElementContainer'
import {
  __resetWithSpatialMonitorCacheForTests,
  withSpatialMonitor,
} from './withSpatialMonitor'
import { __resetBootForgottenWarningForTests } from './shared/warnBootForgotten'

function setUserAgent(userAgent: string): void {
  Object.defineProperty(window.navigator, 'userAgent', {
    value: userAgent,
    configurable: true,
  })
}

function setPlainWebUserAgent(): void {
  setUserAgent('Mozilla/5.0 Chrome/120.0.0.0 Safari/537.36')
}

function setPuppeteerUserAgent(): void {
  setUserAgent('Mozilla/5.0 Chrome/120.0.0.0 Puppeteer Safari/537.36')
}

function makeSentinelSpatialImpl(): SpatialImplementation {
  const SentinelModel = forwardRef<HTMLDivElement>((_, ref) => (
    <div data-sentinel="Model" ref={ref} />
  ))
  const SentinelReality = forwardRef<
    HTMLDivElement,
    { children?: React.ReactNode }
  >(({ children }, ref) => (
    <div data-sentinel="Reality" ref={ref}>
      {children}
    </div>
  ))
  const makeSentinelEntity = (name: string) =>
    forwardRef<HTMLElement, { children?: React.ReactNode }>(
      ({ children }, _ref) => <div data-sentinel={name}>{children}</div>,
    )
  const makeSentinelResource = (name: string) =>
    function SentinelResource(props: { children?: React.ReactNode }) {
      return <div data-sentinel={name}>{props.children}</div>
    }
  const SentinelSceneGraph = ({ children }: { children?: React.ReactNode }) => (
    <div data-sentinel="SceneGraph">{children}</div>
  )

  const sentinelHOC2D = vi.fn(<P extends React.ElementType>(_Component: P) => {
    return forwardRef<HTMLElement, Record<string, unknown>>(
      function HOC2DReal(_props, ref) {
        return <span data-sentinel="HOC2D" ref={ref as any} />
      },
    ) as unknown as P
  })
  const sentinelHOCMonitor = vi.fn((_El: React.ElementType) =>
    forwardRef<HTMLElement, Record<string, unknown>>(
      function HOCMonitorReal(_props, ref) {
        return <span data-sentinel="HOCMonitor" ref={ref as any} />
      },
    ),
  )

  const sentinelUseMetrics = () => ({
    pointToPhysical: (pt: number) => pt * 999,
    physicalToPoint: (m: number) => m * 999,
  })

  return {
    Model: SentinelModel,
    Reality: SentinelReality,
    Entity: makeSentinelEntity('Entity'),
    BoxEntity: makeSentinelEntity('BoxEntity'),
    SphereEntity: makeSentinelEntity('SphereEntity'),
    ConeEntity: makeSentinelEntity('ConeEntity'),
    CylinderEntity: makeSentinelEntity('CylinderEntity'),
    PlaneEntity: makeSentinelEntity('PlaneEntity'),
    ModelEntity: makeSentinelEntity('ModelEntity'),
    AttachmentEntity: makeSentinelResource('AttachmentEntity'),
    UnlitMaterial: makeSentinelResource('UnlitMaterial'),
    Material: makeSentinelResource('Material'),
    Texture: makeSentinelResource('Texture'),
    ModelAsset: makeSentinelResource('ModelAsset'),
    AttachmentAsset: makeSentinelResource('AttachmentAsset'),
    SceneGraph: SentinelSceneGraph,
    World: SentinelSceneGraph,
    withSpatialized2DElementContainer: sentinelHOC2D,
    withSpatialMonitor: sentinelHOCMonitor,
    useMetrics: sentinelUseMetrics,
    // Aliases
    Box: makeSentinelEntity('BoxEntity'),
    Sphere: makeSentinelEntity('SphereEntity'),
    Cone: makeSentinelEntity('ConeEntity'),
    Cylinder: makeSentinelEntity('CylinderEntity'),
    Plane: makeSentinelEntity('PlaneEntity'),
  } as unknown as SpatialImplementation
}

describe('lazy-load facades', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>
  let errorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.unstubAllGlobals()
    __resetSpatialBridgeForTests()
    __resetBootStateForTests()
    __resetBootForgottenWarningForTests()
    __resetWithSpatialized2DElementContainerCacheForTests()
    __resetWithSpatialMonitorCacheForTests()
    setPlainWebUserAgent()
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    // The native HTML <model> element is part of a future spec and not
    // recognized by jsdom / React's intrinsic table; React logs an "unknown
    // tag" error every time the Model facade renders fallback. The DOM
    // output is correct and the warning is unavoidable without changing
    // public Model behavior, so we suppress it for this suite.
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    cleanup()
    warnSpy.mockRestore()
    errorSpy.mockRestore()
    vi.unstubAllGlobals()
    __resetSpatialBridgeForTests()
    __resetBootStateForTests()
    __resetBootForgottenWarningForTests()
    __resetWithSpatialized2DElementContainerCacheForTests()
    __resetWithSpatialMonitorCacheForTests()
  })

  describe('Model facade — plain web fallback (per "Model fallback renders degraded <model> tag" Scenario)', () => {
    it('renders a native <model> element and forwards ref to it', () => {
      const ref = createRef<HTMLElement>()
      const { container } = render(<Model ref={ref as any} src="x.usdz" />)

      const modelEl = container.querySelector('model')
      expect(modelEl).not.toBeNull()
      expect(ref.current).toBe(modelEl)
      expect(modelEl?.getAttribute('src')).toBe('x.usdz')
    })

    it('strips spatial-only event handlers + spatialEventOptions before reaching the <model> element', () => {
      const onSpatialTap = vi.fn()
      const onSpatialDrag = vi.fn()
      const { container } = render(
        <Model
          onSpatialTap={onSpatialTap}
          onSpatialDragStart={onSpatialDrag}
          onSpatialDrag={onSpatialDrag}
          onSpatialDragEnd={onSpatialDrag}
          onSpatialRotate={onSpatialDrag}
          onSpatialRotateEnd={onSpatialDrag}
          onSpatialMagnify={onSpatialDrag}
          onSpatialMagnifyEnd={onSpatialDrag}
          spatialEventOptions={{ constrainedToAxis: [0, 1, 0] }}
          src="x.usdz"
        />,
      )

      const modelEl = container.querySelector('model')!
      for (const attr of [
        'onspatialtap',
        'onspatialdragstart',
        'onspatialdrag',
        'onspatialdragend',
        'onspatialrotate',
        'onspatialrotateend',
        'onspatialmagnify',
        'onspatialmagnifyend',
        'spatialeventoptions',
      ]) {
        expect(modelEl.hasAttribute(attr)).toBe(false)
      }
    })

    it('displayName is "Model"', () => {
      expect(Model.displayName).toBe('Model')
    })
  })

  describe('Reality facade — plain web fallback (per "Reality fallback preserves layout" Scenario)', () => {
    it('renders a single <div aria-hidden> placeholder with the layout box', () => {
      const ref = createRef<HTMLDivElement>()
      const { container } = render(
        <Reality
          ref={ref as any}
          className="foo"
          style={{ width: 100 }}
          data-testid="reality-placeholder"
        >
          <span data-testid="reality-child" />
        </Reality>,
      )

      const placeholder = container.querySelector(
        '[data-testid="reality-placeholder"]',
      ) as HTMLDivElement
      expect(placeholder).not.toBeNull()
      expect(placeholder.tagName).toBe('DIV')
      expect(placeholder.getAttribute('aria-hidden')).toBe('true')
      expect(placeholder.classList.contains('foo')).toBe(true)
      expect(placeholder.style.width).toBe('100px')
      expect(ref.current).toBe(placeholder)
    })

    it('does NOT mount the React children subtree in fallback mode', () => {
      const { queryByTestId } = render(
        <Reality>
          <span data-testid="reality-child" />
        </Reality>,
      )
      expect(queryByTestId('reality-child')).toBeNull()
    })

    it('displayName is "Reality"', () => {
      expect(Reality.displayName).toBe('Reality')
    })
  })

  describe('Entity-class facades — plain web fallback returns null', () => {
    const entityRefCases: Array<{ name: string; Component: any }> = [
      { name: 'Entity', Component: Entity },
      { name: 'BoxEntity', Component: BoxEntity },
      { name: 'SphereEntity', Component: SphereEntity },
      { name: 'ConeEntity', Component: ConeEntity },
      { name: 'CylinderEntity', Component: CylinderEntity },
      { name: 'PlaneEntity', Component: PlaneEntity },
      { name: 'ModelEntity', Component: ModelEntity },
    ]
    const nullCases: Array<{ name: string; Component: any }> = [
      { name: 'AttachmentEntity', Component: AttachmentEntity },
      { name: 'UnlitMaterial', Component: UnlitMaterial },
      { name: 'Material', Component: Material },
      { name: 'Texture', Component: Texture },
      { name: 'ModelAsset', Component: ModelAsset },
      { name: 'AttachmentAsset', Component: AttachmentAsset },
    ]

    for (const { name, Component } of entityRefCases) {
      it(`${name} renders null in fallback (children NOT mounted) and forwards ref (ref.current === null per "Facade ref is null when fallback renders no host element" Scenario)`, () => {
        const ref = createRef<unknown>()
        const { container } = render(
          <Component ref={ref as any} id="x" name="n" model="m">
            <span data-testid={`${name}-child`} />
          </Component>,
        )
        expect(container.children.length).toBe(0)
        expect(ref.current).toBeNull()
      })

      it(`${name} displayName is "${name}"`, () => {
        expect(Component.displayName).toBe(name)
      })
    }

    for (const { name, Component } of nullCases) {
      it(`${name} renders null in fallback (children NOT mounted) and has no ref-forwarding contract`, () => {
        const { container } = render(
          <Component
            id="x"
            url="u"
            src="s"
            name="n"
            attachment="a"
            size={{ width: 0, height: 0 }}
          >
            <span data-testid={`${name}-child`} />
          </Component>,
        )
        expect(container.children.length).toBe(0)
      })

      it(`${name} displayName is "${name}"`, () => {
        expect(Component.displayName).toBe(name)
      })
    }

    it('Box / Sphere / Cone / Cylinder / Plane aliases reference the same facade as their *Entity counterpart', () => {
      expect(Box).toBe(BoxEntity)
      expect(Sphere).toBe(SphereEntity)
      expect(Cone).toBe(ConeEntity)
      expect(Cylinder).toBe(CylinderEntity)
      expect(Plane).toBe(PlaneEntity)
    })
  })

  describe('SceneGraph / World facade — plain web fallback returns null', () => {
    it('renders null in fallback (children NOT mounted)', () => {
      const { container, queryByTestId } = render(
        <SceneGraph>
          <span data-testid="scenegraph-child">hello</span>
        </SceneGraph>,
      )
      expect(container.children.length).toBe(0)
      expect(queryByTestId('scenegraph-child')).toBeNull()
    })

    it('World alias references the same facade as SceneGraph', () => {
      expect(World).toBe(SceneGraph)
    })

    it('displayName is "SceneGraph"', () => {
      expect(SceneGraph.displayName).toBe('SceneGraph')
    })
  })

  describe('HOC facades — wrapper-cache identity contract', () => {
    it('withSpatialized2DElementContainer returns the same wrapper for the same Component reference', () => {
      const A = withSpatialized2DElementContainer('section')
      const B = withSpatialized2DElementContainer('section')
      const C = withSpatialized2DElementContainer('article')
      expect(A).toBe(B)
      expect(A).not.toBe(C)
    })

    it('withSpatialMonitor returns the same wrapper for the same El reference', () => {
      const A = withSpatialMonitor('section')
      const B = withSpatialMonitor('section')
      const C = withSpatialMonitor('article')
      expect(A).toBe(B)
      expect(A).not.toBe(C)
    })

    it('withSpatialized2DElementContainer fallback renders the raw component transparently and strips spatial-only event handlers', () => {
      // Cast the wrapper to a permissive React component shape — its public
      // surface is `Spatialized2DElementContainerProps<'section'>` (which
      // includes spatial-event handlers + `spatialEventOptions`), but the
      // type-parameter `P = 'section'` exposed by the real HOC's existing
      // signature loses that information at the call site.
      const Wrapped = withSpatialized2DElementContainer(
        'section',
      ) as unknown as React.ComponentType<Record<string, unknown>>
      const ref = createRef<HTMLElement>()
      const onSpatialTap = vi.fn()
      const { container } = render(
        <Wrapped
          ref={ref as any}
          onSpatialTap={onSpatialTap}
          spatialEventOptions={{ constrainedToAxis: [0, 0, 1] }}
          className="hoc-fallback"
        >
          <span data-testid="hoc2d-child" />
        </Wrapped>,
      )
      const section = container.querySelector('section.hoc-fallback')!
      expect(section).not.toBeNull()
      expect(section.hasAttribute('onspatialtap')).toBe(false)
      expect(section.hasAttribute('spatialeventoptions')).toBe(false)
      expect(ref.current).toBe(section)
    })

    it('withSpatialized2DElementContainer fallback does not bind xr-animation in plain-web mode', () => {
      const Wrapped = withSpatialized2DElementContainer(
        'section',
      ) as unknown as React.ComponentType<Record<string, unknown>>
      const motion = {
        __kind: 'spatializedMotion' as const,
        __setElement: vi.fn(),
        __onUnbind: vi.fn(),
      }

      const { getByTestId, unmount } = render(
        <Wrapped xr-animation={motion} data-testid="fallback-motion-host">
          Motion host
        </Wrapped>,
      )
      const host = getByTestId('fallback-motion-host')

      expect(host.hasAttribute('xr-animation')).toBe(false)
      expect(motion.__setElement).not.toHaveBeenCalled()
      expect(motion.__onUnbind).not.toHaveBeenCalled()

      unmount()

      expect(motion.__setElement).not.toHaveBeenCalled()
      expect(motion.__onUnbind).not.toHaveBeenCalled()
    })

    it('withSpatialMonitor fallback renders the raw El transparently', () => {
      const Monitor = withSpatialMonitor(
        'div',
      ) as unknown as React.ComponentType<{
        ref?: any
        children?: React.ReactNode
      }>
      const ref = createRef<HTMLDivElement>()
      const { getByTestId } = render(
        <Monitor ref={ref}>
          <span data-testid="monitor-child" />
        </Monitor>,
      )
      const child = getByTestId('monitor-child')
      expect(child.parentElement?.tagName).toBe('DIV')
      expect(ref.current).toBe(child.parentElement)
    })

    it('HOC displayName follows the WithSpatialized2DElementContainer(<inner>) / WithSpatialMonitor(<inner>) convention', () => {
      const W2D = withSpatialized2DElementContainer(
        'section',
      ) as unknown as React.ComponentType & { displayName?: string }
      const WM = withSpatialMonitor(
        'section',
      ) as unknown as React.ComponentType & {
        displayName?: string
      }
      expect(W2D.displayName).toBe('WithSpatialized2DElementContainer(section)')
      expect(WM.displayName).toBe('WithSpatialMonitor(section)')
    })
  })

  describe('Dev-mode warning policy (per "Dev-mode warning when boot is forgotten" / "No dev-mode warning in non-WebSpatial browsers")', () => {
    it('does NOT warn in a plain web browser regardless of how many facades render', () => {
      render(
        <>
          <Model src="x" />
          <Reality />
          <Entity />
          <SceneGraph>
            <span />
          </SceneGraph>
        </>,
      )
      expect(warnSpy).not.toHaveBeenCalled()
    })

    it('warns exactly once in a WebSpatial runtime when a facade renders before bootSpatial() is called', () => {
      setPuppeteerUserAgent()
      render(
        <>
          <Model src="x" />
          <Model src="y" />
          <Reality />
          <Entity />
        </>,
      )
      expect(warnSpy).toHaveBeenCalledTimes(1)
      expect(warnSpy.mock.calls[0][0]).toMatch(/bootSpatial\(\)/)
    })

    it('does NOT warn in a WebSpatial runtime once bootSpatial() has been called', async () => {
      setPuppeteerUserAgent()
      __setSpatialImplLoaderForTests(() => new Promise(() => {})) // hang
      await act(async () => {
        bootSpatial()
      })
      render(<Model src="x" />)
      expect(warnSpy).not.toHaveBeenCalled()
    })
  })

  describe('Facade -> real implementation switch after bootSpatial() resolves', () => {
    it('Model renders the spatial-chunk real implementation once boot resolves', async () => {
      setPuppeteerUserAgent()
      const sentinel = makeSentinelSpatialImpl()
      __setSpatialImplLoaderForTests(() => Promise.resolve(sentinel))

      const { container, rerender } = render(<Model src="x" />)
      expect(container.querySelector('model')).not.toBeNull()

      await act(async () => {
        await bootSpatial()
      })
      rerender(<Model src="x" />)
      expect(container.querySelector('[data-sentinel="Model"]')).not.toBeNull()
      expect(container.querySelector('model')).toBeNull()
    })

    it('Reality mounts children only after the real implementation is in scope', async () => {
      setPuppeteerUserAgent()
      const sentinel = makeSentinelSpatialImpl()
      __setSpatialImplLoaderForTests(() => Promise.resolve(sentinel))

      const { container, rerender, queryByTestId } = render(
        <Reality>
          <span data-testid="reality-child" />
        </Reality>,
      )
      expect(queryByTestId('reality-child')).toBeNull()

      await act(async () => {
        await bootSpatial()
      })
      rerender(
        <Reality>
          <span data-testid="reality-child" />
        </Reality>,
      )
      expect(
        container.querySelector('[data-sentinel="Reality"]'),
      ).not.toBeNull()
      expect(queryByTestId('reality-child')).not.toBeNull()
    })

    it('Entity mounts the spatial-chunk real implementation once boot resolves', async () => {
      setPuppeteerUserAgent()
      const sentinel = makeSentinelSpatialImpl()
      __setSpatialImplLoaderForTests(() => Promise.resolve(sentinel))

      const { container, rerender } = render(<Entity />)
      expect(container.children.length).toBe(0)

      await act(async () => {
        await bootSpatial()
      })
      rerender(<Entity />)
      expect(container.querySelector('[data-sentinel="Entity"]')).not.toBeNull()
    })
  })

  describe('Internal reality hooks are NOT publicly exported (per tasks §5.3)', () => {
    const internalNames = [
      'useEntity',
      'useEntityRef',
      'useEntityTransform',
      'useEntityEvent',
      'useEntityId',
      'useRealityEvents',
      'useForceUpdate',
    ] as const

    for (const name of internalNames) {
      it(`reality barrel does not expose ${name} at runtime`, () => {
        expect((reality as Record<string, unknown>)[name]).toBeUndefined()
      })
    }
  })
})
