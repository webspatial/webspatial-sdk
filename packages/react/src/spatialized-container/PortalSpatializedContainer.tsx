import { useMemo, useContext, useEffect } from 'react'
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

function renderPlaceholderInSubPortal(
  portalInstanceObject: PortalInstanceObject,
  El: React.ElementType,
) {
  const spatialId = portalInstanceObject.spatialId
  const inPortalInstanceEnv = !!portalInstanceObject.parentPortalInstanceObject
  const position =
    portalInstanceObject.computedStyle?.getPropertyValue('position')

  const shouldRenderPlaceHolder =
    inPortalInstanceEnv &&
    portalInstanceObject &&
    portalInstanceObject.domRect &&
    position !== 'absolute' &&
    position !== 'fixed'

  if (!shouldRenderPlaceHolder) {
    return <></>
  }

  const { width, height } = portalInstanceObject.domRect
  const display =
    portalInstanceObject.computedStyle!.getPropertyPriority('display')

  const spatialIdProps = { [SpatialID]: spatialId }
  return (
    <El
      {...spatialIdProps}
      style={{
        position: 'relative',
        width: `${width}px`,
        height: `${height}px`,
        visibility: 'hidden',
        display,
      }}
    />
  )
}

export function PortalSpatializedContainer(
  props: PortalSpatializedContainerProps,
) {
  const {
    spatializedContent: Content,
    createSpatializedElement,
    getExtraSpatializedElementProperties,
    onSpatialTap,
    onSpatialDragStart,
    onSpatialDrag,
    onSpatialDragEnd,
    onSpatialRotateStart,
    onSpatialRotate,
    onSpatialRotateEnd,
    onSpatialMagnify,
    onSpatialMagnifyEnd,
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

  const PlaceholderEl = renderPlaceholderInSubPortal(
    portalInstanceObject,
    props.component,
  )

  useEffect(() => {
    if (spatializedElement) {
      // @ts-ignore
      spatializedElement.onSpatialTap = onSpatialTap
    }
  }, [spatializedElement, onSpatialTap])

  useEffect(() => {
    if (spatializedElement) {
      // @ts-ignore
      spatializedElement.onSpatialDrag = onSpatialDrag
    }
  }, [spatializedElement, onSpatialDrag])

  useEffect(() => {
    if (spatializedElement) {
      // @ts-ignore
      spatializedElement.onSpatialDragEnd = onSpatialDragEnd
    }
  }, [spatializedElement, onSpatialDragEnd])

  useEffect(() => {
    if (spatializedElement) {
      // @ts-ignore
      spatializedElement.onSpatialRotate = onSpatialRotate
    }
  }, [spatializedElement, onSpatialRotate])

  useEffect(() => {
    if (spatializedElement) {
      // @ts-ignore
      spatializedElement.onSpatialRotateEnd = onSpatialRotateEnd
    }
  }, [spatializedElement, onSpatialRotateEnd])

  useEffect(() => {
    if (spatializedElement) {
      // @ts-ignore
      spatializedElement.onSpatialMagnify = onSpatialMagnify
    }
  }, [spatializedElement, onSpatialMagnify])

  useEffect(() => {
    if (spatializedElement) {
      // @ts-ignore
      spatializedElement.onSpatialMagnifyEnd = onSpatialMagnifyEnd
    }
  }, [spatializedElement, onSpatialMagnifyEnd])

  useEffect(() => {
    if (spatializedElement) {
      // @ts-ignore
      spatializedElement.onSpatialDragStart = onSpatialDragStart
    }
  }, [spatializedElement, onSpatialDragStart])

  useEffect(() => {
    if (spatializedElement) {
      console.log('dbg onSpatialRotateStart')
      // @ts-ignore
      spatializedElement.onSpatialRotateStart = onSpatialRotateStart
    }
  }, [spatializedElement, onSpatialRotateStart])

  return (
    <PortalInstanceContext.Provider value={portalInstanceObject}>
      {spatializedElement && portalInstanceObject.dom && (
        <Content spatializedElement={spatializedElement} {...restProps} />
      )}
      {PlaceholderEl}
    </PortalInstanceContext.Provider>
  )
}
