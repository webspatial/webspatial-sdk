import { forwardRef, useMemo, useContext } from 'react'
import {
  SpatialReactComponentProps,
  SpatialReactComponentRef,
  SpatialReactComponentWithUniqueIDProps,
} from './types'
import { getSession } from '../../utils'
import { StandardInstance } from './StandardInstance'
import { PortalInstance } from './PortalInstance'
import {
  SpatialReactContext,
  SpatialReactContextObject,
} from './SpatialReactContext'
import { SpatialIsStandardInstanceContext } from './SpatialIsStandardInstanceContext'
import { SpatialID } from './const'
import { SpatialLayerContext } from './SpatialLayerContext'
import { SpatialDebugNameContext } from './SpatialDebugNameContext'

function parseProps(inProps: SpatialReactComponentWithUniqueIDProps) {
  const {
    debugShowStandardInstance,
    debugName = '',
    component,
    allowScroll,
    spatialStyle,
    scrollWithParent,
    ...props
  } = inProps

  const El = component ? component : 'div'

  const componentDesc = { El }
  const spatialDesc = { spatialStyle, allowScroll, scrollWithParent }
  const debugDesc = { debugName, debugShowStandardInstance }
  return { componentDesc, spatialDesc, debugDesc, props }
}

function renderWebReactComponent(
  inProps: SpatialReactComponentWithUniqueIDProps,
  ref: SpatialReactComponentRef,
) {
  const { componentDesc, props } = parseProps(inProps)
  const { El } = componentDesc
  return <El {...props} ref={ref} />
}

function renderSpatialReactComponent(
  inProps: SpatialReactComponentWithUniqueIDProps,
  ref: SpatialReactComponentRef,
) {
  const { componentDesc, spatialDesc, debugDesc, props } = parseProps(inProps)

  const standardInstanceProps = {
    ...props,
    ...componentDesc,
    debugShowStandardInstance: debugDesc.debugShowStandardInstance,
  }

  const portalInstanceProps = {
    ...props,
    ...componentDesc,
    ...spatialDesc,
  }

  const spatialReactContextObject = useMemo(
    () => new SpatialReactContextObject(debugDesc.debugName),
    [],
  )

  return (
    <SpatialReactContext.Provider value={spatialReactContextObject}>
      <StandardInstance {...standardInstanceProps} ref={ref} />
      <PortalInstance {...portalInstanceProps} />
    </SpatialReactContext.Provider>
  )
}

function renderSubPortalInstance(
  inProps: SpatialReactComponentWithUniqueIDProps,
) {
  const { componentDesc, spatialDesc, props } = parseProps(inProps)
  const portalInstanceProps = {
    ...props,
    ...componentDesc,
    ...spatialDesc,
  }

  return <PortalInstance {...portalInstanceProps} />
}

function SpatialReactComponentRefactor(
  inProps: SpatialReactComponentProps,
  ref: SpatialReactComponentRef,
) {
  const layer = useContext(SpatialLayerContext) + 1

  const parentSpatialReactContextObject = useContext(SpatialReactContext)
  const isRootInstance = !parentSpatialReactContextObject
  const isInStandardInstance = !!useContext(SpatialIsStandardInstanceContext)
  const spatialID = useMemo(() => {
    return isRootInstance
      ? layer.toString()
      : parentSpatialReactContextObject.getSpatialID(
          layer,
          isInStandardInstance,
          inProps.debugName,
        )
  }, [])

  const props = { ...inProps, [SpatialID]: spatialID }

  const contentInLayer = renderContentInLayer(props, ref)
  return (
    <SpatialDebugNameContext.Provider value={inProps.debugName || ''}>
      <SpatialLayerContext.Provider value={layer}>
        {contentInLayer}
      </SpatialLayerContext.Provider>
    </SpatialDebugNameContext.Provider>
  )
}

function renderContentInLayer(
  inProps: SpatialReactComponentWithUniqueIDProps,
  ref: SpatialReactComponentRef,
) {
  const isInStandardInstance = useContext(SpatialIsStandardInstanceContext)
  const isWebSpatialEnv = getSession() !== null
  if (isInStandardInstance || !isWebSpatialEnv) {
    return renderWebReactComponent(inProps, ref)
  } else {
    const parentSpatialReactContextObject = useContext(SpatialReactContext)
    if (parentSpatialReactContextObject) {
      return renderSubPortalInstance(inProps)
    } else {
      return renderSpatialReactComponent(inProps, ref)
    }
  }
}

export const SpatialReactComponent = forwardRef(SpatialReactComponentRefactor)

SpatialReactComponent.displayName = 'SpatialReactComponent'
