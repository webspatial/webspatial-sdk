import React, {
  CSSProperties,
  ElementType,
  ForwardedRef,
  forwardRef,
  useContext,
  useEffect,
} from 'react'
import { SpatializedContainer } from './SpatializedContainer'
import { getSession } from '../utils'
import {
  SpatialCustomStyleVars,
  Spatialized2DElementContainerProps,
  SpatializedElementRef,
  SpatializedContentProps,
  SpatializedDivElementRef,
} from './types'
import {
  PortalInstanceContext,
  PortalInstanceObject,
} from './context/PortalInstanceContext'
import { Spatialized2DElement } from '@webspatial/core-sdk'
import { createPortal } from 'react-dom'
import { getInheritedStyleProps, parseCornerRadius } from './utils'

function asyncLoadStyleToChildWindow(
  childWindow: WindowProxy,
  n: HTMLLinkElement,
) {
  return new Promise(resolve => {
    // Safari seems to have a bug where
    // ~1/50 loads, if the same url is loaded very quickly in a window and a child window,
    // the second load request never is fired resulting in css not to be applied.
    // Workaround this by making the css stylesheet request unique
    n.href += '?uniqueURL=' + Math.random()
    n.onerror = function (error) {
      console.error('Failed to load style link', (n as HTMLLinkElement).href)
      resolve(false)
    }
    n.onload = function () {
      resolve(true)
    }

    // need to wait for some time to make sure the style is loaded
    // otherwise, the style may not be applied
    setTimeout(() => {
      childWindow.document.head.appendChild(n)
    }, 50)
  })
}

function setOpenWindowStyle(openedWindow: WindowProxy) {
  openedWindow!.document.documentElement.style.cssText +=
    document.documentElement.style.cssText
  openedWindow!.document.documentElement.style.backgroundColor = 'transparent'
  openedWindow!.document.body.style.margin = '0px'

  // openedWindow body's width and height should be set to inline-block to make sure the width and height are correct
  openedWindow.document.body.style.display = 'inline-block'
  openedWindow.document.body.style.minWidth = 'auto'
  openedWindow.document.body.style.minHeight = 'auto'
  openedWindow.document.body.style.maxWidth = 'fit-content'
  openedWindow.document.body.style.minWidth = 'fit-content'
  openedWindow.document.body.style.background = 'transparent'
}

async function syncParentHeadToChild(childWindow: WindowProxy) {
  const styleLoadedPromises = []

  for (let i = 0; i < document.head.children.length; i++) {
    let n = document.head.children[i].cloneNode(true)
    if (
      n.nodeName == 'LINK' &&
      (n as HTMLLinkElement).rel == 'stylesheet' &&
      (n as HTMLLinkElement).href
    ) {
      const promise = asyncLoadStyleToChildWindow(
        childWindow,
        n as HTMLLinkElement,
      )
      styleLoadedPromises.push(promise)
    } else {
      childWindow.document.head.appendChild(n)
    }
  }

  // sync className
  childWindow.document.documentElement.className =
    document.documentElement.className

  return Promise.all(styleLoadedPromises)
}

function getJSXPortalInstance<P extends ElementType>(
  inProps: Omit<
    SpatializedContentProps<SpatializedElementRef, P>,
    'spatializedElement'
  >,
  portalInstanceObject: PortalInstanceObject,
) {
  const { component: El, style: inStyle = {}, ...props } = inProps
  const computedStyle = portalInstanceObject.computedStyle!
  const inheritedPortalStyle: CSSProperties =
    getInheritedStyleProps(computedStyle)

  const extraStyle: CSSProperties = {
    position: 'relative',
    top: '0px',
    left: '0px',
    margin: '0px',
    marginLeft: '0px',
    marginRight: '0px',
    marginTop: '0px',
    marginBottom: '0px',
    transform: 'none',
    borderRadius: '0px',
  }

  const style: CSSProperties = {
    ...inStyle,
    ...inheritedPortalStyle,
    ...extraStyle,
  }
  {
    const hostDom = portalInstanceObject.dom as HTMLElement | undefined
    const hasInlineVisibility =
      !!hostDom &&
      hostDom.style.visibility !== '' &&
      hostDom.style.visibility !== undefined
    if (!hasInlineVisibility) {
      const computedVisibility = computedStyle.getPropertyValue('visibility')
      if (computedVisibility) {
        ;(style as any).visibility = computedVisibility
      }
    }
  }

  return <El style={style} {...props} />
}

function useSyncHeaderStyle(windowProxy: WindowProxy) {
  useEffect(() => {
    // sync parent head to child when document header style changed
    const headObserver = new MutationObserver(_ => {
      syncParentHeadToChild(windowProxy)
    })

    headObserver.observe(document.head, { childList: true, subtree: true })
    return () => {
      headObserver.disconnect()
    }
  }, [])
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
  const windowProxy = spatialized2DElement.windowProxy

  useSyncHeaderStyle(windowProxy)

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
  const windowProxy = spatializedElement.windowProxy
  setOpenWindowStyle(windowProxy)
  await syncParentHeadToChild(windowProxy)

  const viewport = windowProxy.document.querySelector('meta[name="viewport"]')
  if (viewport) {
    viewport?.setAttribute(
      'content',
      ` initial-scale=1.0, maximum-scale=1.0, user-scalable=no`,
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
