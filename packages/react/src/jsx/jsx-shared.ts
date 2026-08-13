import { jsxDEV as _jsxDEV, JSXSource } from 'react/jsx-dev-runtime'
import * as _reactJSXRuntime from 'react/jsx-runtime'
import { createElement as reactCreateElement } from 'react'

const reactJSXRuntime = (_reactJSXRuntime as any).default || _reactJSXRuntime
// The marker-wrapping HOC factories MUST resolve to the **facade** versions
// defined in `../facades` (not to real spatial implementations). Per
// spatial-lazy-load spec `tasks.md` §6.2 the JSX runtime delegates spatial
// vs. fallback rendering to the facade HOCs; the JSX runtime itself NEVER
// imports from `../spatial/`, NEVER calls `bootSpatial()`, and never
// schedules a dynamic import. `Model` / `Reality` are handled separately by
// the primitive marker check below.
//
// Why an external package self-reference instead of a relative import:
// `dist/jsx/jsx-runtime.js` MUST be server-callable (Server Components in
// the App Router compile their JSX to `jsx(...)` calls reaching this file
// via `tsconfig "jsxImportSource"`), so it cannot itself carry
// `'use client'`. The facade HOCs, however, transitively import React
// hooks (`useSyncExternalStore`, `useLayoutEffect`, ...) which the RSC
// compiler rejects from a server-callable module. We therefore route
// `jsx-shared`'s facade lookup through an internal `'use client'`
// boundary file (`src/internal/facades-client.ts`, published as the
// `@webspatial/react-sdk/internal/facades-client` subpath and marked
// external by `tsup.config.ts`). Next's RSC compiler walks
//     `jsx-runtime.js` → shared chunk → external subpath → facades-client.js
// and STOPS at the directive, treating the imported facades as Client
// References. The runtime check below (`canWrapWithFacade`) detects this
// case and degrades to "strip markers, no HOC wrap" — see
// `src/internal/facades-client.ts` for the full rationale.
import {
  withSpatialMonitor,
  withSpatialized2DElementContainer,
} from '@webspatial/react-sdk/internal/facades-client'
import { getWebSpatialPrimitiveName } from './primitive-marker'

// In an RSC server bundle, the HOC facade imports above resolve to
// Client References (opaque objects) rather than callable functions. We
// can still safely STRIP `enable-xr` / `enable-xr-monitor` markers from
// props (so the resulting server-rendered DOM matches the client-side
// facade fallback DOM), but we MUST NOT attempt to invoke the HOC
// factories — calling a Client Reference throws. In the client bundle
// (and during SSR pre-render of Client Components), the same imports
// resolve to the real functions and the full strip + wrap path runs.
//
// The check is module-scoped because Client Reference identity is fixed
// at module evaluation time and never flips back to a real function
// during the lifetime of a process.
const canWrapWithFacade =
  typeof withSpatialized2DElementContainer === 'function' &&
  typeof withSpatialMonitor === 'function'

const attributeFlag = 'enable-xr'
const styleFlag = 'enableXr'
const classFlag = '__enableXr__'
const xrMonitorFlag = 'enable-xr-monitor'

/**
 * Strip WebSpatial-only markers from `props` and, when at least one marker is
 * present, wrap the element `type` with the appropriate facade HOC. Performs
 * strip + wrap in a single pass and is invoked by every JSX call site
 * (`jsx`, `jsxs`, `jsxDEV`, and the deprecated `createElement` export).
 *
 * Per spatial-lazy-load spec "JSX runtime strips spatial markers and wraps
 * with facade HOCs":
 *
 * - `enable-xr`              → `withSpatialized2DElementContainer(type)`
 * - `enable-xr-monitor`      → `withSpatialMonitor(type)`
 * - `props.style.enableXr`   → `withSpatialized2DElementContainer(type)` and
 *   `props.style` is reassigned to a NEW object (spread-clone) with the
 *   `enableXr` key omitted. The original `props.style` reference MUST NOT be
 *   mutated (it MAY be user-memoized or `Object.freeze`d).
 * - `props.className` token  → `withSpatialized2DElementContainer(type)` and
 *   the `__enableXr__` token is removed from the className string.
 *
 * Mutation policy: the top-level `props` object is created fresh per JSX call
 * by React's transform and MAY be mutated in place — we delete the attribute
 * keys (`enable-xr`, `enable-xr-monitor`) directly and reassign `className`
 * and `style` on it. Only the nested `props.style` value is spread-cloned to
 * keep the user-supplied reference pristine.
 *
 * Marker source: only `props.className` is recognized. The HTML-style
 * `props.class` is **not** treated as a marker source in v1 (per the spec
 * "HTML class attribute is not recognized as a marker source" Scenario);
 * props pass through to React unchanged in that case.
 *
 * `Model` and `Reality` (identified by the stable primitive marker, covering
 * both the facade and the eager real implementations) short-circuit both
 * strip and wrap: both handle their own runtime branching and MUST NOT be
 * wrapped as generic 2D spatialized containers.
 *
 * Combined markers: when more than one marker is present, every marker MUST
 * be stripped (the `tasks.md §6.6(b)` requirement). The wrap is determined
 * by the highest-priority marker in the order listed above; the cascading
 * fall-through ensures that `withSpatialMonitor` is preferred only when
 * `enable-xr-monitor` is the sole 2D-container marker present.
 *
 * Zero-allocation fast path: when no markers are present, this function must
 * not clone `props.style`, must not split `className`, and must not reassign
 * any prop (per "No marker present is a no-op" Scenario).
 */
