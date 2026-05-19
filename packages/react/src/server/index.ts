// =============================================================================
// `@webspatial/react-sdk/server` — INTERNAL / non–public-developer surface.
//
// Product decision: this subpath is for WebSpatial **engineering demos, CI,
// and R&D** — not documented as a supported third-party integration API.
// Integrators classify environments using User-Agent + official site docs.
//
// Technical note: `dist/index.js` (the default entry) carries `'use client'`,
// so most callable helpers cannot run from an RSC server module. This entry
// exists so in-repo apps/tests can import server-safe helpers without pulling
// the client directive; behavior may change without semver migration guidance
// for external SDK consumers.
//
// Hooks, facade components, and APIs that mutate module-level singleton state
// MUST NOT be exposed here.
// =============================================================================

import { computeRuntimeFromUserAgent } from '../runtime/capabilities'
import type { WebSpatialRuntimeSnapshot } from '../runtime/capabilities'

/**
 * Structural type satisfied by any object exposing a request-header getter.
 *
 * Concrete instances that match:
 *   - the Web Fetch API `Headers` class
 *   - the Next.js App Router `ReadonlyHeaders` returned by `await headers()`
 *   - Express / Connect's `req.headers` (when accessed through a proxy)
 *   - any custom `{ get(name): string | null }` shim
 *
 * Kept structural (not nominal `Headers`) so framework-specific Header types
 * accept without `as any` and so non-DOM TypeScript libs (Node-only consumers)
 * compile without pulling in the DOM `Headers` type.
 */
export type SpatialRuntimeHeaders = {
  get(name: string): string | null
}

/**
 * Server-side snapshot of the WebSpatial runtime type for a User-Agent string
 * (same shape the client runtime cache derives from `navigator.userAgent`).
 *
 * **Not a supported public API for third-party apps.** Product direction:
 * integrators branch on **`User-Agent` using official WebSpatial documentation**,
 * not SDK detection exports. This function remains for **in-repo demos / CI /
 * engineering** only (`@webspatial/react-sdk/server` is not part of the
 * documented developer surface).
 *
 * @param input The user agent: raw string, `Headers`-like `.get` object
 *   ({@link SpatialRuntimeHeaders}), or `null` / `undefined`.
 */
export function detectSpatialRuntime(
  input: string | SpatialRuntimeHeaders | null | undefined,
): WebSpatialRuntimeSnapshot {
  return computeRuntimeFromUserAgent(extractUserAgent(input))
}

function extractUserAgent(
  input: string | SpatialRuntimeHeaders | null | undefined,
): string | undefined {
  if (input == null) return undefined
  if (typeof input === 'string') return input
  if (typeof input !== 'object') return undefined
  const maybeGetter = (input as SpatialRuntimeHeaders).get
  if (typeof maybeGetter !== 'function') return undefined
  // Try canonical `user-agent` first; some Headers wrappers normalise to
  // lower-case while older Node `IncomingHttpHeaders`-style mirrors expose
  // both casings. Falling through to `User-Agent` covers both cases.
  const headers = input as SpatialRuntimeHeaders
  return headers.get('user-agent') ?? headers.get('User-Agent') ?? undefined
}

// Mirror the full type surface of the default entry so RSC files can write
// type annotations (e.g. `ModelProps`, `CapabilityKey`, `Vec3`) without
// crossing back to `@webspatial/react-sdk` — whose `'use client'` directive
// would otherwise make every export resolve as a Client Reference object
// even when only the type side is needed.
export type * from '..'
