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
    inStandardSpatializedContainer = false,
    ...restProps
  } = props

  const { refInternal, refInternalCallback } = useInternalRef(ref)
  if (!inStandardSpatializedContainer) {
    use2DFrameDetector(refInternal)
  }
  const transformExist = useSpatialTransformVisibilityWatcher(props[SpatialID])

  const extraStyle = {
    visibility: 'hidden',
    transition: 'none',
    transform: transformExist ? 'translateZ(0)' : 'none',
  }
  const style = { ...inStyle, ...extraStyle }

  return <Component ref={refInternalCallback} style={style} {...restProps} />
}

export const StandardSpatializedContainer = forwardRef(
  StandardSpatializedContainerBase,
) as <T extends SpatializedElementRef>(
  props: StandardSpatializedContainerProps & {
    ref?: ForwardedRef<SpatializedElementRef<T>>
  },
) => React.ReactElement | null
