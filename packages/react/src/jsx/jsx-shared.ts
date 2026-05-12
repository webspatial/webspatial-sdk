import { jsxDEV as _jsxDEV, JSXSource } from 'react/jsx-dev-runtime'
import reactJSXRuntime from 'react/jsx-runtime'
import { createElement as reactCreateElement } from 'react'
// Note: README in this folder asks us to import via the package name
// (`@webspatial/react-sdk`) so the jsx-runtime bundle stays slim by treating
// the SDK as external. We intentionally switch to a relative import in PR 3
// of the lazy-load roll-out (per spatial-lazy-load spec tasks.md §6.2): the
// JSX runtime MUST resolve `Model`, `withSpatialized2DElementContainer`, and
// `withSpatialMonitor` to the **facade** versions defined in `../facades`,
// regardless of what `@webspatial/react-sdk` currently re-exports from the
// default entry. PR 4 rewires `src/index.ts` to surface facades and PR 5
// stops marking the package name as external in the jsx bundle's tsup config
// (per tasks.md §7.4 / §8.1), at which point either import shape resolves to
// the same module identity.
import {
  Model,
  withSpatialMonitor,
  withSpatialized2DElementContainer,
} from '../facades'

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
 * `type === Model` short-circuits both strip and wrap — the `Model` facade
 * handles its own runtime branching (per the spec "Model type bypasses JSX
 * runtime wrapping and stripping" Scenario).
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
  if (type === Model) {
    return type
  }

  if (props === null || typeof props !== 'object') {
    return type
  }

  const propsObject = props as Record<string, any>
  let wrapped: React.ElementType = type

  if (attributeFlag in propsObject) {
    delete propsObject[attributeFlag]
    if (wrapped === type) {
      wrapped = withSpatialized2DElementContainer(type)
    }
  }

  if (xrMonitorFlag in propsObject) {
    delete propsObject[xrMonitorFlag]
    if (wrapped === type) {
      wrapped = withSpatialMonitor(type)
    }
  }

  // Style marker — spread-clone to avoid mutating a memoized / frozen ref.
  const style = propsObject.style
  if (style !== null && typeof style === 'object' && styleFlag in style) {
    const { [styleFlag]: _enableXr, ...restStyle } = style
    propsObject.style = restStyle
    if (wrapped === type) {
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
      if (wrapped === type) {
        wrapped = withSpatialized2DElementContainer(type)
      }
    }
  }

  return wrapped
}

export function jsxs(type: React.ElementType, props: unknown, key?: React.Key) {
  type = replaceToSpatialPrimitiveType(type, props)
  return reactJSXRuntime.jsxs(type, props, key)
}

export function jsx(type: React.ElementType, props: unknown, key?: React.Key) {
  type = replaceToSpatialPrimitiveType(type, props)
  return reactJSXRuntime.jsx(type, props, key)
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
