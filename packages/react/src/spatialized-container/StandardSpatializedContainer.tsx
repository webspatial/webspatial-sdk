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
  // CSS rule keyed on `data-xr-host`, NOT via inline style. The standard host
  // has a styleProxy installed on it (see SpatialContainerRefProxy) that
  // forwards `style.transform` / `style.visibility` writes to the probe so
  // user code like `ref.current.style.transform = 'rotate(45deg)'` reaches
  // the platform layer. If we wrote `transform: translateZ(0)` inline here,
  // React's commit would hit that proxy and clobber the user's value on the
  // probe (https://github.com/webspatial/webspatial-sdk/pull/1194).
  return (
    <Component
      ref={refInternalCallback}
      style={inStyle}
      className={classNames}
      data-xr-host=""
      data-xr-transform-active={transformExist ? '' : undefined}
      {...restProps}
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

export function injectSpatialDefaultStyle() {
  // inject xr-spatial-default style to head
  //
  // The `[data-xr-host]` rules apply only to the visible 2D placeholder
  // (StandardSpatializedContainer's host element). They are intentionally
  // NOT written as inline style on that element — see the comment in
  // StandardSpatializedContainerBase. `!important` matches the previous
  // inline-style behavior where user-supplied inline visibility/transform
  // could not override the host's hidden / stacking-context state.
  // The class observer mirrors `class` (not `data-*`) onto the probe, so
  // `[data-xr-host]` rules do not accidentally affect the probe element.
  const styleElement = document.createElement('style')
  styleElement.type = 'text/css'
  styleElement.innerHTML = `
    :where(.xr-spatial-default) {
      --xr-back: 0;
      --xr-depth: 0;
      --xr-z-index: 0;
      --xr-background-material: none;
    }
    [data-xr-host] {
      visibility: hidden !important;
      transition: none !important;
      transform: none !important;
    }
    [data-xr-host][data-xr-transform-active] {
      transform: translateZ(0) !important;
    }
  `
  document.head.appendChild(styleElement)
}
