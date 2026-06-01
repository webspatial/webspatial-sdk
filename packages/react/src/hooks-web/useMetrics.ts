'use client'

import { useState } from 'react'
import { getSpatialImpl, isSpatialReady } from '../runtime/bridge'
import {
  type MetricsPlaceholder,
  useMetricsPlaceholder,
} from './useMetrics-placeholder'

type MetricsImpl = () => MetricsPlaceholder

/**
 * Public `useMetrics` hook.
 *
 * Per spatial-lazy-load spec "Hook placeholders" Requirement: the
 * placeholder-vs-real selection is decided ONCE per component instance via
 * a `useState` initializer. In plain web, the placeholder conversion
 * functions throw `WebSpatialRuntimeError` when invoked. The hook never
 * switches mid-life: a component that first invoked the placeholder keeps
 * invoking the placeholder for its entire lifetime, even after
 * `bootSpatial()` resolves. To get the real hook implementation, the
 * component MUST be unmounted and remounted (e.g. via a `key` change,
 * parent unmount, or page reload).
 *
 * This decision lives in `useState`'s initializer (called once per
 * instance) — that is what allows the placeholder and the real hook to
 * differ in their internal React Hook call sequences without violating
 * the Rules of Hooks.
 */
export function useMetrics(): MetricsPlaceholder {
  const [impl] = useState<MetricsImpl>(() => {
    if (!isSpatialReady()) return useMetricsPlaceholder
    const real = getSpatialImpl()?.useMetrics
    return (real ?? useMetricsPlaceholder) as MetricsImpl
  })
  return impl()
}
