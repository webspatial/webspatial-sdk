import * as core from '@webspatial/core-sdk'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SpatialContainerRefProxy } from './useDomProxy'
import { SpatialCustomStyleVars } from '../types'

/** Class mirror uses queueMicrotask coalescing; flush before asserting on task.className. */
async function flushClassSyncMicrotasks() {
  await Promise.resolve()
}

describe('SpatialContainerRefProxy', () => {
  it('writes the native dom element as ref only when both doms exist', () => {
    const ref = { current: null as any }
    const proxy = new SpatialContainerRefProxy<any>(ref)

    const dom = document.createElement('div')
    const task = document.createElement('div')
    const parent = document.createElement('section')
    parent.appendChild(dom)

    proxy.updateStandardSpatializedContainerDom(dom)
    expect(ref.current).toBe(null)

    proxy.updateTransformVisibilityTaskContainerDom(task)
    expect(ref.current).toBe(dom)
    expect(ref.current).toBeInstanceOf(window.Node)
    expect(parent.contains(ref.current)).toBe(true)
  })

  // Regression test for https://github.com/webspatial/webspatial-sdk/issues/1067
  // Native APIs like ResizeObserver/IntersectionObserver brand-check `Element`
  // and reject ECMAScript Proxy wrappers that lack the host internal slot.
  it('ref.current passes Element brand checks (e.g. ResizeObserver.observe)', () => {
    const ref = { current: null as any }
    const proxy = new SpatialContainerRefProxy<any>(ref)
    const dom = document.createElement('div')
    const task = document.createElement('div')

    proxy.updateStandardSpatializedContainerDom(dom)
    proxy.updateTransformVisibilityTaskContainerDom(task)

    expect(ref.current).toBeInstanceOf(window.Element)
    expect(ref.current).toBeInstanceOf(window.HTMLElement)

    class FakeResizeObserver {
      observe(target: unknown) {
        if (!(target instanceof window.Element)) {
          throw new TypeError(
            "Argument 1 ('target') to ResizeObserver.observe must be an instance of Element",
          )
        }
      }
      unobserve() {}
      disconnect() {}
    }

    const ro = new FakeResizeObserver()
    expect(() => ro.observe(ref.current)).not.toThrow()
  })

  // Regression test for the bug Codex flagged on
  // https://github.com/webspatial/webspatial-sdk/pull/1194 :
  // Because the style proxy is installed directly on the standard host element
  // (which React owns), any inline `style.transform = …` write that React
  // performs during a commit would be redirected to the probe and would
  // clobber the user's spatial transform. The fix in
  // StandardSpatializedContainer is to drive `transform` / `visibility` /
  // `transition` via CSS rules keyed on a `data-xr-host` attribute, which
  // React applies through `setAttribute` (bypassing the style proxy).
  // This test pins that contract: writes through `setAttribute` on the host
  // must not perturb the probe's inline style.
  it('host data-* attribute writes do not clobber probe transform', () => {
    const ref = { current: null as any }
    const proxy = new SpatialContainerRefProxy<any>(ref)
    const host = document.createElement('div')
    const probe = document.createElement('div')

    proxy.updateStandardSpatializedContainerDom(host)
    proxy.updateTransformVisibilityTaskContainerDom(probe)

    ref.current.style.transform = 'rotate(45deg)'
    expect(probe.style.getPropertyValue('transform')).toBe('rotate(45deg)')

    host.setAttribute('data-xr-host', '')
    host.setAttribute('data-xr-transform-active', '')

    expect(probe.style.getPropertyValue('transform')).toBe('rotate(45deg)')
    expect(host.getAttribute('style')).toBeNull()
  })

  it('proxies style visibility/transform to task container', () => {
    const ref = { current: null as any }
    const proxy = new SpatialContainerRefProxy<any>(ref)
    const dom = document.createElement('div')
    const task = document.createElement('div')

    proxy.updateStandardSpatializedContainerDom(dom)
    proxy.updateTransformVisibilityTaskContainerDom(task)
    const domProxy = ref.current as any

    domProxy.style.visibility = 'hidden'
    expect(task.style.getPropertyValue('visibility')).toBe('hidden')

    domProxy.style.transform = 'translateX(10px)'
    expect(task.style.getPropertyValue('transform')).toBe('translateX(10px)')

    domProxy.style.setProperty('visibility', 'visible')
    expect(task.style.getPropertyValue('visibility')).toBe('visible')

    domProxy.style.removeProperty('transform')
    expect(task.style.getPropertyValue('transform')).toBe('')
  })

  it('keeps spatial custom vars on raw style', () => {
    const ref = { current: null as any }
    const proxy = new SpatialContainerRefProxy<any>(ref)
    const dom = document.createElement('div')
    const task = document.createElement('div')

    proxy.updateStandardSpatializedContainerDom(dom)
    proxy.updateTransformVisibilityTaskContainerDom(task)
    const domProxy = ref.current as any

    domProxy.style[SpatialCustomStyleVars.back] = '1m'
    domProxy.style[SpatialCustomStyleVars.depth] = '2m'
    domProxy.style[SpatialCustomStyleVars.xrZIndex] = '3'

    expect(dom.style.getPropertyValue(SpatialCustomStyleVars.back)).toBe('1m')
    expect(dom.style.getPropertyValue(SpatialCustomStyleVars.depth)).toBe('2m')
    expect(dom.style.getPropertyValue(SpatialCustomStyleVars.xrZIndex)).toBe(
      '3',
    )
  })

  it('filters cssText and updates task container for transform/visibility', () => {
    const ref = { current: null as any }
    const proxy = new SpatialContainerRefProxy<any>(ref)
    const dom = document.createElement('div')
    const task = document.createElement('div')

    proxy.updateStandardSpatializedContainerDom(dom)
    proxy.updateTransformVisibilityTaskContainerDom(task)
    const domProxy = ref.current as any

    domProxy.style.cssText =
      'color: red; transform: translateX(10px); visibility: visible;'
    expect(task.style.getPropertyValue('transform')).toBe('translateX(10px)')
    expect(task.style.getPropertyValue('visibility')).toBe('visible')
    expect(dom.style.getPropertyValue('color')).toBe('red')
    expect(dom.getAttribute('style')).toContain('transform: none')
    expect(dom.getAttribute('style')).toContain('visibility: hidden')
  })

  it('intercepts removeAttribute for style and class', async () => {
    const ref = { current: null as any }
    const proxy = new SpatialContainerRefProxy<any>(ref)
    const dom = document.createElement('div')
    const task = document.createElement('div')

    proxy.updateStandardSpatializedContainerDom(dom)
    proxy.updateTransformVisibilityTaskContainerDom(task)
    const domProxy = ref.current as any

    domProxy.className = 'a'
    expect(dom.className).toContain('xr-spatial-default')
    await flushClassSyncMicrotasks()
    expect(task.className).toBe(dom.className)

    domProxy.style.visibility = 'hidden'
    domProxy.style.transform = 'translateX(1px)'
    expect(task.style.visibility).toBe('hidden')
    expect(task.style.transform).toBe('translateX(1px)')

    domProxy.removeAttribute('style')
    expect(dom.getAttribute('style')).toContain('visibility: hidden')
    expect(dom.getAttribute('style')).toContain('transform: none')
    expect(task.style.getPropertyValue('visibility')).toBe('')
    expect(task.style.getPropertyValue('transform')).toBe('')

    domProxy.removeAttribute('class')
    await flushClassSyncMicrotasks()
    expect(domProxy.className).toBe('xr-spatial-default')
  })

  // PR #1194 review (P2 from Codex): clearing className imperatively must keep
  // `xr-spatial-default`, otherwise the host loses both the spatial CSS vars
  // and the `.xr-spatial-default[data-xr-host]` hidden-placeholder rule.
  it('preserves xr-spatial-default when className is cleared', async () => {
    const ref = { current: null as any }
    const proxy = new SpatialContainerRefProxy<any>(ref)
    const dom = document.createElement('div')
    const task = document.createElement('div')

    proxy.updateStandardSpatializedContainerDom(dom)
    proxy.updateTransformVisibilityTaskContainerDom(task)
    const domProxy = ref.current as any

    domProxy.className = 'foo bar'
    expect(dom.className).toContain('xr-spatial-default')

    domProxy.className = ''
    expect(dom.className).toBe('xr-spatial-default')
    await flushClassSyncMicrotasks()
    expect(task.className).toBe('xr-spatial-default')

    domProxy.className = 'baz'
    expect(dom.className).toBe('baz xr-spatial-default')
  })

  it('syncs classList changes to task container', async () => {
    const ref = { current: null as any }
    const proxy = new SpatialContainerRefProxy<any>(ref)
    const dom = document.createElement('div')
    const task = document.createElement('div')

    proxy.updateStandardSpatializedContainerDom(dom)
    proxy.updateTransformVisibilityTaskContainerDom(task)

    dom.classList.add('x')
    await flushClassSyncMicrotasks()
    expect(task.className).toBe(dom.className)

    dom.classList.remove('x')
    await flushClassSyncMicrotasks()
    expect(task.className).toBe(dom.className)
  })

  // PR #1194 review (P2 from Codex): the className descriptor only intercepts
  // `el.className =` assignments; native paths like setAttribute, classList
  // and third-party DOM helpers must not be able to strip the spatial class
  // because the hidden-placeholder CSS now depends on it.
  it('restores xr-spatial-default after native class mutations strip it', async () => {
    const ref = { current: null as any }
    const proxy = new SpatialContainerRefProxy<any>(ref)
    const dom = document.createElement('div')
    const task = document.createElement('div')

    proxy.updateStandardSpatializedContainerDom(dom)
    proxy.updateTransformVisibilityTaskContainerDom(task)
    const domProxy = ref.current as any

    domProxy.className = 'a'
    expect(dom.className).toContain('xr-spatial-default')

    // classList.remove bypasses the className descriptor.
    dom.classList.remove('xr-spatial-default')
    await flushClassSyncMicrotasks()
    expect(dom.className).toContain('xr-spatial-default')
    expect(task.className).toBe(dom.className)

    // setAttribute also bypasses the descriptor.
    dom.setAttribute('class', 'b')
    await flushClassSyncMicrotasks()
    expect(dom.className).toContain('xr-spatial-default')
    expect(dom.className).toContain('b')
    expect(task.className).toBe(dom.className)

    // classList.replace, the typical "swap classes" helper.
    dom.classList.replace('xr-spatial-default', 'c')
    await flushClassSyncMicrotasks()
    expect(dom.className).toContain('xr-spatial-default')
    expect(dom.className).toContain('c')
    expect(task.className).toBe(dom.className)
  })

  // PR #1194 review (P2 from Codex): the spatial class invariant is checked
  // as a class TOKEN, not a substring. A value like `foo-xr-spatial-default`
  // contains the literal substring but is not the real class token, so the
  // CSS selector `.xr-spatial-default` would not match and the placeholder
  // would un-hide. The className setter and the observer self-heal must
  // both append the real token in this case.
  it('treats xr-spatial-default as a class token, not a substring', async () => {
    const ref = { current: null as any }
    const proxy = new SpatialContainerRefProxy<any>(ref)
    const dom = document.createElement('div')
    const task = document.createElement('div')

    proxy.updateStandardSpatializedContainerDom(dom)
    proxy.updateTransformVisibilityTaskContainerDom(task)
    const domProxy = ref.current as any

    domProxy.className = 'foo-xr-spatial-default-theme'
    expect(dom.classList.contains('xr-spatial-default')).toBe(true)
    expect(dom.classList.contains('foo-xr-spatial-default-theme')).toBe(true)

    dom.setAttribute('class', 'bar-xr-spatial-default-extra')
    await flushClassSyncMicrotasks()
    expect(dom.classList.contains('xr-spatial-default')).toBe(true)
    expect(dom.classList.contains('bar-xr-spatial-default-extra')).toBe(true)
    expect(task.className).toBe(dom.className)
  })

  it('deduplicates repeated null callback ref dispatches', () => {
    const fn = vi.fn()
    const proxy = new SpatialContainerRefProxy<any>(fn as any)

    proxy.updateTransformVisibilityTaskContainerDom(null)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenLastCalledWith(null)
    fn.mockClear()

    proxy.updateTransformVisibilityTaskContainerDom(null)
    expect(fn).not.toHaveBeenCalled()
  })

  it('deduplicates non-null callback when Standard dom unchanged', () => {
    const fn = vi.fn()
    const proxy = new SpatialContainerRefProxy<any>(fn as any)
    const dom = document.createElement('div')
    const task = document.createElement('div')

    proxy.updateStandardSpatializedContainerDom(dom)
    proxy.updateTransformVisibilityTaskContainerDom(task)
    fn.mockClear()

    proxy.updateStandardSpatializedContainerDom(dom)
    proxy.updateTransformVisibilityTaskContainerDom(task)
    expect(fn).not.toHaveBeenCalled()
  })

  it('does not re-dispatch same proxy when updateRef repeats with same callback ref', () => {
    const fn = vi.fn()
    const proxy = new SpatialContainerRefProxy<any>(fn as any)
    const dom = document.createElement('div')
    const task = document.createElement('div')

    proxy.updateStandardSpatializedContainerDom(dom)
    proxy.updateTransformVisibilityTaskContainerDom(task)
    expect(fn).toHaveBeenCalledTimes(2)
    expect(fn).toHaveBeenNthCalledWith(1, null)
    expect(fn).toHaveBeenNthCalledWith(2, expect.any(Object))
    fn.mockClear()

    proxy.updateRef(fn as any)
    expect(fn).not.toHaveBeenCalled()
  })

  it('supports extra ref props', () => {
    const ref = { current: null as any }
    const proxy = new SpatialContainerRefProxy<any>(ref, () => ({
      get foo() {
        return 'bar'
      },
    }))

    const dom = document.createElement('div')
    const task = document.createElement('div')

    proxy.updateStandardSpatializedContainerDom(dom)
    proxy.updateTransformVisibilityTaskContainerDom(task)

    expect((ref.current as any).foo).toBe('bar')
  })

  // PR #1194 review (P2 from Codex): document-level stylesheets do not
  // cross shadow boundaries, so a spatial container mounted inside a
  // ShadowRoot would lose the `.xr-spatial-default[data-xr-host]` hiding
  // rule and show the bare 2D placeholder. The proxy must inject the
  // stylesheet into the host's actual root tree on attach.
  it('injects spatial default stylesheet into the host shadow root', () => {
    const ref = { current: null as any }
    const proxy = new SpatialContainerRefProxy<any>(ref)

    const shadowMount = document.createElement('div')
    document.body.appendChild(shadowMount)
    const shadowRoot = shadowMount.attachShadow({ mode: 'open' })

    const host = document.createElement('div')
    shadowRoot.appendChild(host)
    const task = document.createElement('div')

    expect(
      shadowRoot.querySelector('style[data-xr-spatial-default-style]'),
    ).toBeNull()

    proxy.updateStandardSpatializedContainerDom(host)
    proxy.updateTransformVisibilityTaskContainerDom(task)

    const injected = shadowRoot.querySelector(
      'style[data-xr-spatial-default-style]',
    )
    expect(injected).not.toBeNull()
    expect(injected?.innerHTML).toContain('.xr-spatial-default[data-xr-host]')
    expect(injected?.innerHTML).toContain('translateZ(0)')

    // Idempotent: a second mount into the same shadow root must not add a
    // second copy.
    const host2 = document.createElement('div')
    shadowRoot.appendChild(host2)
    const proxy2 = new SpatialContainerRefProxy<any>({ current: null })
    proxy2.updateStandardSpatializedContainerDom(host2)

    expect(
      shadowRoot.querySelectorAll('style[data-xr-spatial-default-style]')
        .length,
    ).toBe(1)

    document.body.removeChild(shadowMount)
  })
})

