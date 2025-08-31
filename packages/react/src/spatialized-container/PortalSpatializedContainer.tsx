import { useMemo, useContext, useEffect, useState } from 'react'
import {
  PortalInstanceObject,
  PortalInstanceContext,
} from './context/PortalInstanceContext'
import { PortalSpatializedContainerProps } from './types'
import { SpatialID } from './SpatialID'
import { useSync2DFrame } from './hooks/useSync2DFrame'
import { useSpatializedElement } from './hooks/useSpatializedElement'
import {
  SpatializedContainerContext,
  SpatializedContainerObject,
} from './context/SpatializedContainerContext'

export function PortalSpatializedContainer(
  props: PortalSpatializedContainerProps,
) {
  const {
    spatializedContent: Content,
    createSpatializedElement,
    getExtraSpatializedElementProperties,
    [SpatialID]: spatialId,
    ...restProps
  } = props

  const spatializedContainerObject: SpatializedContainerObject = useContext(
    SpatializedContainerContext,
  )!

  const parentPortalInstanceObject = useContext(PortalInstanceContext)
  const portalInstanceObject = useMemo(
    () =>
      new PortalInstanceObject(
        spatialId,
        spatializedContainerObject,
        parentPortalInstanceObject,
        getExtraSpatializedElementProperties,
      ),
    [],
  )

  useSync2DFrame(spatialId, portalInstanceObject, spatializedContainerObject)

  const spatializedElement = useSpatializedElement(
    createSpatializedElement,
    portalInstanceObject,
  )

  return (
    <PortalInstanceContext.Provider value={portalInstanceObject}>
      {spatializedElement && portalInstanceObject.dom && (
        <Content spatializedElement={spatializedElement} {...restProps} />
      )}
    </PortalInstanceContext.Provider>
  )
}
