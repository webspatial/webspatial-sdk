import { describe, expect, it, vi } from 'vitest'
import { hijackGetComputedStyle, SpatialContainerRefProxy } from './useDomProxy'
import { SpatialCustomStyleVars } from '../types'

describe('SpatialContainerRefProxy', () => {
  it('writes ref only when both doms exist', () => {
    const ref = { current: null as any }
    const proxy = new SpatialContainerRefProxy<any>(ref)

    const dom = document.createElement('div')
    const task = document.createElement('div')

    proxy.updateStandardSpatializedContainerDom(dom)
    expect(ref.current).toBe(null)

    proxy.updateTransformVisibilityTaskContainerDom(task)
    expect(ref.current).not.toBe(null)
    expect((ref.current as any).__raw).toBe(dom)
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
    expect(dom.style.getPropertyValue('transform')).toBe('none')
    expect(dom.style.getPropertyValue('visibility')).toBe('hidden')
  })

  it('intercepts removeAttribute for style and class', () => {
    const ref = { current: null as any }
    const proxy = new SpatialContainerRefProxy<any>(ref)
    const dom = document.createElement('div')
    const task = document.createElement('div')

    proxy.updateStandardSpatializedContainerDom(dom)
    proxy.updateTransformVisibilityTaskContainerDom(task)
    const domProxy = ref.current as any

    domProxy.className = 'a'
    expect(dom.className).toContain('xr-spatial-default')
    expect(task.className).toBe(dom.className)

    domProxy.style.visibility = 'hidden'
    domProxy.style.transform = 'translateX(1px)'
    expect(task.style.visibility).toBe('hidden')
    expect(task.style.transform).toBe('translateX(1px)')

    domProxy.removeAttribute('style')
    expect(dom.style.getPropertyValue('visibility')).toBe('hidden')
    expect(dom.style.getPropertyValue('transform')).toBe('none')
    expect(task.style.getPropertyValue('visibility')).toBe('')
    expect(task.style.getPropertyValue('transform')).toBe('')

    domProxy.removeAttribute('class')
    expect(domProxy.className).toBe('xr-spatial-default')
  })

  it('syncs classList changes to task container', () => {
    const ref = { current: null as any }
    const proxy = new SpatialContainerRefProxy<any>(ref)
    const dom = document.createElement('div')
    const task = document.createElement('div')

    proxy.updateStandardSpatializedContainerDom(dom)
    proxy.updateTransformVisibilityTaskContainerDom(task)

    dom.classList.add('x')
    expect(task.className).toBe(dom.className)

    dom.classList.remove('x')
    expect(task.className).toBe(dom.className)
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
})

describe('hijackGetComputedStyle', () => {
  it('routes proxy elements to raw dom', () => {
    const raw = vi.fn().mockReturnValue({} as any)
    const orig = window.getComputedStyle
    window.getComputedStyle = raw as any

    hijackGetComputedStyle()

    const ref = { current: null as any }
    const proxy = new SpatialContainerRefProxy<any>(ref)
    const dom = document.createElement('div')
    const task = document.createElement('div')
    proxy.updateStandardSpatializedContainerDom(dom)
    proxy.updateTransformVisibilityTaskContainerDom(task)

    window.getComputedStyle(ref.current as any)
    expect(raw).toHaveBeenCalledWith(dom, undefined)

    window.getComputedStyle = orig
  })
})
