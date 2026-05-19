'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { bootSpatial } from './boot'
import { WebSpatialBootError } from './errors'

export type BootStatus = 'idle' | 'booting' | 'ready' | 'failed'

export type UseBootSpatialOptions = {
  /**
   * When `true` (default), invokes `bootSpatial()` once after mount.
   * Set to `false` to call `boot()` manually.
   */
  auto?: boolean
  onReady?: () => void
  onError?: (error: WebSpatialBootError) => void
}

export type UseBootSpatialResult = {
  status: BootStatus
  error: WebSpatialBootError | null
  /** (Re)run `bootSpatial()`. Updates `status` / `error` while in flight. */
  boot: () => Promise<void>
}

/**
 * Client hook that wraps `bootSpatial()` with boot progress state.
 * Does not gate rendering — use `<SpatialBoot gate>` or branch in JSX.
 */
export function useBootSpatial(
  options: UseBootSpatialOptions = {},
): UseBootSpatialResult {
  const { auto = true, onReady, onError } = options
  const [status, setStatus] = useState<BootStatus>('idle')
  const [error, setError] = useState<WebSpatialBootError | null>(null)
  const onReadyRef = useRef(onReady)
  const onErrorRef = useRef(onError)
  onReadyRef.current = onReady
  onErrorRef.current = onError

  const boot = useCallback(async () => {
    setStatus('booting')
    setError(null)
    try {
      await bootSpatial()
      setStatus('ready')
      onReadyRef.current?.()
    } catch (err: unknown) {
      if (err instanceof WebSpatialBootError) {
        setStatus('failed')
        setError(err)
        onErrorRef.current?.(err)
        return
      }
      throw err
    }
  }, [])

  useEffect(() => {
    if (!auto) return
    void boot()
  }, [auto, boot])

  return { status, error, boot }
}
