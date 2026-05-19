// SSR + hydration validation per spatial-lazy-load spec tasks.md §13.2 –
// §13.6 + the "SSR and hydration safety" Requirement.
//
// These tests pin the contract that the default entry behaves as web mode
// during SSR (facades render fallback, hook placeholders return defaults,
// the bridge MUST NOT schedule any dynamic import, registered
// `onSpatialLoadError` callbacks MUST NOT be invoked) and that subsequent
// client-side hydration produces no React hydration-mismatch warnings
// regardless of when `bootSpatial()` resolves relative to `hydrateRoot()`.

import React from 'react'
import { renderToPipeableStream, renderToString } from 'react-dom/server'
import { hydrateRoot } from 'react-dom/client'
import { Writable } from 'node:stream'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { __resetBootStateForTests, bootSpatial } from '../runtime/boot'
import { resetRuntimeCacheForTests } from '../runtime/capabilities'
import {
  __getSpatialReadySubscriberCountForTests,
  __resetSpatialBridgeForTests,
  __setSpatialImplLoaderForTests,
  onSpatialLoadError,
  type SpatialImplementation,
} from '../runtime/bridge'
import { act } from 'react'
import { __resetBootForgottenWarningForTests } from '../facades/shared/warnBootForgotten'
import { Model } from '../facades/Model'
import { Reality } from '../facades/Reality'
import { BoxEntity } from '../facades/entities'
import { useMetrics } from '../hooks-web/useMetrics'
import { useSpatialReady } from '../runtime/useSpatialReady'

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

function resetEnv(): void {
  vi.unstubAllGlobals()
  __resetSpatialBridgeForTests()
  __resetBootStateForTests()
  __resetBootForgottenWarningForTests()
  resetRuntimeCacheForTests()
  setPlainWebUserAgent()
}

beforeEach(() => {
  resetEnv()
})

afterEach(() => {
  resetEnv()
})

function makeSentinelImpl(): SpatialImplementation {
  const SentinelModel = React.forwardRef<HTMLDivElement>((_, ref) => (
    <div data-sentinel="Model" ref={ref} />
  ))
  const SentinelReality = React.forwardRef<
    HTMLDivElement,
    { children?: React.ReactNode }
  >(({ children }, ref) => (
    <div data-sentinel="Reality" ref={ref}>
      {children}
    </div>
  ))
  return {
    Model: SentinelModel,
    Reality: SentinelReality,
    BoxEntity: React.forwardRef<HTMLElement, { children?: React.ReactNode }>(
      ({ children }, _ref) => <div data-sentinel="BoxEntity">{children}</div>,
    ),
    useMetrics: () => ({
      pointToPhysical: (n: number) => n,
      physicalToPoint: (n: number) => n,
    }),
  } as unknown as SpatialImplementation
}

// ---------------------------------------------------------------------------
// §13.2 — synchronous SSR via renderToString
// ---------------------------------------------------------------------------

describe('SSR via renderToString (spec tasks.md §13.2 + "Server render does not touch spatial chunk and does not invoke error listeners" Scenario)', () => {
  it('does NOT request the spatial chunk during SSR (loader is never called)', () => {
    const loader = vi.fn(() =>
      Promise.resolve({} as unknown as SpatialImplementation),
    )
    __setSpatialImplLoaderForTests(loader)
    renderToString(
      <>
        <Model src="x.usdz" />
        <Reality />
        <BoxEntity />
      </>,
    )
    expect(loader).not.toHaveBeenCalled()
  })

  it('facade output matches the documented per-component fallback HTML', () => {
    const html = renderToString(
      <>
        <Model src="x.usdz" />
        <Reality className="reality-host" />
        <BoxEntity />
      </>,
    )
    expect(html).toContain('<model')
    expect(html).toContain('src="x.usdz"')
    expect(html).toContain('aria-hidden="true"')
    expect(html).toContain('class="reality-host"')
    // BoxEntity fallback is `null` → it MUST contribute no HTML
    expect(html).not.toContain('boxentity')
  })

  it('onSpatialLoadError callbacks registered before SSR are NOT invoked during SSR', () => {
    const errorListener = vi.fn()
    onSpatialLoadError(errorListener)
    renderToString(<Model src="x.usdz" />)
    expect(errorListener).not.toHaveBeenCalled()
  })

  it('bootSpatial() invoked during SSR resolves synchronously without scheduling work', async () => {
    const loader = vi.fn(() =>
      Promise.resolve({} as unknown as SpatialImplementation),
    )
    __setSpatialImplLoaderForTests(loader)
    // We're in a non-WebSpatial UA — bootSpatial() must resolve immediately.
    const start = performance.now()
    await bootSpatial()
    const elapsed = performance.now() - start
    // `Promise.resolve()` queueMicrotasks; allow up to a few ms for slow CI
    // runners but no real I/O should happen.
    expect(elapsed).toBeLessThan(50)
    expect(loader).not.toHaveBeenCalled()
  })

  it('renderToString with useMetrics returns the placeholder constants and does not throw', () => {
    function Probe() {
      const m = useMetrics()
      return <span>{m.pointToPhysical(1360)}</span>
    }
    const html = renderToString(<Probe />)
    expect(html).toContain('>1<')
  })
})

