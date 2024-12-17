import { CSSProperties, forwardRef, useContext } from 'react'
import { useSpatialStyle } from './useSpatialStyle'
import {
  SpatialReactComponent,
  SpatialReactComponentProps,
  SpatialReactComponentRef,
} from '../SpatialReactComponent'
import { SpatialIsStandardInstanceContext } from '../SpatialReactComponent/SpatialIsStandardInstanceContext'
import { getSession } from '../../utils/getSession'
import { CSSSpatialDebugNameContext } from './CSSSpatialDebugNameContext'
import { useHijackSpatialDivRef } from './useHijackSpatialDivRef'

function renderWithCSSParser(
  inProps: SpatialReactComponentProps,
  refIn: SpatialReactComponentRef,
) {
  const { style = {}, children, ...props } = inProps
  const { ref, spatialStyle, ready } = useSpatialStyle()
  const divRefStyle: CSSProperties = {
    ...style,
    visibility: 'hidden',
    position: 'absolute',
  }

  const spatialDivStyle: CSSProperties = {
    ...style,
    transform: 'none',
  }

  const El = inProps.component || 'div'

  // hijack SpatialDiv ref
  const spatialDivRef = useHijackSpatialDivRef(refIn, ref)

  return (
    <>
      {ready && (
        <SpatialReactComponent
          style={spatialDivStyle}
          children={children}
          {...props}
          spatialStyle={spatialStyle}
          ref={spatialDivRef}
        />
      )}
      <El style={divRefStyle} {...props} ref={ref} />
    </>
  )
}

function renderWithoutCSSParser(
  inProps: SpatialReactComponentProps,
  isWebEnv: boolean,
  ref: SpatialReactComponentRef,
) {
  const { style: inStyle = {}, ...props } = inProps
  const style: CSSProperties = { ...inStyle }
  if (!isWebEnv) {
    style.transform = 'none'
  }

  return <SpatialReactComponent style={style} {...props} ref={ref} />
}

function CSSSpatialComponentBase(
  inProps: SpatialReactComponentProps,
  ref: SpatialReactComponentRef,
) {
  const isWebEnv = !getSession()
  const isInStandardInstance = !!useContext(SpatialIsStandardInstanceContext)

  if (isWebEnv || isInStandardInstance === true) {
    return renderWithoutCSSParser(inProps, isWebEnv, ref)
  } else {
    return renderWithCSSParser(inProps, ref)
  }
}

const CSSSpatialComponentBaseWithRef = forwardRef(CSSSpatialComponentBase)

function CSSSpatialComponentWithRef(
  inProps: SpatialReactComponentProps,
  ref: SpatialReactComponentRef,
) {
  return (
    <CSSSpatialDebugNameContext.Provider value={inProps.debugName || ''}>
      <CSSSpatialComponentBaseWithRef {...inProps} ref={ref} />
    </CSSSpatialDebugNameContext.Provider>
  )
}

export const CSSSpatialComponent = forwardRef(CSSSpatialComponentWithRef)
