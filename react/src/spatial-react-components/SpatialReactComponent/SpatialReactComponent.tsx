import {
  ReactNode,
  CSSProperties,
  Ref,
  useImperativeHandle,
  forwardRef,
  useMemo,
  ElementType,
  useContext,
} from 'react'
import { spatialStyleDef } from '../types'
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

export interface SpatialReactComponentProps {
  allowScroll?: boolean
  scrollWithParent?: boolean
  spatialStyle?: Partial<spatialStyleDef>
  children?: ReactNode
  className?: string
  style?: CSSProperties | undefined

  component?: ElementType

  debugName?: string
  debugShowStandardInstance?: boolean
}

interface SpatialReactComponentWithUniqueIDProps
  extends SpatialReactComponentProps {
  [SpatialID]: string
}

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
) {
  const { componentDesc, props } = parseProps(inProps)
  const { El } = componentDesc
  return <El {...props} />
}

function renderSpatialReactComponent(
  inProps: SpatialReactComponentWithUniqueIDProps,
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
      <StandardInstance {...standardInstanceProps} />
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

export type SpatialReactComponentRef = Ref<{
  getBoundingClientRect: () => DOMRect
}>

function SpatialReactComponentRefactor(
  inProps: SpatialReactComponentProps,
  ref: SpatialReactComponentRef,
) {
  useImperativeHandle(ref, () => ({
    getBoundingClientRect() {
      return new DOMRect(0, 0, 0, 0)
    },
  }))

  const layer = useContext(SpatialLayerContext) + 1

  const parentSpatialReactContextObject = useContext(SpatialReactContext)
  const isNestedSubInstance = !parentSpatialReactContextObject
  const isInStandardInstance = !!useContext(SpatialIsStandardInstanceContext)
  const spatialID = useMemo(() => {
    return isNestedSubInstance
      ? layer.toString()
      : parentSpatialReactContextObject.getSpatialID(
          layer,
          isInStandardInstance,
          inProps.debugName,
        )
  }, [])

  const props = { ...inProps, [SpatialID]: spatialID }

  const contentInLayer = renderContentInLayer(props)
  return (
    <SpatialDebugNameContext.Provider value={inProps.debugName || ''}>
      <SpatialLayerContext.Provider value={layer}>
        {contentInLayer}
      </SpatialLayerContext.Provider>
    </SpatialDebugNameContext.Provider>
  )
}

function renderContentInLayer(inProps: SpatialReactComponentWithUniqueIDProps) {
  const isInStandardInstance = useContext(SpatialIsStandardInstanceContext)
  const isWebSpatialEnv = getSession() !== null
  if (isInStandardInstance || !isWebSpatialEnv) {
    return renderWebReactComponent(inProps)
  } else {
    const parentSpatialReactContextObject = useContext(SpatialReactContext)
    if (parentSpatialReactContextObject) {
      return renderSubPortalInstance(inProps)
    } else {
      return renderSpatialReactComponent(inProps)
    }
  }
}

export const SpatialReactComponent = forwardRef(SpatialReactComponentRefactor)

SpatialReactComponent.displayName = 'SpatialReactComponent'
