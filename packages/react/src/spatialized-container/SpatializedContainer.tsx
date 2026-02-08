import { ForwardedRef, forwardRef, useContext, useEffect, useMemo } from 'react'
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
import { withSSRSupported } from '../ssr'
export function SpatializedContainerBase<T extends SpatializedElementRef>(
  inprops: SpatializedContainerProps<T>,
  ref: ForwardedRef<SpatializedElementRef<T>>,
) {
  const isWebSpatialEnv = getSession() !== null
  if (!isWebSpatialEnv) {
    const {
      component: Component,
      spatializedContent,
      createSpatializedElement,
      getExtraSpatializedElementProperties,
      onSpatialTap,
      onSpatialDragStart,
      onSpatialDrag,
      onSpatialDragEnd,
      onSpatialRotate,
      onSpatialRotateEnd,
      onSpatialMagnify,
      onSpatialMagnifyEnd,
      extraRefProps,
      ...restProps
    } = inprops
    // make sure SpatializedContainer can work on web env
    return <Component ref={ref} {...restProps} />
  }

  const layer = useContext(SpatialLayerContext) + 1
  const rootSpatializedContainerObject = useContext(
    SpatializedContainerContext,
  ) as unknown as SpatializedContainerObject<T>
  const inSpatializedContainer = !!rootSpatializedContainerObject
  const portalInstanceObject = useContext(PortalInstanceContext)
  const inPortalInstanceEnv = !!portalInstanceObject
  const isInStandardInstance = !inPortalInstanceEnv

  const spatialId = useMemo(() => {
    return !inSpatializedContainer
      ? `root_container`
      : rootSpatializedContainerObject.getSpatialId(layer, isInStandardInstance)
  }, [])
  const spatialIdProps = {
    [SpatialID]: spatialId,
  }
  const {
    onSpatialTap,
    onSpatialDragStart,
    onSpatialDrag,
    onSpatialDragEnd,
    onSpatialRotate,
    onSpatialRotateEnd,
    onSpatialMagnify,
    onSpatialMagnifyEnd,
    extraRefProps,
    ...props
  } = inprops

  if (inSpatializedContainer) {
    if (inPortalInstanceEnv) {
      const spatialEvents = useSpatialEventsWhenSpatializedContainerExist<T>(
        {
          onSpatialTap,
          onSpatialDragStart,
          onSpatialDrag,
          onSpatialDragEnd,
          onSpatialRotate,
          onSpatialRotateEnd,
          onSpatialMagnify,
          onSpatialMagnifyEnd,
        },
        spatialId,
        rootSpatializedContainerObject,
      )

      // nested in another PortalSpatializedContainer
      return (
        <SpatialLayerContext.Provider value={layer}>
          <PortalSpatializedContainer<T>
            {...spatialIdProps}
            {...props}
            {...spatialEvents}
          />
        </SpatialLayerContext.Provider>
      )
    } else {
      // in standard instance env
      const {
        transformVisibilityTaskContainerCallback,
        standardSpatializedContainerCallback,
        spatialContainerRefProxy,
      } = useDomProxy<T>(ref, extraRefProps)

      useEffect(() => {
        rootSpatializedContainerObject.updateSpatialContainerRefProxyInfo(
          spatialId,
          spatialContainerRefProxy.current,
        )
      }, [spatialContainerRefProxy.current])

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
        onSpatialRotate,
        onSpatialRotateEnd,
        onSpatialMagnify,
        onSpatialMagnifyEnd,
      },
      spatialContainerRefProxy,
    )

    // This is the root spatialized container
    const spatializedContainerObject = useMemo(
      () => new SpatializedContainerObject(),
      [],
    )
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

export const SpatializedContainer = withSSRSupported(
  forwardRef(SpatializedContainerBase),
) as <T extends SpatializedElementRef>(
  props: SpatializedContainerProps<T> & {
    ref?: ForwardedRef<SpatializedElementRef<T>>
  },
) => React.ReactElement | null
