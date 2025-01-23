import {
  CSSProperties,
  forwardRef,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react'
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
import { InjectClassName } from './injectClassStyle'
import { CSSSpatialLayerContext } from './CSSSpatialLayerContext'
import {
  CSSSpatialID,
  CSSSpatialRootContext,
  CSSSpatialRootContextObject,
} from './CSSSpatialRootContext'

interface CSSSpatialComponentWithUniqueIDProps
  extends SpatialReactComponentProps {
  [CSSSpatialID]: string
}

function renderRootCSSSpatialComponent(
  inProps: SpatialReactComponentProps,
  refIn: SpatialReactComponentRef,
) {
  const cssSpatialRootContextObject = useMemo(
    () => new CSSSpatialRootContextObject(),
    [],
  )

  const {
    style = {},
    className = '',
    children,
    debugName,
    debugShowStandardInstance,
    ...props
  } = inProps
  const { ref, spatialStyle, ready } = useSpatialStyle()

  const divRefStyle: CSSProperties = {
    ...style,
    width: 0,
    position: 'absolute',
  }

  const spatialDivStyle: CSSProperties = {
    ...style,
    transform: 'none',
  }

  const El = inProps.component || 'div'

  // hijack SpatialDiv ref
  const spatialDivRef = useHijackSpatialDivRef(refIn, ref)

  const divRefClassName = className + ' ' + InjectClassName

  return (
    <CSSSpatialRootContext.Provider value={cssSpatialRootContextObject}>
      {ready && (
        <SpatialReactComponent
          style={spatialDivStyle}
          className={className}
          children={children}
          {...props}
          spatialStyle={spatialStyle}
          debugName={debugName}
          debugShowStandardInstance={debugShowStandardInstance}
          ref={spatialDivRef}
        />
      )}

      <El
        style={divRefStyle}
        className={divRefClassName}
        {...props}
        ref={ref}
      />
    </CSSSpatialRootContext.Provider>
  )
}

function renderInWebEnv(
  props: SpatialReactComponentProps,
  ref: SpatialReactComponentRef,
) {
  return <SpatialReactComponent {...props} ref={ref} />
}

function renderInStandardInstance(
  cssSpatialRootContextObject: CSSSpatialRootContextObject,
  cssSpatialID: string,
  inProps: SpatialReactComponentProps,
  refIn: SpatialReactComponentRef,
) {
  const { style: inStyle = {}, ...props } = inProps
  const style: CSSProperties = {
    ...inStyle,
    transform: 'none',
    visibility: 'hidden',
  }

  // hijack SpatialDiv ref
  var cssParserRef = useRef<HTMLDivElement | null>(null)
  const spatialDivRef = useHijackSpatialDivRef(refIn, cssParserRef)

  useEffect(() => {
    const onDomChangeAction = (dom: HTMLDivElement | null) => {
      cssParserRef.current = dom
    }
    cssSpatialRootContextObject.onDomChange(cssSpatialID, onDomChangeAction)

    return () => {
      cssSpatialRootContextObject.offDomChange(cssSpatialID, onDomChangeAction)
    }
  }, [])

  return <SpatialReactComponent style={style} {...props} ref={spatialDivRef} />
}

function renderInPortalInstance(
  cssSpatialRootContextObject: CSSSpatialRootContextObject,
  cssSpatialID: string,
  inProps: SpatialReactComponentProps,
) {
  const {
    style = {},
    className = '',
    children,
    debugName,
    debugShowStandardInstance,
    ...props
  } = inProps
  const { ref, spatialStyle, ready } = useSpatialStyle()
  const divRefStyle: CSSProperties = {
    ...style,
    width: 0,
    position: 'absolute',
  }

  const spatialDivStyle: CSSProperties = {
    ...style,
    transform: 'none',
  }

  const El = inProps.component || 'div'

  const divRefClassName = className + ' ' + InjectClassName

  useEffect(() => {
    cssSpatialRootContextObject.setCSSParserRef(cssSpatialID, ref.current)
  }, [ref.current])

  return (
    <>
      {ready && (
        <SpatialReactComponent
          style={spatialDivStyle}
          className={className}
          children={children}
          {...props}
          spatialStyle={spatialStyle}
          debugName={debugName}
          debugShowStandardInstance={debugShowStandardInstance}
        />
      )}
      <El
        style={divRefStyle}
        className={divRefClassName}
        {...props}
        ref={ref}
      />
    </>
  )
}

function CSSSpatialComponentBase(
  inProps: CSSSpatialComponentWithUniqueIDProps,
  ref: SpatialReactComponentRef,
) {
  const { [CSSSpatialID]: cssSpatialID, ...props } = inProps
  const isWebEnv = !getSession()
  if (isWebEnv) {
    return renderInWebEnv(props, ref)
  } else {
    const cssSpatialRootContextObject = useContext(CSSSpatialRootContext)
    if (cssSpatialRootContextObject) {
      const isInStandardInstance = !!useContext(
        SpatialIsStandardInstanceContext,
      )
      if (isInStandardInstance) {
        return renderInStandardInstance(
          cssSpatialRootContextObject,
          cssSpatialID,
          props,
          ref,
        )
      } else {
        return renderInPortalInstance(
          cssSpatialRootContextObject,
          cssSpatialID,
          props,
        )
      }
    } else {
      return renderRootCSSSpatialComponent(props, ref)
    }
  }
}

const CSSSpatialComponentBaseWithRef = forwardRef(CSSSpatialComponentBase)

function CSSSpatialComponentWithRef(
  inProps: SpatialReactComponentProps,
  ref: SpatialReactComponentRef,
) {
  const layer = useContext(CSSSpatialLayerContext) + 1

  const cssSpatialRootContextObject = useContext(CSSSpatialRootContext)
  const isRootInstance = !cssSpatialRootContextObject
  const isInStandardInstance = !!useContext(SpatialIsStandardInstanceContext)
  const cssSpatialID = useMemo(() => {
    return isRootInstance
      ? layer.toString()
      : cssSpatialRootContextObject.getSpatialID(
          layer,
          isInStandardInstance,
          inProps.debugName,
        )
  }, [])

  const props = { ...inProps, [CSSSpatialID]: cssSpatialID }

  return (
    <CSSSpatialDebugNameContext.Provider value={inProps.debugName || ''}>
      <CSSSpatialLayerContext.Provider value={layer}>
        <CSSSpatialComponentBaseWithRef {...props} ref={ref} />
      </CSSSpatialLayerContext.Provider>
    </CSSSpatialDebugNameContext.Provider>
  )
}

export const CSSSpatialComponent = forwardRef(CSSSpatialComponentWithRef)
