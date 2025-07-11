import React, { ReactNode, useContext, useMemo } from 'react'
import { createPortal as _createPortal } from 'react-dom'

import { SpatialReactContext } from './SpatialReactComponent/SpatialReactContext'
import {
  SpatialPortalContext,
  SpatialPortalContextObject,
} from './SpatialReactComponent/SpatialPortalContext'
import { getSession } from '../utils'

function MyPortalHOC(props: {
  container: Element | DocumentFragment
  children: React.ReactNode
  keyParam?: string | null
}) {
  const isInSpatialDiv = !!useContext(SpatialReactContext)
  const isWebEnv = !getSession()

  if (isWebEnv || !isInSpatialDiv) {
    return _createPortal(props.children, props.container, props.keyParam)
  } else {
    // delegate to SpatialDiv to create portal
    const spatialPortalContextObject = useMemo(
      () => new SpatialPortalContextObject(props.container, props.keyParam),
      [],
    )

    return (
      <SpatialPortalContext.Provider value={spatialPortalContextObject}>
        {props.children}
      </SpatialPortalContext.Provider>
    )
  }
}

export function createPortal(
  children: React.ReactNode,
  container: Element | DocumentFragment,
  key?: string | null,
): ReactNode {
  return (
    <MyPortalHOC container={container} keyParam={key}>
      {' '}
      {children}{' '}
    </MyPortalHOC>
  )
}
