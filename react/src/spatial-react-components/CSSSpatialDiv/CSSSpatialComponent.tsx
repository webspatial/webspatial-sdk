import { CSSProperties, useContext } from 'react'
import { useSpatialStyle } from './useSpatialStyle'
import {
  SpatialReactComponent,
  SpatialReactComponentProps,
} from '../SpatialReactComponent'
import { SpatialIsStandardInstanceContext } from '../SpatialReactComponent/SpatialIsStandardInstanceContext'
import { getSession } from '../../utils/getSession'
import { CSSSpatialDebugNameContext } from './CSSSpatialDebugNameContext'

function renderWithCSSParser(inProps: SpatialReactComponentProps) {
  const { style = {}, className = '', ...props } = inProps
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

  return (
    <>
      {ready && (
        <SpatialReactComponent
          style={spatialDivStyle}
          className={className}
          {...props}
          spatialStyle={spatialStyle}
        />
      )}
      <div style={divRefStyle} className={className} ref={ref} />
    </>
  )
}

function renderWithoutCSSParser(
  inProps: SpatialReactComponentProps,
  isWebEnv: boolean,
) {
  const { style: inStyle = {}, ...props } = inProps
  const style: CSSProperties = { ...inStyle }
  if (!isWebEnv) {
    style.transform = 'none'
  }

  return <SpatialReactComponent style={style} {...props} />
}

function CSSSpatialComponentBase(inProps: SpatialReactComponentProps) {
  const isWebEnv = !getSession()
  const isInStandardInstance = !!useContext(SpatialIsStandardInstanceContext)

  if (isWebEnv || isInStandardInstance === true) {
    return renderWithoutCSSParser(inProps, isWebEnv)
  } else {
    return renderWithCSSParser(inProps)
  }
}

export function CSSSpatialComponent(inProps: SpatialReactComponentProps) {
  return (
    <CSSSpatialDebugNameContext.Provider value={inProps.debugName || ''}>
      <CSSSpatialComponentBase {...inProps} />
    </CSSSpatialDebugNameContext.Provider>
  )
}
