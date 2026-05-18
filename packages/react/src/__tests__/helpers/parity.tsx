// Parity harness per spatial-lazy-load spec tasks.md §15.1 + §15.2.
//
// Every Group A public component / hook has TWO independent fallback code
// paths after lazy-load (per `REVIEW.md`'s "Two-scenario behavior contract
// audit"):
//
// - **Path 1** — boot-bundle facade fallback (`packages/react/src/facades/*`).
//   Exercised when `isSpatialReady() === false` for any reason: non-WebSpatial
//   browser, SSR, boot-in-flight, boot-rejected, or boot-never-called. Pinned
//   by `spec.md` "Component facades" / "Hook placeholders" Requirements.
//
// - **Path 2** — spatial-chunk real-impl unsupported branch
//   (`packages/react/src/Model.tsx`, `packages/react/src/reality/*`, etc.).
//   Exercised when `bootSpatial()` HAS resolved AND the real implementation
//   is mounted, but the underlying capability check returns `false` (e.g.
//   `enable-xr={false}` or `Spatial.runInSpatialWeb() === false`). Pinned
//   by `runtime-capabilities` "Unsupported behavior contracts" Requirement.
//
// Without this harness the two physically-separate code paths can silently
// drift — e.g. a future facade tweak changes `Reality`'s placeholder to
// `<span>` while the real-impl branch keeps emitting `<div>`. The harness
// renders both contexts and exposes the resulting HTML so the caller can
// assert structural identity.

import React from 'react'
import { render } from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server'

/** Normalize an HTML fragment so attribute / whitespace order doesn't cause
 * spurious mismatches in the parity assertion. We sort attributes
 * alphabetically and collapse runs of whitespace. */
export function normalizeHtml(input: string): string {
  // Sort attributes inside each tag for stable comparison.
  const sortAttrs = (tag: string): string => {
    const m = /^<(\/?)(\w[\w-]*)([\s\S]*?)(\/?)>$/.exec(tag)
    if (!m) return tag
    const [, slash, name, attrsBlob, selfClose] = m
    const attrs = (attrsBlob.match(/\w[\w-]*(?:="[^"]*")?/g) ?? []).slice()
    attrs.sort((a, b) => a.localeCompare(b))
    return `<${slash}${name}${attrs.length ? ' ' + attrs.join(' ') : ''}${selfClose ?? ''}>`
  }
  return input
    .replace(/<[^>]+>/g, sortAttrs)
    .replace(/\s+/g, ' ')
    .trim()
}

/** Render via the **client** `react-dom` path (Vitest/jsdom): `SpatializedContainer`
 * / `Model` use `withSSRSupported`, which hides real output behind a placeholder
 * only for `renderToStaticMarkup`/`renderToString` (server snapshots). Parity harness
 * Path 2 for real `@webspatial/react-sdk` exports MUST use this so we compare against
 * the unsupported-branch DOM, not the transport placeholder.
 */
export function renderClientMarkup(node: React.ReactElement): string {
  const { container, unmount } = render(node)
  try {
    return container.innerHTML
  } finally {
    unmount()
  }
}
/** Render a tree to static markup, suppressing the unknown-tag warnings
 * React emits for native `<model>` (which jsdom + React's intrinsic table
 * do not yet recognize but which IS the spec-required degraded element). */
export function renderStatic(node: React.ReactElement): string {
  const errSpy = consoleSpy('error')
  try {
    return renderToStaticMarkup(node)
  } finally {
    errSpy.restore()
  }
}

function consoleSpy(method: 'error' | 'warn') {
  const original = console[method]
  console[method] = () => {}
  return {
    restore: () => {
      console[method] = original
    },
  }
}

/** Render the same tree through Path 1 (facade) and Path 2 (real impl)
 * and return both HTML strings. The caller asserts structural identity. */
export function captureBothPaths(opts: {
  Path1: React.ComponentType<any>
  Path2: React.ComponentType<any>
  props: Record<string, unknown>
  children?: React.ReactNode
}): { path1: string; path2: string } {
  const { Path1, Path2, props, children } = opts
  const path1 = renderStatic(<Path1 {...props}>{children}</Path1>)
  const path2 = renderStatic(<Path2 {...props}>{children}</Path2>)
  return { path1, path2 }
}