export function replaceToSpatialPrimitiveType(
  type: React.ElementType,
  props: unknown,
): React.ElementType {
  // `Model` / `Reality` short-circuit both strip and wrap. We brand both the
  // default-entry facades and the eager-entry real implementations with a
  // stable marker (see `primitive-marker.ts`); identifying by marker — not by
  // object-reference equality against the facade — keeps the eager entry's
  // real `<Model enable-xr>` from being wrapped as a 2D spatialized container.
  if (getWebSpatialPrimitiveName(type) !== undefined) {
    return type
  }

  if (props === null || typeof props !== 'object') {
    return type
  }

  const propsObject = props as Record<string, any>
  let wrapped: React.ElementType = type

  if (attributeFlag in propsObject) {
    delete propsObject[attributeFlag]
    if (canWrapWithFacade && wrapped === type) {
      wrapped = withSpatialized2DElementContainer(type)
    }
  }

  if (xrMonitorFlag in propsObject) {
    delete propsObject[xrMonitorFlag]
    if (canWrapWithFacade && wrapped === type) {
      wrapped = withSpatialMonitor(type)
    }
  }

  // Style marker — spread-clone to avoid mutating a memoized / frozen ref.
  const style = propsObject.style
  if (style !== null && typeof style === 'object' && styleFlag in style) {
    const { [styleFlag]: _enableXr, ...restStyle } = style
    propsObject.style = restStyle
    if (canWrapWithFacade && wrapped === type) {
      wrapped = withSpatialized2DElementContainer(type)
    }
  }

  // className token — only check `props.className` (NOT `props.class`).
  // Fast-path: `indexOf` substring check skips the split/filter allocation
  // when the marker token is absent (per the "No marker present is a no-op"
  // Scenario).
  const className = propsObject.className
  if (typeof className === 'string' && className.indexOf(classFlag) !== -1) {
    const tokens = className.split(' ')
    const filtered = tokens.filter(token => token !== classFlag)
    if (filtered.length !== tokens.length) {
      propsObject.className = filtered.join(' ')
      if (canWrapWithFacade && wrapped === type) {
        wrapped = withSpatialized2DElementContainer(type)
      }
    }
  }

  return wrapped
}

export function jsxs(type: React.ElementType, props: unknown, key?: React.Key) {
  type = replaceToSpatialPrimitiveType(type, props)
  return (reactJSXRuntime as any).jsxs(type, props, key)
}

export function jsx(type: React.ElementType, props: unknown, key?: React.Key) {
  type = replaceToSpatialPrimitiveType(type, props)
  return (reactJSXRuntime as any).jsx(type, props, key)
}

export function jsxDEV(
  type: React.ElementType,
  props: unknown,
  key: React.Key,
  isStatic: boolean,
  source?: JSXSource,
  self?: unknown,
) {
  type = replaceToSpatialPrimitiveType(type, props)
  return _jsxDEV(type, props, key, isStatic, source, self)
}

/**
 * @deprecated Use the new JSX transform (tsconfig `"jsx": "react-jsx"` or
 * babel `runtime: "automatic"`) instead. SDK strip + facade-HOC wrap is
 * provided via the `package.json` `"./jsx-runtime"` mapping. This export
 * will be removed in v2.
 */
export function createElement(...args: Parameters<typeof reactCreateElement>) {
  const [type, props, ...rest] = args
  const newType = replaceToSpatialPrimitiveType(type as any, props)
  return reactCreateElement(newType, props, ...rest)
}
