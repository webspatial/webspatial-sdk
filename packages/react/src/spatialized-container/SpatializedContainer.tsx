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

export function SpatializedContainerBase(
  inprops: SpatializedContainerProps,
  ref: ForwardedRef<SpatializedElementRef>,
) {
  const isWebSpatialEnv = getSession() !== null
  if (!isWebSpatialEnv) {
    const {
      component: Component,
      spatializedContent,
      createSpatializedElement,
      getExtraSpatializedElementProperties,
      onSpatialTap,
      onSpatialDrag,
      onSpatialDragEnd,
      onSpatialRotation,
      ...restProps
    } = inprops
    // make sure SpatializedContainer can work on web env
    return <Component ref={ref} {...restProps} />
  }

  const layer = useContext(SpatialLayerContext) + 1
  const rootSpatializedContainerObject = useContext(SpatializedContainerContext)
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
    onSpatialDrag,
    onSpatialDragEnd,
    onSpatialRotation,
    ...props
  } = inprops

  if (inSpatializedContainer) {
    if (inPortalInstanceEnv) {
      const spatialEvents = useSpatialEventsWhenSpatializedContainerExist(
        {
          onSpatialTap,
          onSpatialDrag,
          onSpatialDragEnd,
          onSpatialRotation,
        },
        spatialId,
        rootSpatializedContainerObject,
      )

      // nested in another PortalSpatializedContainer
      return (
        <SpatialLayerContext.Provider value={layer}>
          <PortalSpatializedContainer
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
      } = useDomProxy(ref)

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
          <StandardSpatializedContainer
            ref={standardSpatializedContainerCallback}
            {...spatialIdProps}
            {...restProps}
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
    } = useDomProxy(ref)

    const spatialEvents = useSpatialEvents(
      {
        onSpatialTap,
        onSpatialDrag,
        onSpatialDragEnd,
        onSpatialRotation,
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
          <StandardSpatializedContainer
            ref={standardSpatializedContainerCallback}
            {...spatialIdProps}
            {...restProps}
          />
          <PortalSpatializedContainer
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

export const SpatializedContainer = forwardRef(SpatializedContainerBase)
