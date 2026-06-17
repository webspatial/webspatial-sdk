import { renderHook } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import { useBindSpatializedMotion } from './useBindSpatializedMotion'

function createBinding() {
  let explicitStyleOpacity: number | undefined
  let previousOpacitySuppression = false
  const opacityPlugin: any = {
    field: 'opacity' as const,
    captureAuthoredValue: vi.fn(
      ({ authoredInputs }: { authoredInputs: { opacity?: number } }) =>
        authoredInputs.opacity,
    ),
    resolveTerminalOwner: vi.fn(
      ({ authoredValue }: { authoredValue?: number }) =>
        authoredValue !== undefined ? 'authored' : 'native',
    ),
    resolveInnerStyle: vi.fn(() => ({ mode: 'default' as const })),
    resolveOuterSync: vi.fn(() => ({ mode: 'default' as const })),
  }
  return {
    __kind: 'spatializedMotion' as const,
    __propName: 'xr-animation' as const,
    __motionObjectId: 'motion-1',
    get __animating() {
      return false
    },
    __getSuppressedFields: vi.fn(() => new Set(['transform'])),
    __getTerminalOpacityOwner: vi.fn(() => null),
    __getExplicitStyleOpacity: vi.fn(() => explicitStyleOpacity),
    __setExplicitStyleOpacity: vi.fn((opacity?: number) => {
      explicitStyleOpacity = opacity
    }),
    __setTerminalOpacityOwner: vi.fn(),
    __getSupportedMotionOwnershipFields: vi.fn(() => ['opacity'] as const),
    __getMotionFieldPlugin: vi.fn(() => opacityPlugin),
    __getAuthoredFieldValue: vi.fn(() => explicitStyleOpacity),
    __setAuthoredFieldValue: vi.fn((field: string, value?: number) => {
      if (field === 'opacity') explicitStyleOpacity = value
    }),
    __getTerminalFieldOwner: vi.fn(() => null),
    __setTerminalFieldOwner: vi.fn(),
    __getPreviousFieldSuppression: vi.fn(() => previousOpacitySuppression),
    __setPreviousFieldSuppression: vi.fn(
      (field: string, suppressed: boolean) => {
        if (field === 'opacity') previousOpacitySuppression = suppressed
      },
    ),
    __setElement: vi.fn(),
    __onUnbind: vi.fn(),
  }
}

