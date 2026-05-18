// =============================================================================
// `@webspatial/react-sdk/server` — server-safe public subpath.
//
// Reach for this entry from React Server Components (Next.js App Router) when
// you need a WebSpatial helper that is safe to *call* from a Server Module —
// i.e. not just a JSX element type to render, but an actual function executed
// during RSC render.
//
// Why this is a separate entry
// ----------------------------
// `dist/index.js` (the default entry) carries `'use client'` at its top
// because most of its exports are React hooks or facade components that
// transitively need hooks. When a Server Component imports anything from
// `@webspatial/react-sdk`, Next's RSC compiler turns the resolved symbols
// into Client References (opaque objects, NOT callable). Trying to call
// such an import throws:
//
//   "Attempted to call X() from the server but X is on the client."
//
// Helpers that are genuinely server-safe — no `window`, no `navigator`, no
// React state — therefore have to live on a separate subpath whose dist
// file does NOT carry the directive, so the RSC compiler resolves them
// to real callable functions.
//
// What lives here
// ---------------
// Only APIs that are useful in *server-side execution context* (RSC render,
// edge middleware, Node scripts) AND fail gracefully without browser globals.
// Hooks, facade components, and APIs that mutate module-level singleton
// state (which would leak across requests in a shared Node process) MUST
// NOT be exposed here.
// =============================================================================

import { computeRuntimeFromUserAgent } from '@webspatial/core-sdk'
import type { WebSpatialRuntimeSnapshot } from '@webspatial/core-sdk'

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
 * Detect which WebSpatial runtime the visiting device is running, on the
 * server, before any JS hits the client. Returns the same snapshot shape the
 * client-side runtime cache produces from `navigator.userAgent` — but driven
 * by an explicit user-agent value so it works in RSC / edge / Node contexts
 * that have no `navigator`.
 *
 * @param input
 *   The user agent. Accepts:
 *   - a raw user-agent string (e.g. `req.headers['user-agent']`),
 *   - a `Headers`-like object with a `.get(name)` method (covers Next.js
 *     `await headers()`, Web Fetch `Headers`, and most framework header
 *     wrappers — see {@link SpatialRuntimeHeaders}),
 *   - `null` / `undefined` (treated as "no user agent" → `{ type: null }`).
 *
 * @returns
 *   `WebSpatialRuntimeSnapshot` — `{ type: 'visionos' | 'picoos' | 'puppeteer' | null,
 *   shellVersion: string | null }`. `type === null` means the request is
 *   from a plain browser / non-spatial environment.
 *
 * @example  Next.js App Router (Server Component)
 *   import { headers } from 'next/headers'
 *   import { detectSpatialRuntime } from '@webspatial/react-sdk/server'
 *
 *   export default async function Page() {
 *     const runtime = detectSpatialRuntime(await headers())
 *     if (runtime.type === 'visionos') return <SpatialHero />
 *     return <FallbackHero />
 *   }
 *
 * @example  Generic — raw string
 *   detectSpatialRuntime(request.headers.get('user-agent') ?? '')
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
