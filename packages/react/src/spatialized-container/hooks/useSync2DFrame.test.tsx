import { act, render } from '@testing-library/react'
import type { SpatializedElement } from '@webspatial/core-sdk'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { PortalInstanceObject } from '../context/PortalInstanceContext'
import type { SpatializedContainerObject } from '../context/SpatializedContainerContext'
import { useSync2DFrame } from './useSync2DFrame'
import {
  __parentHeadSyncRegistryTest__,
  scheduleSyncParentHeadToChild,
} from '../../utils/windowStyleSync'

const actualScheduleSync = vi.hoisted(() => ({
  fn: null as typeof scheduleSyncParentHeadToChild | null,
}))

vi.mock('../../utils/windowStyleSync', async importOriginal => {
  const actual =
    await importOriginal<typeof import('../../utils/windowStyleSync')>()
  actualScheduleSync.fn = actual.scheduleSyncParentHeadToChild
  return {
    ...actual,
    scheduleSyncParentHeadToChild: vi.fn(actual.scheduleSyncParentHeadToChild),
  }
})

function createChildWindow() {
  return {
    document: document.implementation.createHTMLDocument(),
    Event,
  } as unknown as WindowProxy
}

function createSpatializedElement(childWindow: WindowProxy) {
  return { windowProxy: childWindow } as SpatializedElement & {
    windowProxy: WindowProxy
  }
}

function createHarness(options?: { spatializedElement?: SpatializedElement }) {
  const portalInstanceObject = {
    notify2DFrameChange: vi.fn(),
  } as unknown as PortalInstanceObject

  let handler: (() => void) | undefined
  const spatializedContainerObject = {
    on2DFrameChange: vi.fn((_spatialId: string, cb: () => void) => {
      handler = cb
    }),
    off2DFrameChange: vi.fn(),
  } as unknown as SpatializedContainerObject

  return {
    portalInstanceObject,
    spatializedContainerObject,
    spatializedElement: options?.spatializedElement,
    getHandler: () => handler,
  }
}

describe('useSync2DFrame', () => {
  beforeEach(() => {
    vi.mocked(scheduleSyncParentHeadToChild).mockReset()
    vi.mocked(scheduleSyncParentHeadToChild).mockImplementation((...args) =>
      actualScheduleSync.fn!(...args),
    )
  })

  afterEach(() => {
    document.head
      .querySelectorAll('style, link[rel="stylesheet"]')
      .forEach(node => node.remove())
    __parentHeadSyncRegistryTest__.reset()
    vi.useRealTimers()
  })

  it('schedules afterHostLayout head sync and defers re-render until sync completes', () => {
    const childWindow = createChildWindow()
    const {
      portalInstanceObject,
      spatializedContainerObject,
      spatializedElement,
    } = createHarness({
      spatializedElement: createSpatializedElement(childWindow),
    })

    const onCompletes: Array<() => void> = []
    vi.mocked(scheduleSyncParentHeadToChild).mockImplementation(
      (_childWindow, timing, onComplete) => {
        expect(timing).toBe('afterHostLayout')
        if (onComplete) onCompletes.push(onComplete)
      },
    )

    let renders = 0
    function Test() {
      renders += 1
      useSync2DFrame(
        's1',
        portalInstanceObject,
        spatializedContainerObject,
        spatializedElement,
      )
      return null
    }

    const { unmount } = render(<Test />)

    expect(portalInstanceObject.notify2DFrameChange).toHaveBeenCalled()
    expect(scheduleSyncParentHeadToChild).toHaveBeenCalledWith(
      childWindow,
      'afterHostLayout',
      expect.any(Function),
    )
    expect(renders).toBe(1)

    act(() => {
      onCompletes.forEach(onComplete => onComplete())
    })

    expect(renders).toBeGreaterThan(1)

    unmount()
    expect(spatializedContainerObject.off2DFrameChange).toHaveBeenCalledWith(
      's1',
    )
  })

  it('schedules afterHostLayout head sync when the 2D frame callback fires', () => {
    const childWindow = createChildWindow()
    const {
      portalInstanceObject,
      spatializedContainerObject,
      spatializedElement,
      getHandler,
    } = createHarness({
      spatializedElement: createSpatializedElement(childWindow),
    })

    render(
      <TestHarness
        spatialId="s1"
        portalInstanceObject={portalInstanceObject}
        spatializedContainerObject={spatializedContainerObject}
        spatializedElement={spatializedElement}
      />,
    )

    vi.mocked(scheduleSyncParentHeadToChild).mockClear()

    act(() => {
      getHandler()?.()
    })

    expect(portalInstanceObject.notify2DFrameChange).toHaveBeenCalled()
    expect(scheduleSyncParentHeadToChild).toHaveBeenCalledWith(
      childWindow,
      'afterHostLayout',
      expect.any(Function),
    )
  })

  it('re-renders immediately when no child window is available', () => {
    const { portalInstanceObject, spatializedContainerObject } = createHarness()

    let renders = 0
    function Test() {
      renders += 1
      useSync2DFrame('s1', portalInstanceObject, spatializedContainerObject)
      return null
    }

    render(<Test />)

    expect(scheduleSyncParentHeadToChild).not.toHaveBeenCalled()
    expect(renders).toBeGreaterThan(1)
  })

  it('syncs parent head styles to the portal before forcing a re-render', async () => {
    const childWindow = createChildWindow()
    const parentStyle = document.createElement('style')
    parentStyle.textContent = '.frame-sync { opacity: 0.5; }'
    document.head.appendChild(parentStyle)

    const {
      portalInstanceObject,
      spatializedContainerObject,
      spatializedElement,
    } = createHarness({
      spatializedElement: createSpatializedElement(childWindow),
    })

    render(
      <TestHarness
        spatialId="s1"
        portalInstanceObject={portalInstanceObject}
        spatializedContainerObject={spatializedContainerObject}
        spatializedElement={spatializedElement}
      />,
    )

    await Promise.resolve()
    await __parentHeadSyncRegistryTest__.flushPendingWaveForTest()

    expect(
      childWindow.document.head.querySelector('style[data-webspatial-sync="1"]')
        ?.textContent,
    ).toContain('opacity: 0.5')
  })
})

function TestHarness({
  spatialId,
  portalInstanceObject,
  spatializedContainerObject,
  spatializedElement,
}: {
  spatialId: string
  portalInstanceObject: PortalInstanceObject
  spatializedContainerObject: SpatializedContainerObject
  spatializedElement?: SpatializedElement
}) {
  useSync2DFrame(
    spatialId,
    portalInstanceObject,
    spatializedContainerObject,
    spatializedElement,
  )
  return null
}
