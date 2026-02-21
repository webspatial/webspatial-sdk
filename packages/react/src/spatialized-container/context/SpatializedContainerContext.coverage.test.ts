import { describe, expect, it, vi } from 'vitest'
import { SpatializedContainerObject } from './SpatializedContainerContext'
import { SpatialID } from '../SpatialID'

describe('SpatializedContainerObject', () => {
  it('notifies 2d frame changes and supports on/off', () => {
    const obj = new SpatializedContainerObject()
    const fn = vi.fn()
    obj.on2DFrameChange('a', fn)
    expect(fn).not.toHaveBeenCalled()

    const root = document.createElement('div')
    root.setAttribute(SpatialID, 'root')
    obj.notify2DFramePlaceHolderChange(root)
    expect(fn).toHaveBeenCalledTimes(1)

    obj.off2DFrameChange('a')
    obj.notify2DFramePlaceHolderChange(root)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('queries spatial dom and caches results', () => {
    const obj = new SpatializedContainerObject()
    const root = document.createElement('div')
    root.setAttribute(SpatialID, 'root')
    const child = document.createElement('div')
    child.setAttribute(SpatialID, 'child')
    root.appendChild(child)
    obj.notify2DFramePlaceHolderChange(root)

    expect(obj.querySpatialDomBySpatialId('root')).toBe(root)
    expect(obj.querySpatialDomBySpatialId('child')).toBe(child)
    expect(obj.querySpatialDomBySpatialId('child')).toBe(child)
  })

  it('finds parent spatial dom for nested elements', () => {
    const obj = new SpatializedContainerObject()
    const root = document.createElement('div')
    root.setAttribute(SpatialID, 'root')
    const parent = document.createElement('div')
    parent.setAttribute(SpatialID, 'p')
    const mid = document.createElement('div')
    const child = document.createElement('div')
    child.setAttribute(SpatialID, 'c')
    root.appendChild(parent)
    parent.appendChild(mid)
    mid.appendChild(child)
    obj.notify2DFramePlaceHolderChange(root)

    expect(obj.queryParentSpatialDomBySpatialId('c')).toBe(parent)
    expect(obj.queryParentSpatialDomBySpatialId('c')).toBe(parent)
    expect(obj.queryParentSpatialDomBySpatialId('root')).toBe(null)
  })

  it('manages transform/visibility subscriptions', () => {
    const obj = new SpatializedContainerObject()
    const calls: any[] = []
    const cb = (v: any) => calls.push(v)

    obj.onSpatialTransformVisibilityChange('s', cb)
    expect(calls).toHaveLength(0)

    obj.updateSpatialTransformVisibility('s', {
      transform: [],
      visibility: 'visible',
    } as any)
    expect(calls).toHaveLength(1)

    obj.onSpatialTransformVisibilityChange('s', cb)
    expect(calls).toHaveLength(2)

    obj.offSpatialTransformVisibilityChange('s', cb)
    obj.updateSpatialTransformVisibility('s', {
      transform: [],
      visibility: 'hidden',
    } as any)
    expect(calls).toHaveLength(2)
  })

  it('stores and retrieves container ref proxy by spatialId', () => {
    const obj = new SpatializedContainerObject<any>()
    const proxy = { tag: 'p' } as any
    obj.updateSpatialContainerRefProxyInfo('s', proxy)
    expect(obj.getSpatialContainerRefProxyBySpatialId('s')).toBe(proxy)
  })

  it('generates stable sequences per layer and instance type', () => {
    const obj = new SpatializedContainerObject()
    expect(obj.getSpatialId(1, true, 'n')).toBe('n_1_0')
    expect(obj.getSpatialId(1, true, 'n')).toBe('n_1_1')
    expect(obj.getSpatialId(1, false, 'n')).toBe('n_1_0')
    expect(obj.getSpatialId(2, false, 'x')).toBe('x_2_0')
  })
})
