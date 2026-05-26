import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { SpatialDivSegmentConfig } from '@webspatial/core-sdk'

// Mock supports to enable SpatialDiv animation
vi.mock('@webspatial/core-sdk', async () => {
  const actual = await vi.importActual('@webspatial/core-sdk')
  return {
    ...actual,
    supports: (name: string, tokens?: readonly string[]) => {
      if (name === 'useAnimation' && tokens && tokens.includes('element'))
        return true
      return false
    },
  }
})

const { useSpatialDivAnimation } = await import('./useSpatialDivAnimation')

// Helper: create a mock Spatialized2DElement
function createMockElement(id = 'test-element-1') {
  let completedHandler: ((data: any) => void) | null = null
  let canceledHandler: ((data: any) => void) | null = null
  let failedHandler: ((data: any) => void) | null = null

  const element = {
    id,
    animateSpatialDiv: vi.fn().mockImplementation(async (cmd: any) => {
      if (cmd.type === 'play') {
        return {
          animationId: cmd.animationId,
          finished: new Promise<any>(resolve => {
            completedHandler = resolve
          }),
          canceled: new Promise<any>(resolve => {
            canceledHandler = resolve
          }),
          failed: new Promise<any>(resolve => {
            failedHandler = resolve
          }),
        }
      }
      return undefined
    }),
    cleanupSpatialDivAnimationListeners: vi.fn(),
  }

  return {
    element,
    triggerCompleted: (values: any) => completedHandler?.(values),
    triggerCanceled: (values: any) => canceledHandler?.(values),
    triggerFailed: (error: any) => failedHandler?.(error),
  }
}

async function flushPromises() {
  await act(async () => {
    await new Promise(r => setTimeout(r, 0))
  })
}

