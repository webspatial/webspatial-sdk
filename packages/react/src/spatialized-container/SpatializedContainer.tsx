import { ForwardedRef, forwardRef, useContext, useMemo } from 'react'
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

export function SpatializedContainerBase(
  props: SpatializedContainerProps,
  ref: ForwardedRef<SpatializedElementRef>,
) {
  const isWebSpatialEnv = getSession() !== null
  if (!isWebSpatialEnv) {
    const {
      component: Component,
      spatializedContent,
      createSpatializedElement,
      getExtraSpatializedElementProperties,
      ...restProps
    } = props
    props.component
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
    transformVisibilityTaskContainerCallback,
    standardSpatializedContainerCallback,
    portalSpatializedContainerRef,
  } = useDomProxy(ref)

  if (inSpatializedContainer) {
    if (inPortalInstanceEnv) {
      // nested in another PortalSpatializedContainer
      return (
        <SpatialLayerContext.Provider value={layer}>
          <PortalSpatializedContainer {...spatialIdProps} {...props} />
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
            ref={portalSpatializedContainerRef}
            {...spatialIdProps}
            {...props}
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
