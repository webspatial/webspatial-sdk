// =============================================================================
// `bootEntry` — shared `bootSpatial() → ReactDOM.createRoot().render()` wrapper
// for every test-server entry point (SPA + standalone test pages).
//
// Background: post-lazy-load (`openspec/changes/lazy-load-spatial-runtime/`),
// `@webspatial/react-sdk` no longer eagerly initializes the spatial runtime.
// Apps MUST call `await bootSpatial()` before mounting their first React tree
// in WebSpatial-capable runtimes; otherwise every spatial primitive renders
// its documented web fallback (poster `<model>`, `<div aria-hidden>` Reality,
// no-op entities/materials, identity `useMetrics` constants). In plain web
// browsers `bootSpatial()` resolves immediately without scheduling any
// dynamic import — the wait is one microtask, not a network round trip.
//
// This helper consolidates the two ergonomic concerns each entry was
// otherwise re-solving by hand:
//
//   1. The `document.readyState === 'loading'` → `DOMContentLoaded` dance
//      that the legacy `mount()` pattern in `pages/scene/{hook,loading,
//      volumeHook}.tsx` open-coded.
//   2. Boot failure isolation: `bootSpatial()` rejects with
//      `WebSpatialBootError` when the spatial chunk fetch fails (network
//      error, chunk-not-found, etc.). The page MUST still render — the
//      facades' web fallback IS the user's degraded display path — so we
//      log + continue, never throw.
//
// Plain `await bootSpatial()` would also work, but this helper keeps the
// intent ("boot spatial runtime, then render") in one obvious place that
// future maintainers can find when they add a new entry.
// =============================================================================

import React from 'react'
import ReactDOM from 'react-dom/client'
import { bootSpatial, WebSpatialBootError } from '@webspatial/react-sdk'

export interface BootEntryOptions {
  /** Root element id; default `'root'`. */
  rootId?: string
  /** If true (default), creates `<div id="root">` when missing — matches the
   * legacy `mount()` pattern several standalone pages relied on. */
  createRootIfMissing?: boolean
  /** Wrap `tree` in `<React.StrictMode>`; default `true`. */
  strictMode?: boolean
}

export function bootEntry(
  tree: React.ReactElement,
  options: BootEntryOptions = {},
): void {
  const {
    rootId = 'root',
    createRootIfMissing = true,
    strictMode = true,
  } = options

  const start = async (): Promise<void> => {
    try {
      await bootSpatial()
    } catch (err) {
      // Per spec, facades render documented web fallback when the bridge is
      // unready for any reason — including a rejected boot. Surface the
      // failure for diagnostics and let the React tree mount in fallback
      // mode instead of leaving the page blank.
      if (err instanceof WebSpatialBootError) {
        console.error(
          '[test-server] bootSpatial() rejected; rendering with web fallback',
          err,
        )
      } else {
        // Unexpected non-WebSpatialBootError: re-throw so it shows up in
        // the browser's error overlay during development.
        throw err
      }
    }

    let root = document.getElementById(rootId)
    if (!root && createRootIfMissing) {
      root = document.createElement('div')
      root.id = rootId
      document.body.appendChild(root)
    }
    if (!root) {
      console.error(`[test-server] bootEntry: #${rootId} not found`)
      return
    }

    const wrapped = strictMode ? (
      <React.StrictMode>{tree}</React.StrictMode>
    ) : (
      tree
    )

    ReactDOM.createRoot(root).render(wrapped)
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      void start()
    })
  } else {
    void start()
  }
}