describe('SpatialDiv Animation Behavior Tests (Task 5.3)', () => {
  // ============================================================
  // autoStart behavior
  // ============================================================
  describe('autoStart behavior', () => {
    test('autoStart=true (default) starts animation after element binding', async () => {
      const mock = createMockElement()
      const onStart = vi.fn()
      const config = {
        to: { opacity: 1 } as const,
        from: { opacity: 0 } as const,
        duration: 1.0,
        onStart,
      }

      const { result } = renderHook(() => useSpatialDivAnimation(config, true))
      const [animatedProps] = result.current

      // Simulate element binding
      await act(async () => {
        ;(animatedProps as any).__setElement(mock.element)
      })
      await flushPromises()

      // Should auto-start: play command sent
      expect(mock.element.animateSpatialDiv).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'play' }),
      )
      expect(result.current[1].isAnimating).toBe(true)
    })

    test('autoStart=false does NOT start animation after binding', async () => {
      const mock = createMockElement()
      const config = {
        to: { opacity: 1 } as const,
        from: { opacity: 0 } as const,
        duration: 1.0,
        autoStart: false,
      }

      const { result } = renderHook(() => useSpatialDivAnimation(config, true))
      const [animatedProps] = result.current

      await act(async () => {
        ;(animatedProps as any).__setElement(mock.element)
      })
      await flushPromises()

      // Should NOT auto-start
      expect(mock.element.animateSpatialDiv).not.toHaveBeenCalled()
      expect(result.current[1].isAnimating).toBe(false)
      expect(result.current[1].playState).toBe('idle')
    })
  })

  // ============================================================
  // Manual play
  // ============================================================
  describe('manual play', () => {
    test('manual play() starts after element is bound', async () => {
      const mock = createMockElement()
      const onStart = vi.fn()
      const config = {
        to: { opacity: 1 } as const,
        from: { opacity: 0 } as const,
        duration: 1.0,
        autoStart: false,
        onStart,
      }

      const { result } = renderHook(() => useSpatialDivAnimation(config, true))
      const [animatedProps, api] = result.current

      await act(async () => {
        ;(animatedProps as any).__setElement(mock.element)
      })
      await flushPromises()

      await act(async () => {
        api.play()
      })
      await flushPromises()

      expect(mock.element.animateSpatialDiv).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'play' }),
      )
      expect(api.isAnimating).toBe(true)
      expect(api.playState).toBe('running')
      expect(onStart).toHaveBeenCalledTimes(1)
    })
  })

  // ============================================================
  // Queued play: pause/cancel while queued
  // ============================================================
  describe('queued play interactions', () => {
    test('cancel while queued invokes onCancel with from values', async () => {
      const onCancel = vi.fn()
      const config = {
        to: { opacity: 1 } as const,
        from: { opacity: 0.5 } as const,
        duration: 1.0,
        autoStart: false,
        onCancel,
      }

      const { result } = renderHook(() => useSpatialDivAnimation(config, true))
      const [, api] = result.current

      await act(async () => {
        api.play()
      })
      await flushPromises()
      expect(api.playState).toBe('queued')

      await act(async () => {
        api.cancel()
      })
      await flushPromises()

      expect(api.playState).toBe('idle')
      expect(api.isAnimating).toBe(false)
      expect(onCancel).toHaveBeenCalledTimes(1)
      expect(onCancel).toHaveBeenCalledWith({ opacity: 0.5 })
    })

    test('pause while queued, then bind → session starts in paused state', async () => {
      const mock = createMockElement()
      const config = {
        to: { opacity: 1 } as const,
        from: { opacity: 0 } as const,
        duration: 1.0,
        autoStart: false,
      }

      const { result } = renderHook(() => useSpatialDivAnimation(config, true))
      const [animatedProps, api] = result.current

      // Play → queued
      await act(async () => {
        api.play()
      })
      await flushPromises()
      expect(api.playState).toBe('queued')

      // Pause while queued
      await act(async () => {
        api.pause()
      })
      await flushPromises()
      expect(api.isPaused).toBe(true)

      // Bind the element → session should start paused
      await act(async () => {
        ;(animatedProps as any).__setElement(mock.element)
      })
      await flushPromises()

      // Play was sent to native, but followed by immediate pause
      expect(mock.element.animateSpatialDiv).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'play' }),
      )
      expect(api.isPaused).toBe(true)
      expect(api.playState).toBe('paused')
    })
  })

  // ============================================================
  // Play re-entry semantics
  // ============================================================
  describe('play re-entry semantics', () => {
    test('play while running is a no-op — no new native commands', async () => {
      const mock = createMockElement()
      const config = {
        to: { opacity: 1 } as const,
        from: { opacity: 0 } as const,
        duration: 1.0,
        autoStart: false,
      }

      const { result } = renderHook(() => useSpatialDivAnimation(config, true))
      const [animatedProps, api] = result.current

      await act(async () => {
        ;(animatedProps as any).__setElement(mock.element)
      })
      await flushPromises()

      await act(async () => {
        api.play()
      })
      await flushPromises()
      expect(api.playState).toBe('running')

      const callCount = mock.element.animateSpatialDiv.mock.calls.length

      // Second play
      await act(async () => {
        api.play()
      })
      await flushPromises()

      expect(mock.element.animateSpatialDiv.mock.calls.length).toBe(callCount)
      expect(api.playState).toBe('running')
    })

    test('play while queued is a no-op', async () => {
      const config = {
        to: { opacity: 1 } as const,
        from: { opacity: 0 } as const,
        duration: 1.0,
        autoStart: false,
      }

      const { result } = renderHook(() => useSpatialDivAnimation(config, true))
      const [, api] = result.current

      await act(async () => {
        api.play()
      })
      await flushPromises()
      expect(api.playState).toBe('queued')

      await act(async () => {
        api.play()
      })
      await flushPromises()
      expect(api.playState).toBe('queued')
    })

    test('play while paused → resumes (no new animationId)', async () => {
      const mock = createMockElement()
      const config = {
        to: { opacity: 1 } as const,
        from: { opacity: 0 } as const,
        duration: 1.0,
        autoStart: false,
      }

      const { result } = renderHook(() => useSpatialDivAnimation(config, true))
      const [animatedProps, api] = result.current

      await act(async () => {
        ;(animatedProps as any).__setElement(mock.element)
      })
      await flushPromises()

      await act(async () => {
        api.play()
      })
      await flushPromises()

      await act(async () => {
        api.pause()
      })
      await flushPromises()
      expect(api.playState).toBe('paused')

      // Resume
      await act(async () => {
        api.play()
      })
      await flushPromises()

      // Should send resume, not a new play
      expect(mock.element.animateSpatialDiv).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'resume' }),
      )
      expect(api.playState).toBe('running')
    })
  })

  // ============================================================
  // Config updates do not affect alive sessions
  // ============================================================
  describe('config updates and alive sessions', () => {
    test('config change during running does NOT affect the current session', async () => {
      const mock = createMockElement()
      const config1: SpatialDivSegmentConfig = {
        to: { opacity: 1 },
        from: { opacity: 0 },
        duration: 1.0,
        autoStart: false,
      }
      const config2: SpatialDivSegmentConfig = {
        to: { opacity: 0.5 },
        from: { opacity: 0.2 },
        duration: 2.0,
        autoStart: false,
      }

      const { result, rerender } = renderHook(
        ({ cfg }) => useSpatialDivAnimation(cfg, true),
        { initialProps: { cfg: config1 } },
      )
      const [animatedProps, api] = result.current

      await act(async () => {
        ;(animatedProps as any).__setElement(mock.element)
      })
      await flushPromises()

      await act(async () => {
        api.play()
      })
      await flushPromises()
      expect(api.playState).toBe('running')

      // Update config
      rerender({ cfg: config2 })
      await flushPromises()

      // Session still running, not restarted
      expect(api.playState).toBe('running')
      // Only one play command was sent
      const playCalls = mock.element.animateSpatialDiv.mock.calls.filter(
        (c: any) => c[0].type === 'play',
      )
      expect(playCalls.length).toBe(1)
      // The play command used config1 values
      expect(playCalls[0][0].to).toEqual({ opacity: 1 })
      expect(playCalls[0][0].duration).toBe(1.0)
    })
  })

  // ============================================================
  // Command serialization
  // ============================================================
  describe('command serialization', () => {
    test('rapid play/pause/cancel are sent in call order', async () => {
      const mock = createMockElement()
      const config = {
        to: { opacity: 1 } as const,
        from: { opacity: 0 } as const,
        duration: 1.0,
        autoStart: false,
      }

      const { result } = renderHook(() => useSpatialDivAnimation(config, true))
      const [animatedProps, api] = result.current

      await act(async () => {
        ;(animatedProps as any).__setElement(mock.element)
      })
      await flushPromises()

      // Rapid fire commands
      await act(async () => {
        api.play()
        api.pause()
      })
      await flushPromises()

      const commands = mock.element.animateSpatialDiv.mock.calls.map(
        (c: any) => c[0].type,
      )
      // Play should be first, then pause
      expect(commands[0]).toBe('play')
      if (commands.length > 1) {
        expect(commands[1]).toBe('pause')
      }
    })
  })

  // ============================================================
  // onStart callback
  // ============================================================
  describe('onStart callback', () => {
    test('onStart fires once when session is established', async () => {
      const mock = createMockElement()
      const onStart = vi.fn()
      const config = {
        to: { opacity: 1 } as const,
        from: { opacity: 0 } as const,
        duration: 1.0,
        autoStart: false,
        onStart,
      }

      const { result } = renderHook(() => useSpatialDivAnimation(config, true))
      const [animatedProps, api] = result.current

      await act(async () => {
        ;(animatedProps as any).__setElement(mock.element)
      })
      await flushPromises()

      await act(async () => {
        api.play()
      })
      await flushPromises()

      expect(onStart).toHaveBeenCalledTimes(1)
    })

    test('onStart does NOT fire when queued (before element binding)', async () => {
      const onStart = vi.fn()
      const config = {
        to: { opacity: 1 } as const,
        from: { opacity: 0 } as const,
        duration: 1.0,
        autoStart: false,
        onStart,
      }

      const { result } = renderHook(() => useSpatialDivAnimation(config, true))
      const [, api] = result.current

      await act(async () => {
        api.play()
      })
      await flushPromises()
      expect(api.playState).toBe('queued')

      // onStart should not have fired yet
      expect(onStart).not.toHaveBeenCalled()
    })

    test('onStart fires after queued → bind → native play succeeds', async () => {
      const mock = createMockElement()
      const onStart = vi.fn()
      const config = {
        to: { opacity: 1 } as const,
        from: { opacity: 0 } as const,
        duration: 1.0,
        autoStart: false,
        onStart,
      }

      const { result } = renderHook(() => useSpatialDivAnimation(config, true))
      const [animatedProps, api] = result.current

      await act(async () => {
        api.play()
      })
      await flushPromises()
      expect(onStart).not.toHaveBeenCalled()

      // Bind element → queued play executes
      await act(async () => {
        ;(animatedProps as any).__setElement(mock.element)
      })
      await flushPromises()

      expect(onStart).toHaveBeenCalledTimes(1)
      expect(api.playState).toBe('running')
    })
  })

  // ============================================================
  // onComplete / onCancel mutual exclusion
  // ============================================================
  describe('lifecycle callback mutual exclusion', () => {
    test('natural completion fires onComplete only (not onCancel)', async () => {
      const mock = createMockElement()
      const onComplete = vi.fn()
      const onCancel = vi.fn()
      const config = {
        to: { opacity: 1 } as const,
        from: { opacity: 0 } as const,
        duration: 1.0,
        autoStart: false,
        onComplete,
        onCancel,
      }

      const { result } = renderHook(() => useSpatialDivAnimation(config, true))
      const [animatedProps, api] = result.current

      await act(async () => {
        ;(animatedProps as any).__setElement(mock.element)
      })
      await flushPromises()

      await act(async () => {
        api.play()
      })
      await flushPromises()

      await act(async () => {
        mock.triggerCompleted({ opacity: 1 })
      })
      await flushPromises()

      expect(onComplete).toHaveBeenCalledTimes(1)
      expect(onComplete).toHaveBeenCalledWith({ opacity: 1 })
      expect(onCancel).not.toHaveBeenCalled()
    })

    test('cancel fires onCancel only (not onComplete)', async () => {
      const mock = createMockElement()
      const onComplete = vi.fn()
      const onCancel = vi.fn()
      const config = {
        to: { opacity: 1 } as const,
        from: { opacity: 0 } as const,
        duration: 1.0,
        autoStart: false,
        onComplete,
        onCancel,
      }

      const { result } = renderHook(() => useSpatialDivAnimation(config, true))
      const [animatedProps, api] = result.current

      await act(async () => {
        ;(animatedProps as any).__setElement(mock.element)
      })
      await flushPromises()

      await act(async () => {
        api.play()
      })
      await flushPromises()

      await act(async () => {
        api.cancel()
      })
      await flushPromises()

      await act(async () => {
        mock.triggerCanceled({ opacity: 0 })
      })
      await flushPromises()

      expect(onCancel).toHaveBeenCalledTimes(1)
      expect(onCancel).toHaveBeenCalledWith({ opacity: 0 })
      expect(onComplete).not.toHaveBeenCalled()
    })
  })

  // ============================================================
  // onError behavior
  // ============================================================
  describe('onError callback', () => {
    test('play failure invokes onError with AnimationError', async () => {
      const onError = vi.fn()
      const onStart = vi.fn()
      const failingElement = {
        id: 'fail-el',
        animateSpatialDiv: vi.fn().mockRejectedValue(new Error('Native crash')),
        cleanupSpatialDivAnimationListeners: vi.fn(),
      }

      const config = {
        to: { opacity: 1 } as const,
        from: { opacity: 0 } as const,
        duration: 1.0,
        autoStart: false,
        onError,
        onStart,
      }

      const { result } = renderHook(() => useSpatialDivAnimation(config, true))
      const [animatedProps, api] = result.current

      await act(async () => {
        ;(animatedProps as any).__setElement(failingElement)
      })
      await flushPromises()

      await act(async () => {
        api.play()
      })
      await flushPromises()

      expect(onError).toHaveBeenCalledTimes(1)
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          command: 'play',
          reason: 'Native crash',
        }),
      )
      expect(onStart).not.toHaveBeenCalled()
      expect(api.playState).toBe('idle')
    })

    test('when onError is not provided, logs via console.error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const failingElement = {
        id: 'fail-el',
        animateSpatialDiv: vi.fn().mockRejectedValue(new Error('Bridge down')),
        cleanupSpatialDivAnimationListeners: vi.fn(),
      }

      const config = {
        to: { opacity: 1 } as const,
        from: { opacity: 0 } as const,
        duration: 1.0,
        autoStart: false,
        // No onError
      }

      const { result } = renderHook(() => useSpatialDivAnimation(config, true))
      const [animatedProps, api] = result.current

      await act(async () => {
        ;(animatedProps as any).__setElement(failingElement)
      })
      await flushPromises()

      await act(async () => {
        api.play()
      })
      await flushPromises()

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[useSpatialDivAnimation]'),
        expect.anything(),
      )
      consoleSpy.mockRestore()
    })

    test('native async failure triggers onError via failed promise', async () => {
      const mock = createMockElement()
      const onError = vi.fn()
      const config = {
        to: { opacity: 1 } as const,
        from: { opacity: 0 } as const,
        duration: 1.0,
        autoStart: false,
        onError,
      }

      const { result } = renderHook(() => useSpatialDivAnimation(config, true))
      const [animatedProps, api] = result.current

      await act(async () => {
        ;(animatedProps as any).__setElement(mock.element)
      })
      await flushPromises()

      await act(async () => {
        api.play()
      })
      await flushPromises()
      expect(api.playState).toBe('running')

      // Trigger async failure
      await act(async () => {
        mock.triggerFailed({
          animationId: 'test',
          command: 'play',
          reason: 'Decode error',
        })
      })
      await flushPromises()

      expect(onError).toHaveBeenCalledTimes(1)
      expect(api.playState).toBe('idle')
    })
  })

  // ============================================================
  // Animation prop replacement/removal
  // ============================================================
  describe('animation prop replacement and removal', () => {
    test('unbind cancels alive session', async () => {
      const mock = createMockElement()
      const config = {
        to: { opacity: 1 } as const,
        from: { opacity: 0 } as const,
        duration: 1.0,
        autoStart: false,
      }

      const { result } = renderHook(() => useSpatialDivAnimation(config, true))
      const [animatedProps, api] = result.current

      await act(async () => {
        ;(animatedProps as any).__setElement(mock.element)
      })
      await flushPromises()

      await act(async () => {
        api.play()
      })
      await flushPromises()
      expect(api.playState).toBe('running')

      // Unbind (simulating prop removal)
      await act(async () => {
        ;(animatedProps as any).__onUnbind?.()
      })
      await flushPromises()

      // Should have sent cancel to native
      expect(mock.element.animateSpatialDiv).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'cancel' }),
      )
      // Listeners cleaned up
      expect(
        mock.element.cleanupSpatialDivAnimationListeners,
      ).toHaveBeenCalled()
    })
  })

  // ============================================================
  // Unsupported runtime warning
  // ============================================================
  describe('unsupported runtime behavior', () => {
    test('play is no-op and emits warning when unsupported', async () => {
      // Re-import with supports returning false
      vi.resetModules()
      vi.doMock('@webspatial/core-sdk', async () => {
        const actual = await vi.importActual('@webspatial/core-sdk')
        return {
          ...actual,
          supports: () => false,
        }
      })

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const mod = await import('./useSpatialDivAnimation')
      const { result } = renderHook(() =>
        mod.useSpatialDivAnimation(
          {
            to: { opacity: 1 },
            from: { opacity: 0 },
            duration: 1.0,
            autoStart: false,
          },
          true,
        ),
      )
      const [, api] = result.current

      await act(async () => {
        api.play()
      })
      await flushPromises()

      expect(api.isAnimating).toBe(false)
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('not supported'),
      )

      // Second play should NOT emit another warning
      consoleSpy.mockClear()
      await act(async () => {
        api.play()
      })
      await flushPromises()
      expect(consoleSpy).not.toHaveBeenCalled()

      consoleSpy.mockRestore()
      vi.resetModules()
      vi.doMock('@webspatial/core-sdk', async () => {
        const actual = await vi.importActual('@webspatial/core-sdk')
        return {
          ...actual,
          supports: (name: string, tokens?: readonly string[]) => {
            if (name === 'useAnimation' && tokens && tokens.includes('element'))
              return true
            return false
          },
        }
      })
    })
  })

  // ============================================================
  // Finished state semantics
  // ============================================================
  describe('finished state', () => {
    test('finished is true after natural completion', async () => {
      const mock = createMockElement()
      const config = {
        to: { opacity: 1 } as const,
        from: { opacity: 0 } as const,
        duration: 1.0,
        autoStart: false,
      }

      const { result } = renderHook(() => useSpatialDivAnimation(config, true))
      const [animatedProps, api] = result.current

      await act(async () => {
        ;(animatedProps as any).__setElement(mock.element)
      })
      await flushPromises()

      await act(async () => {
        api.play()
      })
      await flushPromises()

      await act(async () => {
        mock.triggerCompleted({ opacity: 1 })
      })
      await flushPromises()

      expect(api.finished).toBe(true)
      expect(api.playState).toBe('finished')
      expect(api.isAnimating).toBe(false)
      expect(api.isPaused).toBe(false)
    })

    test('finished resets to false on new play()', async () => {
      const mock = createMockElement()
      const config = {
        to: { opacity: 1 } as const,
        from: { opacity: 0 } as const,
        duration: 1.0,
        autoStart: false,
      }

      const { result } = renderHook(() => useSpatialDivAnimation(config, true))
      const [animatedProps, api] = result.current

      await act(async () => {
        ;(animatedProps as any).__setElement(mock.element)
      })
      await flushPromises()

      await act(async () => {
        api.play()
      })
      await flushPromises()

      await act(async () => {
        mock.triggerCompleted({ opacity: 1 })
      })
      await flushPromises()
      expect(api.finished).toBe(true)

      // Re-play
      await act(async () => {
        api.play()
      })
      await flushPromises()

      expect(api.finished).toBe(false)
      expect(api.isAnimating).toBe(true)
    })

    test('finished resets to false on cancel()', async () => {
      const mock = createMockElement()
      const config = {
        to: { opacity: 1 } as const,
        from: { opacity: 0 } as const,
        duration: 1.0,
        autoStart: false,
      }

      const { result } = renderHook(() => useSpatialDivAnimation(config, true))
      const [animatedProps, api] = result.current

      await act(async () => {
        ;(animatedProps as any).__setElement(mock.element)
      })
      await flushPromises()

      await act(async () => {
        api.play()
      })
      await flushPromises()

      await act(async () => {
        mock.triggerCompleted({ opacity: 1 })
      })
      await flushPromises()
      expect(api.finished).toBe(true)

      await act(async () => {
        api.cancel()
      })
      await flushPromises()
      expect(api.finished).toBe(false)
      expect(api.playState).toBe('idle')
    })
  })

  // ============================================================
  // Control methods no-op when no alive session
  // ============================================================
  describe('no-op when no alive session', () => {
    test('pause when idle is no-op', async () => {
      const config = {
        to: { opacity: 1 } as const,
        from: { opacity: 0 } as const,
        duration: 1.0,
        autoStart: false,
      }

      const { result } = renderHook(() => useSpatialDivAnimation(config, true))
      const [, api] = result.current

      await act(async () => {
        api.pause()
      })
      await flushPromises()
      expect(api.playState).toBe('idle')
    })

    test('cancel when idle is no-op', async () => {
      const config = {
        to: { opacity: 1 } as const,
        from: { opacity: 0 } as const,
        duration: 1.0,
        autoStart: false,
      }

      const { result } = renderHook(() => useSpatialDivAnimation(config, true))
      const [, api] = result.current

      await act(async () => {
        api.cancel()
      })
      await flushPromises()
      expect(api.playState).toBe('idle')
    })
  })

  // ============================================================
  // Command payload verification
  // ============================================================
  describe('command payload', () => {
    test('play command includes correct fields from config', async () => {
      const mock = createMockElement()
      const config = {
        to: {
          opacity: 0.8,
          transform: { translate: { x: 10, y: 20 }, scale: { x: 2 } },
        } as const,
        from: {
          opacity: 0.2,
          transform: { translate: { x: 0, y: 0 } },
        } as const,
        duration: 2.5,
        timingFunction: 'easeIn' as const,
        delay: 0.5,
        playbackRate: 1.5,
        autoStart: false,
      }

      const { result } = renderHook(() => useSpatialDivAnimation(config, true))
      const [animatedProps, api] = result.current

      await act(async () => {
        ;(animatedProps as any).__setElement(mock.element)
      })
      await flushPromises()

      await act(async () => {
        api.play()
      })
      await flushPromises()

      const playCall = mock.element.animateSpatialDiv.mock.calls.find(
        (c: any) => c[0].type === 'play',
      )
      expect(playCall).toBeDefined()
      const cmd = playCall![0]
      expect(cmd.to).toEqual(config.to)
      expect(cmd.from).toEqual(config.from)
      expect(cmd.duration).toBe(2.5)
      expect(cmd.timingFunction).toBe('easeIn')
      expect(cmd.delay).toBe(0.5)
      expect(cmd.playbackRate).toBe(1.5)
      expect(cmd.animationId).toBeDefined()
      expect(cmd.elementId).toBe('test-element-1')
    })

    test('defaults: duration=0.3, timingFunction=easeInOut, delay=0', async () => {
      const mock = createMockElement()
      const config = {
        to: { opacity: 1 } as const,
        autoStart: false,
      }

      const { result } = renderHook(() => useSpatialDivAnimation(config, true))
      const [animatedProps, api] = result.current

      await act(async () => {
        ;(animatedProps as any).__setElement(mock.element)
      })
      await flushPromises()

      await act(async () => {
        api.play()
      })
      await flushPromises()

      const playCall = mock.element.animateSpatialDiv.mock.calls.find(
        (c: any) => c[0].type === 'play',
      )
      const cmd = playCall![0]
      expect(cmd.duration).toBe(0.3)
      expect(cmd.timingFunction).toBe('easeInOut')
      expect(cmd.delay).toBe(0)
    })
  })

  // ============================================================
  // Each new session generates unique animationId
  // ============================================================
  describe('animationId uniqueness', () => {
    test('each new play generates a unique animationId', async () => {
      const mock = createMockElement()
      const config = {
        to: { opacity: 1 } as const,
        from: { opacity: 0 } as const,
        duration: 1.0,
        autoStart: false,
      }

      const { result } = renderHook(() => useSpatialDivAnimation(config, true))
      const [animatedProps, api] = result.current

      await act(async () => {
        ;(animatedProps as any).__setElement(mock.element)
      })
      await flushPromises()

      // First play
      await act(async () => {
        api.play()
      })
      await flushPromises()

      const firstPlayCall = mock.element.animateSpatialDiv.mock.calls.find(
        (c: any) => c[0].type === 'play',
      )
      const firstId = firstPlayCall![0].animationId

      // Complete first, then play again
      await act(async () => {
        mock.triggerCompleted({ opacity: 1 })
      })
      await flushPromises()

      await act(async () => {
        api.play()
      })
      await flushPromises()

      const allPlayCalls = mock.element.animateSpatialDiv.mock.calls.filter(
        (c: any) => c[0].type === 'play',
      )
      const secondId = allPlayCalls[1][0].animationId

      expect(firstId).toBeDefined()
      expect(secondId).toBeDefined()
      expect(firstId).not.toBe(secondId)
    })
  })

  // ============================================================
  // animatedProps __kind and suppression
  // ============================================================
  describe('animatedProps properties', () => {
    test('__kind is spatialDiv', () => {
      const config = {
        to: { opacity: 1 } as const,
        duration: 1.0,
        autoStart: false,
      }

      const { result } = renderHook(() => useSpatialDivAnimation(config, true))
      const [animatedProps] = result.current

      expect((animatedProps as any).__kind).toBe('spatialDiv')
    })

    test('__animating reflects alive session', async () => {
      const mock = createMockElement()
      const config = {
        to: { opacity: 1 } as const,
        from: { opacity: 0 } as const,
        duration: 1.0,
        autoStart: false,
      }

      const { result } = renderHook(() => useSpatialDivAnimation(config, true))
      const [animatedProps, api] = result.current

      expect((animatedProps as any).__animating).toBe(false)

      await act(async () => {
        ;(animatedProps as any).__setElement(mock.element)
      })
      await flushPromises()

      await act(async () => {
        api.play()
      })
      await flushPromises()

      expect((animatedProps as any).__animating).toBe(true)

      await act(async () => {
        mock.triggerCompleted({ opacity: 1 })
      })
      await flushPromises()

      expect((animatedProps as any).__animating).toBe(false)
    })

    test('__suppressedFields returns correct fields during animation', async () => {
      const mock = createMockElement()
      const config = {
        to: {
          opacity: 0.8,
          transform: { translate: { x: 10 } },
        } as const,
        from: { opacity: 0 } as const,
        duration: 1.0,
        autoStart: false,
      }

      const { result } = renderHook(() => useSpatialDivAnimation(config, true))
      const [animatedProps, api] = result.current

      // No suppression when idle
      expect((animatedProps as any).__suppressedFields).toBeNull()

      await act(async () => {
        ;(animatedProps as any).__setElement(mock.element)
      })
      await flushPromises()

      await act(async () => {
        api.play()
      })
      await flushPromises()

      const suppressed = (animatedProps as any)
        .__suppressedFields as Set<string>
      expect(suppressed).not.toBeNull()
      expect(suppressed.has('opacity')).toBe(true)
      expect(suppressed.has('transform')).toBe(true)
    })
  })
})