describe('useBindSpatializedMotion', () => {
  test('binds static3d targets and cleans up through __onUnbind only', () => {
    const binding = createBinding()
    const element = { id: 'model-1' }

    const { unmount } = renderHook(() =>
      useBindSpatializedMotion({
        binding,
        element: element as any,
        kind: 'static3d',
      }),
    )

    expect(binding.__setElement).toHaveBeenCalledTimes(1)
    expect(binding.__setElement).toHaveBeenCalledWith(element, 'static3d')

    unmount()

    expect(binding.__onUnbind).toHaveBeenCalledTimes(1)
    expect(binding.__setElement).toHaveBeenCalledTimes(1)
  })

  test('inactive cleanup only unbinds and clears suppressed fields for spatialized2d bindings', () => {
    const binding = createBinding()
    const element = { id: 'portal-1' }
    const onSuppressedFieldsChange = vi.fn()

    const { rerender, unmount } = renderHook(
      ({ active }) =>
        useBindSpatializedMotion({
          binding: active ? (binding as any) : undefined,
          element: active ? (element as any) : null,
          kind: 'spatialized2d',
          onSuppressedFieldsChange,
        }),
      {
        initialProps: { active: true },
      },
    )

    expect(onSuppressedFieldsChange).toHaveBeenCalledWith(
      new Set(['transform']),
    )
    expect(binding.__setElement).toHaveBeenCalledTimes(1)
    expect(binding.__setElement).toHaveBeenCalledWith(element, 'spatialized2d')

    rerender({ active: false })

    expect(binding.__onUnbind).toHaveBeenCalledTimes(1)
    expect(binding.__setElement).toHaveBeenCalledTimes(1)
    expect(onSuppressedFieldsChange).toHaveBeenLastCalledWith(null)

    unmount()

    expect(binding.__onUnbind).toHaveBeenCalledTimes(1)
  })

  test('does not unbind and rebind when only the suppressed-fields callback changes', () => {
    const binding = createBinding()
    const element = { id: 'portal-2' }
    const firstCallback = vi.fn()
    const secondCallback = vi.fn()

    const { rerender, unmount } = renderHook(
      ({ callback }) =>
        useBindSpatializedMotion({
          binding: binding as any,
          element: element as any,
          kind: 'spatialized2d',
          onSuppressedFieldsChange: callback,
        }),
      {
        initialProps: { callback: firstCallback },
      },
    )

    expect(binding.__setElement).toHaveBeenCalledTimes(1)
    expect(binding.__onUnbind).not.toHaveBeenCalled()

    rerender({ callback: secondCallback })

    expect(binding.__setElement).toHaveBeenCalledTimes(1)
    expect(binding.__onUnbind).not.toHaveBeenCalled()

    unmount()

    expect(binding.__onUnbind).toHaveBeenCalledTimes(1)
    expect(binding.__setElement).toHaveBeenCalledTimes(1)
  })

  test('cleanup does not call __setElement(null) after __onUnbind', () => {
    const binding = createBinding()
    const element = { id: 'portal-1' }

    const { unmount } = renderHook(() =>
      useBindSpatializedMotion({
        binding: binding as any,
        element: element as any,
        kind: 'spatialized2d',
      }),
    )

    expect(binding.__setElement).toHaveBeenCalledTimes(1)
    expect(binding.__setElement).toHaveBeenCalledWith(element, 'spatialized2d')

    unmount()

    expect(binding.__onUnbind).toHaveBeenCalledTimes(1)
    expect(binding.__setElement).toHaveBeenCalledTimes(1)
  })

  test('forwards explicit style.opacity metadata without inferring from computed CSS', () => {
    const binding = createBinding()
    const element = { id: 'portal-explicit-opacity' }
    binding.__getSuppressedFields.mockReturnValue(new Set(['opacity']))

    renderHook(() =>
      useBindSpatializedMotion({
        binding: binding as any,
        element: element as any,
        kind: 'spatialized2d',
        explicitStyleOpacity: 0.8,
      } as any),
    )

    expect(binding.__setAuthoredFieldValue).toHaveBeenCalledWith('opacity', 0.8)
  })

  test('marks terminal opacity owner when opacity suppression releases', () => {
    const binding = createBinding()
    const element = { id: 'portal-terminal-opacity' }
    binding.__getSuppressedFields.mockReturnValue(new Set(['opacity']))

    const { rerender } = renderHook(
      ({ opacity }) =>
        useBindSpatializedMotion({
          binding: binding as any,
          element: element as any,
          kind: 'spatialized2d',
          explicitStyleOpacity: opacity,
        } as any),
      {
        initialProps: { opacity: 0.8 },
      },
    )

    binding.__getSuppressedFields.mockReturnValue(null as any)
    rerender({ opacity: 0.8 })

    expect(binding.__setTerminalFieldOwner).toHaveBeenCalledWith(
      'opacity',
      'authored',
    )
  })

  test('updating explicit style.opacity metadata does not trigger unbind or rebind', () => {
    const binding = createBinding()
    const element = { id: 'portal-explicit-opacity-rerender' }

    const { rerender, unmount } = renderHook(
      ({ opacity }) =>
        useBindSpatializedMotion({
          binding: binding as any,
          element: element as any,
          kind: 'spatialized2d',
          explicitStyleOpacity: opacity,
        } as any),
      {
        initialProps: { opacity: undefined as number | undefined },
      },
    )

    expect(binding.__setElement).toHaveBeenCalledTimes(1)
    expect(binding.__onUnbind).not.toHaveBeenCalled()

    rerender({ opacity: 0.8 })

    expect(binding.__setElement).toHaveBeenCalledTimes(1)
    expect(binding.__onUnbind).not.toHaveBeenCalled()

    unmount()

    expect(binding.__onUnbind).toHaveBeenCalledTimes(1)
  })

  test('captures authored opacity through the ownership plugin runtime while suppressed', () => {
    const binding = createBinding()
    const element = { id: 'portal-plugin-authored-capture' }
    binding.__getSuppressedFields.mockReturnValue(new Set(['opacity']))

    renderHook(() =>
      useBindSpatializedMotion({
        binding: binding as any,
        element: element as any,
        kind: 'spatialized2d',
        explicitStyleOpacity: 0.6,
      } as any),
    )

    expect(binding.__getMotionFieldPlugin).toHaveBeenCalledWith('opacity')
    expect(
      binding.__getMotionFieldPlugin.mock.results[0].value.captureAuthoredValue,
    ).toHaveBeenCalled()
    expect(binding.__setAuthoredFieldValue).toHaveBeenCalledWith('opacity', 0.6)
    expect(binding.__setTerminalFieldOwner).toHaveBeenCalledWith(
      'opacity',
      null,
    )
    expect(binding.__setPreviousFieldSuppression).toHaveBeenCalledWith(
      'opacity',
      true,
    )
  })

  test('resolves terminal owner through the ownership plugin runtime on release', () => {
    const binding = createBinding()
    const element = { id: 'portal-plugin-terminal-owner' }
    binding.__getSuppressedFields.mockReturnValue(new Set(['opacity']))

    const { rerender } = renderHook(
      ({ opacity }) =>
        useBindSpatializedMotion({
          binding: binding as any,
          element: element as any,
          kind: 'spatialized2d',
          explicitStyleOpacity: opacity,
        } as any),
      {
        initialProps: { opacity: 0.6 },
      },
    )

    binding.__getSuppressedFields.mockReturnValue(null as any)
    rerender({ opacity: 0.6 })

    expect(
      binding.__getMotionFieldPlugin.mock.results[0].value.resolveTerminalOwner,
    ).toHaveBeenCalled()
    expect(binding.__setTerminalFieldOwner).toHaveBeenCalledWith(
      'opacity',
      'authored',
    )
    expect(binding.__setPreviousFieldSuppression).toHaveBeenLastCalledWith(
      'opacity',
      false,
    )
  })
})
