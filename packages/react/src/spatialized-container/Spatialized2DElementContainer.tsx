import { createPortal } from 'react-dom'
import React, {
  CSSProperties,
  ElementType,
  ForwardedRef,
  forwardRef,
  useContext,
  useEffect,
} from 'react'

import { Spatialized2DElement } from '@webspatial/core-sdk'

import {
  setOpenWindowStyle,
  syncParentHeadToChild,
} from '../utils/windowStyleSync'
import { useSyncHeadStyles } from '../utils/useSyncHeadStyles'
import { getInheritedStyleProps, parseCornerRadius } from './utils'
import {
  SpatialCustomStyleVars,
  Spatialized2DElementContainerProps,
  SpatializedElementRef,
  SpatializedContentProps,
  SpatializedDivElementRef,
} from './types'
import { SpatializedContainer } from './SpatializedContainer'
import {
  PortalInstanceContext,
  PortalInstanceObject,
} from './context/PortalInstanceContext'
import { getSession } from '../utils'
function getJSXPortalInstance<P extends ElementType>(
  inProps: Omit<
    SpatializedContentProps<SpatializedElementRef, P>,
    'spatializedElement'
  >,
  portalInstanceObject: PortalInstanceObject,
) {
  const { component: El, style: inStyle = {}, ...props } = inProps
  const extraStyle: CSSProperties = {
    visibility: 'visible',
    position: 'relative',
    top: '0px',
    left: '0px',
    margin: '0px',
    marginLeft: '0px',
    marginRight: '0px',
    marginTop: '0px',
    marginBottom: '0px',
    borderRadius: '0px',
    // overflow: '',
    transform: 'none',
  }

  const computedStyle = portalInstanceObject.computedStyle!
  const inheritedPortalStyle: CSSProperties =
    getInheritedStyleProps(computedStyle)

  const style = {
    ...inStyle,
    ...inheritedPortalStyle,
    ...extraStyle,
  }

  return <El style={style} {...props} />
}

function useSyncDocumentTitle(
  windowProxy: WindowProxy,
  spatializedElement: Spatialized2DElement,
  name: string,
) {
  useEffect(() => {
    windowProxy.document.title = name
    spatializedElement.updateProperties({
      name,
    })
  }, [name])
}

function SpatializedContent<P extends ElementType>(
  props: SpatializedContentProps<SpatializedElementRef, P>,
) {
  const { spatializedElement, ...restProps } = props
  const spatialized2DElement = spatializedElement as Spatialized2DElement
  const { windowProxy } = spatialized2DElement

  useSyncHeadStyles(windowProxy, {
    subtree: false,
  })

  const name: string = (restProps as any)['data-name'] || ''
  useSyncDocumentTitle(windowProxy, spatialized2DElement, name)

  const portalInstanceObject: PortalInstanceObject = useContext(
    PortalInstanceContext,
  )!
  const JSXPortalInstance = getJSXPortalInstance(
    restProps,
    portalInstanceObject,
  )

  return createPortal(JSXPortalInstance, windowProxy.document.body)
}

function getExtraSpatializedElementProperties(
  computedStyle: CSSStyleDeclaration,
) {
  // get extra spatialized element properties for Spatialized2DElement
  const overflow = computedStyle.getPropertyValue('overflow')
  const scrollPageEnabled = ['visible', 'hidden', 'clip'].indexOf(overflow) >= 0
  const material = computedStyle.getPropertyValue(
    SpatialCustomStyleVars.backgroundMaterial,
  )

  const properties: Record<string, any> = {}
  properties.scrollPageEnabled = scrollPageEnabled
  properties.cornerRadius = parseCornerRadius(computedStyle)
  if (material) {
    properties.material = material
  }

  // may need add scrollEdgeInsetsMarginRight in future
  return properties
}

async function createSpatializedElement() {
  const spatializedElement = await getSession()!.createSpatialized2DElement()
  const { windowProxy } = spatializedElement
  setOpenWindowStyle(windowProxy)
  await syncParentHeadToChild(windowProxy)

  const viewport = windowProxy.document.querySelector('meta[name="viewport"]')
  if (viewport) {
    viewport?.setAttribute(
      'content',
      ' initial-scale=1.0, maximum-scale=1.0, user-scalable=no',
    )
  } else {
    const meta = windowProxy.document.createElement('meta')
    meta.name = 'viewport'
    meta.content = 'initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
    windowProxy.document.head.appendChild(meta)
  }

  return spatializedElement
}

function Spatialized2DElementContainerBase<P extends ElementType>(
  props: Spatialized2DElementContainerProps<P>,
  ref: ForwardedRef<SpatializedDivElementRef>,
) {
  return (
    <SpatializedContainer<SpatializedElementRef>
      ref={ref as any}
      createSpatializedElement={createSpatializedElement}
      getExtraSpatializedElementProperties={
        getExtraSpatializedElementProperties
      }
      spatializedContent={SpatializedContent}
      {...props}
    />
  )
}

export const Spatialized2DElementContainer = forwardRef(
  Spatialized2DElementContainerBase,
) as <P extends ElementType>(
  props: Spatialized2DElementContainerProps<P> & {
    ref: ForwardedRef<SpatializedElementRef>
  },
) => React.ReactElement | null
