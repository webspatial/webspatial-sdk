// Renders the standard host: the visible 2D placeholder of a spatial
// container. The host is permanently hidden via class-scoped CSS rules
// (`.xr-spatial-default[data-xr-host]`) and exposed to consumers as
// `ref.current`. See `./ARCHITECTURE.md` for the invariants this component
// must preserve and the reasoning behind the data-attribute / CSS approach.
import {
  SpatializedElementRef,
  SpatialTransformVisibility,
  StandardSpatializedContainerProps,
} from './types'
import { use2DFrameDetector } from './hooks/use2DFrameDetector'
import {
  ForwardedRef,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { SpatializedContainerContext } from './context/SpatializedContainerContext'
import { SpatialID } from './SpatialID'

function useSpatialTransformVisibilityWatcher(spatialId: string) {
  const [transformExist, setTransformExist] = useState(false)

  const spatializedContainerObject = useContext(SpatializedContainerContext)!
  useEffect(() => {
    const fn = (spatialTransform: SpatialTransformVisibility) => {
      setTransformExist(spatialTransform.transform !== 'none')
    }
    spatializedContainerObject.onSpatialTransformVisibilityChange(spatialId, fn)
    return () => {
      spatializedContainerObject.offSpatialTransformVisibilityChange(
        spatialId,
        fn,
      )
    }
  }, [spatialId, spatializedContainerObject])

  return transformExist
}

function useInternalRef(ref: ForwardedRef<HTMLElement | null>) {
  const refInternal = useRef<HTMLElement | null>(null)
  const refInternalCallback = useCallback(
    (node: HTMLElement | null) => {
      refInternal.current = node

      if (typeof ref === 'function') {
        ref(node)
      } else if (ref) {
        ref.current = node
      }
    },
    [ref],
  )

  return { refInternal, refInternalCallback }
}

export function StandardSpatializedContainerBase(
  props: StandardSpatializedContainerProps,
  ref: ForwardedRef<HTMLElement | null>,
) {
  const {
    component: Component,
    style: inStyle = {},
    className,
    inStandardSpatializedContainer = false,
    ...restProps
  } = props

  const { refInternal, refInternalCallback } = useInternalRef(ref)
  if (!inStandardSpatializedContainer) {
    use2DFrameDetector(refInternal)
  }
  const transformExist = useSpatialTransformVisibilityWatcher(props[SpatialID])

  const classNames = className
    ? `${className} xr-spatial-default`
    : 'xr-spatial-default'

  // Apply spatial host appearance (visibility / transition / transform) via a
  // CSS rule scoped to `.xr-spatial-default[data-xr-host]`, NOT via inline
  // style. The standard host has a styleProxy installed on it (see
  // SpatialContainerRefProxy) that forwards `style.transform` /
  // `style.visibility` writes to the probe so user code like
  // `ref.current.style.transform = 'rotate(45deg)'` reaches the platform
  // layer. If we wrote `transform: translateZ(0)` inline here, React's commit
  // would hit that proxy and clobber the user's value on the probe
  // (https://github.com/webspatial/webspatial-sdk/pull/1194).
  //
  // The SDK-controlled `data-xr-host` / `data-xr-transform-active` attributes
  // are placed AFTER `restProps` so user-supplied values cannot override
  // them — losing `data-xr-host` would un-hide the 2D placeholder, and
  // forcing `data-xr-transform-active` would diverge the host's stacking
  // state from the spatial transform watcher.
  return (
    <Component
      ref={refInternalCallback}
      style={inStyle}
      className={classNames}
      {...restProps}
      data-xr-host=""
      data-xr-transform-active={transformExist ? '' : undefined}
    />
  )
}

export const StandardSpatializedContainer = forwardRef(
  StandardSpatializedContainerBase,
) as <T extends SpatializedElementRef>(
  props: StandardSpatializedContainerProps & {
    ref?: ForwardedRef<SpatializedElementRef<T>>
  },
) => React.ReactElement | null

/**
 * The hidden-host rules apply only to the visible 2D placeholder
 * (StandardSpatializedContainer's host element). They are intentionally
 * NOT written as inline style on that element — see the comment in
 * StandardSpatializedContainerBase. The selector is scoped via
 * `.xr-spatial-default` (always present on a spatial host) so that
 * unrelated DOM that happens to carry a `data-xr-host` attribute is not
 * affected. `!important` matches the previous inline-style behavior
 * where user-supplied inline visibility/transform could not override the
 * host's hidden / stacking-context state. The class observer mirrors
 * `class` (not `data-*`) onto the probe, so the probe never matches
 * because it lacks `data-xr-host`.
 */
const SPATIAL_DEFAULT_STYLE_CSS = `
  :where(.xr-spatial-default) {
    --xr-back: 0;
    --xr-depth: 0;
    --xr-z-index: 0;
    --xr-background-material: none;
  }
  .xr-spatial-default[data-xr-host] {
    animation: none !important;
    visibility: hidden !important;
    transition: none !important;
    transform: none !important;
  }
  .xr-spatial-default[data-xr-host][data-xr-transform-active] {
    transform: translateZ(0) !important;
  }
`

/**
 * Marker attribute used to dedupe injected stylesheets per root.
 * Anyone querying for `style[data-xr-spatial-default-style]` should be able
 * to find the SDK's stylesheet and skip re-injecting.
 */
const SPATIAL_DEFAULT_STYLE_MARKER = 'data-xr-spatial-default-style'

/**
 * Idempotently install the spatial default stylesheet into a tree root.
 *
 * Document-level stylesheets do not cross shadow boundaries, so a spatial
 * container rendered inside a `ShadowRoot` would miss the
 * `.xr-spatial-default[data-xr-host]` hiding rule and show the bare 2D
 * placeholder. Calling this for each host's root (Document or ShadowRoot)
 * keeps the rules reachable wherever the host actually lives.
 *
 * Safe to call repeatedly for the same root — uses an attribute marker on
 * the inserted `<style>` element to short-circuit duplicates.
 */
export function ensureSpatialDefaultStyleInRoot(root: Document | ShadowRoot) {
  const queryRoot = root === document ? document.head : root
  if (queryRoot.querySelector(`style[${SPATIAL_DEFAULT_STYLE_MARKER}]`)) {
    return
  }
  const ownerDoc =
    root === document
      ? document
      : (root as ShadowRoot).ownerDocument || document
  const styleElement = ownerDoc.createElement('style')
  styleElement.type = 'text/css'
  styleElement.setAttribute(SPATIAL_DEFAULT_STYLE_MARKER, '')
  styleElement.innerHTML = SPATIAL_DEFAULT_STYLE_CSS
  if (root === document) {
    document.head.appendChild(styleElement)
  } else {
    ;(root as ShadowRoot).appendChild(styleElement)
  }
}

/**
 * Polyfill entry point: ensure the document carries the spatial default
 * stylesheet. Hosts mounted inside shadow roots are covered by a separate
 * per-mount call from `SpatialContainerRefProxy`. Kept as a stable export
 * because it is referenced by `initPolyfill`.
 */
export function injectSpatialDefaultStyle() {
  ensureSpatialDefaultStyleInRoot(document)
}
