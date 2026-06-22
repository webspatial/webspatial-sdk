import { renderHook } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import { useBindSpatializedMotion } from './useBindSpatializedMotion'

function createBinding() {
  let explicitStyleOpacity: number | undefined
  let explicitStyleTransform: string | undefined
  let terminalOpacityOwner: 'authored' | 'native' | null = null
  let terminalTransformOwner: 'authored' | 'native' | null = null
  let previousOpacitySuppression = false
  let previousTransformSuppression = false
  const opacityPlugin: any = {
    field: 'opacity' as const,
    readAuthoredValue: vi.fn(
      ({
        authoredInputs,
      }: {
        authoredInputs: { style?: { opacity?: number } }
      }) => authoredInputs.style?.opacity,
    ),
    captureAuthoredValue: vi.fn(
      ({
        authoredInputs,
      }: {
        authoredInputs: { style?: { opacity?: number } }
      }) => authoredInputs.style?.opacity,
    ),
    resolveTerminalOwner: vi.fn(
      ({ authoredValue }: { authoredValue?: number }) =>
        authoredValue !== undefined ? 'authored' : 'native',
    ),
    resolveInnerStyle: vi.fn(() => ({ mode: 'default' as const })),
    resolveOuterSync: vi.fn(() => ({ mode: 'default' as const })),
  }
  const transformPlugin: any = {
    field: 'transform' as const,
    readAuthoredValue: vi.fn(
      ({
        authoredInputs,
      }: {
        authoredInputs: { style?: { transform?: string } }
      }) => authoredInputs.style?.transform,
    ),
    captureAuthoredValue: vi.fn(
      ({
        authoredInputs,
      }: {
        authoredInputs: { style?: { transform?: string } }
      }) => authoredInputs.style?.transform,
    ),
    resolveTerminalOwner: vi.fn(
      ({ authoredValue }: { authoredValue?: string }) =>
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
    __getTerminalOpacityOwner: vi.fn(() => terminalOpacityOwner),
    __getTerminalTransformOwner: vi.fn(() => terminalTransformOwner),
    __getExplicitStyleOpacity: vi.fn(() => explicitStyleOpacity),
    __getExplicitStyleTransform: vi.fn(() => explicitStyleTransform),
    __setExplicitStyleOpacity: vi.fn((opacity?: number) => {
      explicitStyleOpacity = opacity
    }),
    __setExplicitStyleTransform: vi.fn((transform?: string) => {
      explicitStyleTransform = transform
    }),
    __setTerminalOpacityOwner: vi.fn((owner?: 'authored' | 'native' | null) => {
      terminalOpacityOwner = owner ?? null
    }),
    __setTerminalTransformOwner: vi.fn(),
    __getSupportedMotionOwnershipFields: vi.fn(
      () => ['opacity', 'transform'] as const,
    ),
    __getMotionFieldPlugin: vi.fn((field: string) =>
      field === 'transform' ? transformPlugin : opacityPlugin,
    ),
    __getAuthoredFieldValue: vi.fn((field: string) =>
      field === 'transform' ? explicitStyleTransform : explicitStyleOpacity,
    ),
    __setAuthoredFieldValue: vi.fn((field: string, value?: number | string) => {
      if (field === 'opacity')
        explicitStyleOpacity = value as number | undefined
      if (field === 'transform')
        explicitStyleTransform = value as string | undefined
    }),
    __getTerminalFieldOwner: vi.fn((field: string) =>
      field === 'transform' ? terminalTransformOwner : terminalOpacityOwner,
    ),
    __setTerminalFieldOwner: vi.fn(
      (field: string, owner: 'authored' | 'native' | null) => {
        if (field === 'transform') terminalTransformOwner = owner
        if (field === 'opacity') terminalOpacityOwner = owner
      },
    ),
    __getPreviousFieldSuppression: vi.fn((field: string) =>
      field === 'transform'
        ? previousTransformSuppression
        : previousOpacitySuppression,
    ),
    __setPreviousFieldSuppression: vi.fn(
      (field: string, suppressed: boolean) => {
        if (field === 'opacity') previousOpacitySuppression = suppressed
        if (field === 'transform') previousTransformSuppression = suppressed
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

  test('forwards authored style.opacity metadata without inferring from computed CSS', () => {
    const binding = createBinding()
    const element = { id: 'portal-explicit-opacity' }
    binding.__getSuppressedFields.mockReturnValue(new Set(['opacity']))

    renderHook(() =>
      useBindSpatializedMotion({
        binding: binding as any,
        element: element as any,
        kind: 'spatialized2d',
        style: { opacity: 0.8 },
      } as any),
    )

    expect(binding.__setAuthoredFieldValue).toHaveBeenCalledWith('opacity', 0.8)
  })

  test('captures authored opacity from descriptor-driven style input without field-specific wiring', () => {
    const binding = createBinding()
    const element = { id: 'portal-descriptor-style-opacity' }
    binding.__getSuppressedFields.mockReturnValue(new Set(['opacity']))

    renderHook(() =>
      useBindSpatializedMotion({
        binding: binding as any,
        element: element as any,
        kind: 'spatialized2d',
        style: {
          opacity: 0.8,
        },
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
          style: { opacity },
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

  test('updating authored style.opacity metadata does not trigger unbind or rebind', () => {
    const binding = createBinding()
    const element = { id: 'portal-explicit-opacity-rerender' }

    const { rerender, unmount } = renderHook(
      ({ opacity }) =>
        useBindSpatializedMotion({
          binding: binding as any,
          element: element as any,
          kind: 'spatialized2d',
          style: { opacity },
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

  test('captures authored opacity through the descriptor runtime while suppressed', () => {
    const binding = createBinding()
    const element = { id: 'portal-plugin-authored-capture' }
    binding.__getSuppressedFields.mockReturnValue(new Set(['opacity']))

    renderHook(() =>
      useBindSpatializedMotion({
        binding: binding as any,
        element: element as any,
        kind: 'spatialized2d',
        style: { opacity: 0.6 },
      } as any),
    )

    expect(binding.__getMotionFieldPlugin).toHaveBeenCalledWith('opacity')
    expect(
      binding.__getMotionFieldPlugin.mock.results[0].value.readAuthoredValue,
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
          style: { opacity },
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
    expect(binding.__setPreviousFieldSuppression).toHaveBeenCalledWith(
      'opacity',
      false,
    )
  })

  test('notifies terminal transform owner before suppression release callbacks', () => {
    const binding = createBinding()
    const element = { id: 'portal-transform-release-order' }
    const calls: string[] = []
    binding.__getSuppressedFields.mockReturnValue(new Set(['transform']))

    const { rerender } = renderHook(() =>
      useBindSpatializedMotion({
        binding: binding as any,
        element: element as any,
        kind: 'dynamic3d',
        onSuppressedFieldsChange: suppressedFields => {
          calls.push(
            suppressedFields?.has('transform')
              ? 'suppressed:transform'
              : 'suppressed:none',
          )
        },
        onTerminalTransformOwnerChange: owner => {
          calls.push(`owner:${owner}`)
        },
      }),
    )

    calls.length = 0
    binding.__getSuppressedFields.mockReturnValue(null as any)
    rerender()

    expect(calls).toEqual(['owner:native', 'suppressed:none'])
  })
})