describe('spatialized ref: xrClientDepth / xrOffsetBack', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  function attachDomProxy() {
    const ref = { current: null as any }
    const proxy = new SpatialContainerRefProxy<any>(ref)
    const dom = document.createElement('div')
    const task = document.createElement('div')
    proxy.updateStandardSpatializedContainerDom(dom)
    proxy.updateTransformVisibilityTaskContainerDom(task)
    return { dom, domProxy: ref.current as Record<string, unknown> }
  }

  it('`in` is false and get is undefined when supports is false', () => {
    vi.spyOn(core, 'supports').mockImplementation((name: string) => {
      if (name === 'xrClientDepth' || name === 'xrOffsetBack') return false
      return true
    })
    const { dom, domProxy } = attachDomProxy()
    dom.style.setProperty(SpatialCustomStyleVars.depth, '9px')
    dom.style.setProperty(SpatialCustomStyleVars.back, '8px')

    expect('xrClientDepth' in domProxy).toBe(false)
    expect('xrOffsetBack' in domProxy).toBe(false)
    expect(domProxy.xrClientDepth).toBeUndefined()
    expect(domProxy.xrOffsetBack).toBeUndefined()
  })

  it('`in` is true and get reads raw style vars when supports is true', () => {
    vi.spyOn(core, 'supports').mockReturnValue(true)
    const { dom, domProxy } = attachDomProxy()
    dom.style.setProperty(SpatialCustomStyleVars.depth, '9px')
    dom.style.setProperty(SpatialCustomStyleVars.back, '8px')

    expect('xrClientDepth' in domProxy).toBe(true)
    expect('xrOffsetBack' in domProxy).toBe(true)
    expect(domProxy.xrClientDepth).toBe('9px')
    expect(domProxy.xrOffsetBack).toBe('8px')
  })
})
