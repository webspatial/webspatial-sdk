import {
  ForwardedRef,
  forwardRef,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  SpatializedContainerContext,
  SpatializedContainerObject,
} from './context/SpatializedContainerContext'
import { getSession } from '../utils/getSession'
import { SpatialLayerContext } from './context/SpatialLayerContext'
import { SpatializedElementRef, SpatializedContainerProps } from './types'
import { StandardSpatializedContainer } from './StandardSpatializedContainer'
import { PortalSpatializedContainer } from './PortalSpatializedContainer'
import { PortalInstanceContext } from './context/PortalInstanceContext'
import { SpatialID } from './SpatialID'
import { TransformVisibilityTaskContainer } from './TransformVisibilityTaskContainer'
import { useDomProxy } from './hooks/useDomProxy'
import {
  useSpatialEvents,
  useSpatialEventsWhenSpatializedContainerExist,
} from './hooks/useSpatialEvents'

export function SpatializedContainerBase<T extends SpatializedElementRef>(
  inprops: SpatializedContainerProps<T>,
  ref: ForwardedRef<SpatializedElementRef<T>>,
) {
  // --- ALL HOOKS AT THE TOP ---

  // 1. Hydration safety
  const [isClientReady, setIsClientReady] = useState(false)
  useEffect(() => {
    setIsClientReady(true)
  }, [])

  // 2. Props destructuring
  const {
    onSpatialTap,
    onSpatialDragStart,
    onSpatialDrag,
    onSpatialDragEnd,
    onSpatialRotateStart,
    onSpatialRotate,
    onSpatialRotateEnd,
    onSpatialMagnifyStart,
    onSpatialMagnify,
    onSpatialMagnifyEnd,
    extraRefProps,
    ...props
  } = inprops

  // 3. Contexts
  const layer = useContext(SpatialLayerContext) + 1
  const rootSpatializedContainerObject = useContext(
    SpatializedContainerContext,
  ) as unknown as SpatializedContainerObject<T>
  const portalInstanceObject = useContext(PortalInstanceContext)

  // 4. Derived state from context
  const inSpatializedContainer = !!rootSpatializedContainerObject
  const inPortalInstanceEnv = !!portalInstanceObject
  const isInStandardInstance = !inPortalInstanceEnv
  const isWebSpatialEnv = getSession() !== null && isClientReady

  // 5. Memos
  const spatialId = useMemo(() => {
    return !inSpatializedContainer
      ? `root_container`
      : rootSpatializedContainerObject.getSpatialId(layer, isInStandardInstance)
  }, [
    inSpatializedContainer,
    rootSpatializedContainerObject,
    layer,
    isInStandardInstance,
  ])

  // This is the root spatialized container
  const spatializedContainerObject = useMemo(
    () => new SpatializedContainerObject(),
    [],
  )

  // 6. Custom Hooks
  const {
    transformVisibilityTaskContainerCallback,
    standardSpatializedContainerCallback,
    spatialContainerRefProxy,
  } = useDomProxy<T>(ref, extraRefProps)

  const spatialEvents = useSpatialEvents<T>(
    {
      onSpatialTap,
      onSpatialDragStart,
      onSpatialDrag,
      onSpatialDragEnd,
      onSpatialRotateStart,
      onSpatialRotate,
      onSpatialRotateEnd,
      onSpatialMagnifyStart,
      onSpatialMagnify,
      onSpatialMagnifyEnd,
    },
    spatialContainerRefProxy,
  )

  const spatialEventsWhenSpatializedContainerExist =
    useSpatialEventsWhenSpatializedContainerExist<T>(
      {
        onSpatialTap,
        onSpatialDragStart,
        onSpatialDrag,
        onSpatialDragEnd,
        onSpatialRotateStart,
        onSpatialRotate,
        onSpatialRotateEnd,
        onSpatialMagnifyStart,
        onSpatialMagnify,
        onSpatialMagnifyEnd,
      },
      spatialId,
      rootSpatializedContainerObject,
    )

  // 7. Effects
  useEffect(() => {
    if (inSpatializedContainer && !inPortalInstanceEnv) {
      rootSpatializedContainerObject.updateSpatialContainerRefProxyInfo(
        spatialId,
        spatialContainerRefProxy.current,
      )
    }
  }, [
    inSpatializedContainer,
    inPortalInstanceEnv,
    rootSpatializedContainerObject,
    spatialId,
    spatialContainerRefProxy,
  ])

  // --- CONDITIONAL RENDERING LOGIC ---

  if (!isWebSpatialEnv) {
    const {
      component: Component,
      spatializedContent,
      createSpatializedElement,
      getExtraSpatializedElementProperties,
      ...restProps
    } = props
    // make sure SpatializedContainer can work on web env
    return <Component ref={ref} {...restProps} />
  }

  const spatialIdProps = {
    [SpatialID]: spatialId,
  }

  if (inSpatializedContainer) {
    if (inPortalInstanceEnv) {
      // nested in another PortalSpatializedContainer
      return (
        <SpatialLayerContext.Provider value={layer}>
          <PortalSpatializedContainer<T>
            {...spatialIdProps}
            {...props}
            {...spatialEventsWhenSpatializedContainerExist}
          />
        </SpatialLayerContext.Provider>
      )
    } else {
      // in standard instance env
      const {
        spatializedContent,
        createSpatializedElement,
        getExtraSpatializedElementProperties,
        ...restProps
      } = props
      return (
        <SpatialLayerContext.Provider value={layer}>
          <StandardSpatializedContainer<T>
            ref={standardSpatializedContainerCallback}
            {...spatialIdProps}
            {...restProps}
            inStandardSpatializedContainer={true}
          />
          <TransformVisibilityTaskContainer
            ref={transformVisibilityTaskContainerCallback}
            {...spatialIdProps}
            className={props.className}
            style={props.style}
          />
        </SpatialLayerContext.Provider>
      )
    }
  } else {
    // This is the root spatialized container
    const {
      spatializedContent,
      createSpatializedElement,
      getExtraSpatializedElementProperties,
      ...restProps
    } = props

    return (
      <SpatialLayerContext.Provider value={layer}>
        <SpatializedContainerContext.Provider
          value={spatializedContainerObject}
        >
          <StandardSpatializedContainer<T>
            ref={standardSpatializedContainerCallback}
            {...spatialIdProps}
            {...restProps}
            inStandardSpatializedContainer={false}
          />
          <PortalSpatializedContainer<T>
            {...spatialIdProps}
            {...props}
            {...spatialEvents}
          />
          <TransformVisibilityTaskContainer
            ref={transformVisibilityTaskContainerCallback}
            {...spatialIdProps}
            className={props.className}
            style={props.style}
          />
        </SpatializedContainerContext.Provider>
      </SpatialLayerContext.Provider>
    )
  }
}

export const SpatializedContainer = forwardRef(SpatializedContainerBase) as <
  T extends SpatializedElementRef,
>(
  props: SpatializedContainerProps<T> & {
    ref?: ForwardedRef<SpatializedElementRef<T>>
  },
) => React.ReactElement | null