// ---------------------------------------------------------------------------
// §13.3 — Streaming SSR via renderToPipeableStream
// ---------------------------------------------------------------------------

describe('Streaming SSR via renderToPipeableStream (spec tasks.md §13.3 + "Streaming SSR is equivalent to synchronous SSR" Scenario)', () => {
  function collectStream(
    render: (out: Writable) => { pipe: (out: Writable) => void },
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = []
      const out = new Writable({
        write(chunk, _enc, cb) {
          chunks.push(Buffer.from(chunk))
          cb()
        },
      })
      out.on('finish', () =>
        resolve(
          Buffer.concat(chunks as readonly Uint8Array[]).toString('utf8'),
        ),
      )
      out.on('error', reject)
      const pipeable = render(out)
      pipeable.pipe(out)
    })
  }

  it('streaming SSR produces the same fallback markup as synchronous SSR (no spatial chunk fetch, no Suspense boundary)', async () => {
    const loader = vi.fn(() =>
      Promise.resolve({} as unknown as SpatialImplementation),
    )
    __setSpatialImplLoaderForTests(loader)
    const html = await collectStream(out => {
      const tree = (
        <>
          <Model src="y.usdz" />
          <Reality />
        </>
      )
      return renderToPipeableStream(tree, {
        onAllReady() {
          /* trigger full flush; no Suspense expected */
        },
        onShellReady() {
          /* shell ready callback intentionally empty */
        },
      })
    })
    expect(html).toContain('<model')
    expect(html).toContain('src="y.usdz"')
    expect(html).toContain('aria-hidden="true"')
    // Streaming MUST NOT introduce its own Suspense boundary on the SDK
    // side — facades MUST NOT inject `<Suspense>` per spec.
    expect(html).not.toMatch(/<!--\$\?-->/) // Suspense placeholder marker
    expect(loader).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// §13.4 — getServerSnapshot stability
// ---------------------------------------------------------------------------

describe('useSpatialReady getServerSnapshot stability (spec tasks.md §13.4 + "getServerSnapshot returns a stable constant" Scenario)', () => {
  it('SSR pass returns a stable false snapshot for useSpatialReady (referential equality across siblings)', () => {
    function Probe() {
      const ready = useSpatialReady()
      return <span data-ready={String(ready)} />
    }
    // Render two siblings in the same SSR pass — both MUST observe `false`.
    const html = renderToString(
      <>
        <Probe />
        <Probe />
      </>,
    )
    const matches = html.match(/data-ready="([^"]+)"/g) ?? []
    expect(matches).toHaveLength(2)
    expect(matches.every(m => m === 'data-ready="false"')).toBe(true)
  })

  it('useSpatialReady SSR snapshot does NOT touch window or schedule subscriptions', () => {
    const before = __getSpatialReadySubscriberCountForTests()
    function Probe() {
      const ready = useSpatialReady()
      return <span>{String(ready)}</span>
    }
    renderToString(<Probe />)
    const after = __getSpatialReadySubscriberCountForTests()
    // SSR path uses `getServerSnapshot` — there MUST NOT be any new
    // subscription attached as a side effect.
    expect(after).toBe(before)
  })
})

// ---------------------------------------------------------------------------
// §13.5 — hydration round-trip, boot AFTER hydrate
// ---------------------------------------------------------------------------

describe('Hydration round-trip — boot AFTER hydrate (spec tasks.md §13.5 + "First client render matches server render regardless of boot timing" + "Switch to spatial happens after hydration commits" Scenarios)', () => {
  it('hydration completes without React mismatch warnings; subsequent bootSpatial() resolution swaps to real implementations on the next commit', async () => {
    setPuppeteerUserAgent()
    const sentinelImpl = makeSentinelImpl()
    __setSpatialImplLoaderForTests(() => Promise.resolve(sentinelImpl))

    // SSR — no boot yet.
    const tree = (
      <>
        <Model src="z.usdz" data-testid="model-host" />
        <BoxEntity />
      </>
    )
    const html = renderToString(tree)

    // Mount the SSR'd HTML into a real DOM container.
    const container = document.createElement('div')
    container.innerHTML = html

    // Spy on console.error / warn — React would log a hydration-mismatch
    // warning at error level if the first client render diverges from the
    // server output.
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    let root!: ReturnType<typeof hydrateRoot>
    await act(async () => {
      root = hydrateRoot(container, tree)
    })

    // No hydration-mismatch warning logged.
    const allLogs = [
      ...errorSpy.mock.calls.map(c => String(c[0] ?? '')),
      ...warnSpy.mock.calls.map(c => String(c[0] ?? '')),
    ]
    const hydrationMismatch = allLogs.find(s =>
      /hydrat(ion|ed|ing).*?mismatch|did not match|server-rendered/i.test(s),
    )
    expect(hydrationMismatch).toBeUndefined()
    // The pre-hydration server markup contained the documented Model
    // fallback (`<model>`), and the first client render observed the
    // same fallback (matched), so the model element is still present.
    expect(container.querySelector('model')).not.toBeNull()
    expect(container.querySelector('[data-sentinel="Model"]')).toBeNull()

    // Now boot — the bridge resolves and the next render commits real impls.
    await act(async () => {
      await bootSpatial()
    })

    expect(container.querySelector('[data-sentinel="Model"]')).not.toBeNull()
    expect(
      container.querySelector('[data-sentinel="BoxEntity"]'),
    ).not.toBeNull()

    act(() => {
      root.unmount()
    })
    errorSpy.mockRestore()
    warnSpy.mockRestore()
  })
})

// ---------------------------------------------------------------------------
// §13.6 — hydration round-trip, boot BEFORE hydrate
// ---------------------------------------------------------------------------

describe('Hydration round-trip — boot BEFORE hydrate (spec tasks.md §13.6 + "First client render matches server render regardless of boot timing" Scenario)', () => {
  it('first hydration render uses the SSR fallback even though the bridge IS already ready; swap to real implementation happens after hydration commits', async () => {
    setPuppeteerUserAgent()
    const sentinelImpl = makeSentinelImpl()
    __setSpatialImplLoaderForTests(() => Promise.resolve(sentinelImpl))

    const tree = (
      <>
        <Model src="w.usdz" />
        <BoxEntity />
      </>
    )

    // Boot first (bridge becomes ready), THEN run SSR — but recall that
    // the SSR pass uses `getServerSnapshot` which always returns false,
    // so the SSR HTML still uses fallback. This is the contract.
    await bootSpatial()
    const html = renderToString(tree)
    expect(html).toContain('<model')
    expect(html).not.toContain('data-sentinel="Model"')

    const container = document.createElement('div')
    container.innerHTML = html

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    let root!: ReturnType<typeof hydrateRoot>
    await act(async () => {
      root = hydrateRoot(container, tree)
    })

    const allLogs = [
      ...errorSpy.mock.calls.map(c => String(c[0] ?? '')),
      ...warnSpy.mock.calls.map(c => String(c[0] ?? '')),
    ]
    const hydrationMismatch = allLogs.find(s =>
      /hydrat(ion|ed|ing).*?mismatch|did not match|server-rendered/i.test(s),
    )
    expect(hydrationMismatch).toBeUndefined()

    // After hydration commits, the live snapshot (true) is picked up and
    // the next commit swaps to the real implementations.
    expect(container.querySelector('[data-sentinel="Model"]')).not.toBeNull()
    expect(
      container.querySelector('[data-sentinel="BoxEntity"]'),
    ).not.toBeNull()

    act(() => {
      root.unmount()
    })
    errorSpy.mockRestore()
    warnSpy.mockRestore()
  })
})
