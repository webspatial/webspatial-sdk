import { useContext, useMemo } from 'react'
import {
  SpatializedContainerContext,
  SpatializedContainerObject,
} from './context/SpatializedContainerContext'
import { getSession } from '../utils/getSession'
import { SpatialLayerContext } from './context/SpatialLayerContext'
import { SpatializedContainerProps } from './types'
import { StandardSpatializedContainer } from './StandardSpatializedContainer'
import { PortalSpatializedContainer } from './PortalSpatializedContainer'
import { PortalInstanceContext } from './context/PortalInstanceContext'
import { SpatialID } from './SpatialID'
import { TransformVisibilityTaskContainer } from './TransformVisibilityTaskContainer'

export function SpatializedContainer(props: SpatializedContainerProps) {
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
    return <Component {...restProps} />
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

  console.log(
    'inSpatializedContainer',
    rootSpatializedContainerObject,
    inSpatializedContainer,
    'spatialId:',
    spatialId,
  )

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
          <StandardSpatializedContainer {...spatialIdProps} {...restProps} />
          <TransformVisibilityTaskContainer
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
          <StandardSpatializedContainer {...spatialIdProps} {...restProps} />
          <PortalSpatializedContainer {...spatialIdProps} {...props} />
          <TransformVisibilityTaskContainer
            {...spatialIdProps}
            className={props.className}
            style={props.style}
          />
        </SpatializedContainerContext.Provider>
      </SpatialLayerContext.Provider>
    )
  }
}
