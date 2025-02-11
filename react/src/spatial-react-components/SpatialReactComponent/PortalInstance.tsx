import React, {
  CSSProperties,
  useRef,
  ReactNode,
  useCallback,
  useEffect,
  useState,
  useContext,
  useMemo,
} from 'react'
import { createPortal } from 'react-dom'
import { usePortalContainer } from './usePortalContainer'
import { SpatialWindowManagerContext } from './SpatialWindowManagerContext'
import { SpatialWindowManager } from './SpatialWindowManager'

import {
  domRect2rectType,
  getInheritedStyleProps,
  parseCornerRadius,
  parseTransformOrigin,
} from './utils'
import { SpatialReactContext } from './SpatialReactContext'
import { SpatialID } from './const'
import { SpatialDebugNameContext } from './SpatialDebugNameContext'
import { CornerRadius } from '@xrsdk/runtime'
import { RectType, vecType } from '../types'
import { spatialStyleDef } from './types'

interface PortalInstanceProps {
  allowScroll?: boolean
  scrollWithParent?: boolean
  spatialStyle?: Partial<spatialStyleDef>

  El: React.ElementType
  children?: ReactNode
  style?: CSSProperties | undefined
  className: string

  [SpatialID]: string
}

function renderJSXPortalInstance(
  inProps: Omit<
    PortalInstanceProps,
    'allowScroll' | 'scrollWithParent' | 'spatialStyle'
  >,
  elWidth: number,
  elHeight: number,
  inheritedPortalStyle: CSSProperties,
  className: string,
) {
  const { El, style: inStyle = {}, className: _, ...props } = inProps
  const extraStyle = {
    visibility: 'visible',
    position: '',
    top: '0px',
    left: '0px',
    margin: '0px',
    marginLeft: '0px',
    marginRight: '0px',
    marginTop: '0px',
    marginBottom: '0px',
    borderRadius: '0px',
    overflow: '',
  }
  const elWHStyle = {
    width: `${elWidth}px`,
    height: `${elHeight}px`,
  }
  const style = {
    ...inStyle,
    ...inheritedPortalStyle,
    ...extraStyle,
    ...elWHStyle,
  }

  console.log('dbg PortalInstance inProps', props, className)

  return <El style={style} className={className} {...props} />
}

function setOpenWindowStyle(openedWindow: Window) {
  openedWindow!.document.documentElement.style.cssText +=
    document.documentElement.style.cssText

  openedWindow!.document.documentElement.style.backgroundColor = 'transparent'
  openedWindow!.document.body.style.margin = '0px'
}

function handleOpenWindowDocumentClick(openedWindow: Window) {
  // Overwrite link href to navigate the parents page
  openedWindow!.document.onclick = function (e) {
    let element = e.target as HTMLElement | null
    let found = false

    // Look for <a> element in the clicked elements parents and if found override navigation behavior if needed
    while (!found) {
      if (element && element.tagName == 'A') {
        // When using libraries like react route's <Link> it sets an onclick event, when this happens we should do nothing and let that occur
        if (!element.onclick) {
          window.location.href = (element as HTMLAnchorElement).href
        }
        return false // prevent default action and stop event propagation
      }
      if (element && element.parentElement) {
        element = element.parentElement
      } else {
        break
      }
    }
  }
}

function asyncLoadStyleToChildWindow(
  childWindow: WindowProxy,
  n: HTMLLinkElement,
  debugName: string,
) {
  return new Promise(resolve => {
    // Safari seems to have a bug where
    // ~1/50 loads, if the same url is loaded very quickly in a window and a child window,
    // the second load request never is fired resulting in css not to be applied.
    // Workaround this by making the css stylesheet request unique
    n.href += '?uniqueURL=' + Math.random()
    n.onerror = function () {
      console.error(
        'Failed to load style link',
        debugName,
        (n as HTMLLinkElement).href,
      )
      resolve(false)
    }
    n.onload = function () {
      resolve(true)
    }

    childWindow.document.head.appendChild(n)
  })
}

async function syncParentHeadToChild(
  childWindow: WindowProxy,
  debugName: string,
) {
  const styleLoadedPromises = []

  for (let i = document.head.children.length - 1; i >= 0; i--) {
    let n = document.head.children[i].cloneNode(true)
    if (
      n.nodeName == 'LINK' &&
      (n as HTMLLinkElement).rel == 'stylesheet' &&
      (n as HTMLLinkElement).href
    ) {
      const promise = asyncLoadStyleToChildWindow(
        childWindow,
        n as HTMLLinkElement,
        debugName,
      )
      styleLoadedPromises.push(promise)
    } else {
      childWindow.document.head.appendChild(n)
    }
  }

  if (debugName) {
    childWindow.document.title = debugName
  }

  return Promise.all(styleLoadedPromises)
}

async function syncHeaderStyle(openedWindow: Window, debugName: string) {
  // Synchronize head of parent page to this page to ensure styles are in sync
  await syncParentHeadToChild(openedWindow, debugName)

  const headObserver = new MutationObserver(mutations => {
    syncParentHeadToChild(openedWindow, debugName)
  })

  headObserver.observe(document.head, { childList: true, subtree: true })

  return headObserver
}

function syncDefaultSpatialStyle(openedWindow: Window, debugName: string) {
  const styleElement = document.createElement('style')
  styleElement.type = 'text/css'
  styleElement.innerHTML =
    ' .xr-spatial-default {  --xr-back: 0.001; --xr-background-material: none  } '
  openedWindow.document.head.appendChild(styleElement)
}

function useSyncSpatialProps(
  spatialWindowManager: SpatialWindowManager | undefined,
  props: Pick<
    PortalInstanceProps,
    'style' | 'allowScroll' | 'scrollWithParent' | 'spatialStyle'
  >,
  domRect: RectType,
  anchor: vecType,
  cornerRadiusFromStyle: CornerRadius,
  opacity: number,
) {
  let { allowScroll, scrollWithParent, style, spatialStyle = {} } = props
  let {
    position = { x: 0, y: 0, z: 1 },
    rotation = { x: 0, y: 0, z: 0, w: 1 },
    scale = { x: 1, y: 1, z: 1 },
    material = { type: 'none' },
    cornerRadius = cornerRadiusFromStyle,
    zIndex = 0,
  } = spatialStyle
  let stylePosition = style?.position
  let styleOverflow = style?.overflow

  const visible = useMemo(() => {
    return (
      spatialStyle.visible !== false && domRect.width > 0 && domRect.height > 0
    )
  }, [spatialStyle.visible, domRect.width, domRect.height])

  // fill default values for position
  if (position.x === undefined) position.x = 0
  if (position.y === undefined) position.y = 0
  if (position.z === undefined) position.z = 1

  // fill default values for scale
  if (scale.x === undefined) scale.x = 1
  if (scale.y === undefined) scale.y = 1
  if (scale.z === undefined) scale.z = 1

  // fill cornerRadius Object
  const cornerRadiusObject: CornerRadius = {
    topLeading: 0,
    bottomLeading: 0,
    topTrailing: 0,
    bottomTrailing: 0,
  }
  if (typeof cornerRadius == 'number') {
    cornerRadiusObject.topLeading = cornerRadius
    cornerRadiusObject.bottomLeading = cornerRadius
    cornerRadiusObject.topTrailing = cornerRadius
    cornerRadiusObject.bottomTrailing = cornerRadius
  } else {
    Object.assign(cornerRadiusObject, cornerRadius)
  }

  // Sync prop updates
  useEffect(() => {
    if (spatialWindowManager && spatialWindowManager.webview) {
      const webview = spatialWindowManager.webview
      ;(async function () {
        webview.setStyle({
          material: { type: material.type },
          cornerRadius: cornerRadiusObject,
        })
      })()
    }
  }, [
    spatialWindowManager,
    material.type,
    cornerRadiusObject.topLeading,
    cornerRadiusObject.bottomLeading,
    cornerRadiusObject.topTrailing,
    cornerRadiusObject.bottomTrailing,
  ])

  useEffect(() => {
    if (spatialWindowManager && spatialWindowManager.webview) {
      const webview = spatialWindowManager.webview
      ;(async function () {
        webview.setScrollEnabled(allowScroll || styleOverflow == 'scroll')

        const isFixed = scrollWithParent == false || stylePosition == 'fixed'
        webview.setScrollWithParent(!isFixed)
      })()
    }
  }, [
    spatialWindowManager,
    allowScroll,
    scrollWithParent,
    stylePosition,
    styleOverflow,
  ])

  useEffect(() => {
    if (spatialWindowManager) {
      ;(async function () {
        await spatialWindowManager.resize(
          domRect,
          position as vecType,
          rotation,
          scale as vecType,
          anchor,
        )

        spatialWindowManager?.setZIndex(zIndex)
      })()
    }
  }, [
    spatialWindowManager,
    domRect.x,
    domRect.y,
    domRect.width,
    domRect.height,
    position,
    rotation,
    scale,
    anchor,
    zIndex,
  ])

  useEffect(() => {
    if (spatialWindowManager && spatialWindowManager.webview) {
      const webview = spatialWindowManager.webview
      webview.setOpacity(opacity)
    }
  }, [spatialWindowManager, opacity])

  useEffect(() => {
    if (spatialWindowManager) {
      spatialWindowManager.entity?.setVisible(visible)
    }
  }, [spatialWindowManager, visible])

  useEffect(() => {
    // sync viewport
    if (spatialWindowManager?.window && spatialWindowManager.webview) {
      ;(async function () {
        const bodyWidth = document.body.getBoundingClientRect().width
        const viewport = spatialWindowManager.window?.document.querySelector(
          'meta[name="viewport"]',
        )
        viewport?.setAttribute(
          'content',
          `width=${bodyWidth}, initial-scale=1.0 user-scalable=no`,
        )
        await spatialWindowManager.webview?.setScrollEdgeInsets({
          top: 0,
          left: 0,
          bottom: 0,
          right: domRect.width - bodyWidth,
        })
      })()
    }
  }, [spatialWindowManager, domRect.width])
}

function useSyncDomRect(spatialId: string) {
  const [domRect, setDomRect] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  })

  const inheritedPortalStyleRef = useRef({})

  const anchorRef = useRef({
    x: 0.5,
    y: 0.5,
    z: 0.5,
  })

  const cornerRadiusRef = useRef({
    topLeading: 0,
    bottomLeading: 0,
    topTrailing: 0,
    bottomTrailing: 0,
  })

  const opacityRef = useRef(1.0)

  const spatialReactContextObject = useContext(SpatialReactContext)

  const inheritedPortalClassNameRef = useRef('')

  useEffect(() => {
    const syncDomRect = () => {
      const dom = spatialReactContextObject?.querySpatialDom(spatialId)

      if (!dom) {
        return
      }
      let domRect = dom.getBoundingClientRect()
      let rectType = domRect2rectType(domRect)

      const parentDom =
        spatialReactContextObject?.queryParentSpatialDom(spatialId)
      if (parentDom) {
        const parentDomRect = parentDom.getBoundingClientRect()
        const parentRectType = domRect2rectType(parentDomRect)
        rectType.x -= parentRectType.x
        rectType.y -= parentRectType.y
      }
      const computedStyle = getComputedStyle(dom)
      inheritedPortalStyleRef.current = getInheritedStyleProps(computedStyle)

      const anchor = parseTransformOrigin(computedStyle)
      anchorRef.current = anchor

      const cornerRadius = parseCornerRadius(computedStyle)
      cornerRadiusRef.current = cornerRadius

      const opacity = parseFloat(computedStyle.getPropertyValue('opacity'))
      opacityRef.current = opacity

      inheritedPortalClassNameRef.current = dom.className

      setDomRect(rectType)
    }

    spatialReactContextObject?.onDomChange(spatialId, syncDomRect)

    return () => {
      spatialReactContextObject?.offDomChange(spatialId)
    }
  }, [])

  return {
    domRect,
    inheritedPortalStyle: inheritedPortalStyleRef.current,
    anchor: anchorRef.current,
    cornerRadius: cornerRadiusRef.current,
    opacity: opacityRef.current,
    className: inheritedPortalClassNameRef.current,
  }
}

export function PortalInstance(inProps: PortalInstanceProps) {
  const { allowScroll, scrollWithParent, spatialStyle, ...props } = inProps

  const debugName = useContext(SpatialDebugNameContext)

  const onContainerSpawned = useCallback(
    async (spatialWindowManager: SpatialWindowManager) => {
      const openWindow = spatialWindowManager.window!
      setOpenWindowStyle(openWindow)
      handleOpenWindowDocumentClick(openWindow)

      syncDefaultSpatialStyle(openWindow, debugName)

      const headObserver = await syncHeaderStyle(openWindow, debugName)
      const spawnedResult = {
        headObserver,
      }

      spatialWindowManager.setDebugName(debugName)

      return spawnedResult
    },
    [],
  )

  const onContainerDestroyed = useCallback(
    (spatialWindowManager: SpatialWindowManager, spawnedResult: any) => {
      const { headObserver } = spawnedResult
      headObserver.disconnect()
    },
    [],
  )

  const [spatialWindowManager] = usePortalContainer({
    onContainerSpawned,
    onContainerDestroyed,
  })

  const spatialId = props[SpatialID]

  const {
    domRect,
    inheritedPortalStyle,
    anchor,
    cornerRadius,
    opacity,
    className,
  } = useSyncDomRect(spatialId)

  useSyncSpatialProps(
    spatialWindowManager,
    {
      style: props.style,
      allowScroll,
      scrollWithParent,
      spatialStyle,
    },
    domRect,
    anchor,
    cornerRadius,
    opacity,
  )

  const JSXPortalInstance = renderJSXPortalInstance(
    props,
    domRect.width,
    domRect.height,
    inheritedPortalStyle,
    className,
  )

  return (
    <SpatialWindowManagerContext.Provider value={spatialWindowManager}>
      {spatialWindowManager &&
        spatialWindowManager.window &&
        createPortal(
          JSXPortalInstance,
          spatialWindowManager.window.document.body,
        )}
    </SpatialWindowManagerContext.Provider>
  )
}

PortalInstance.displayName = 'PortalInstance'
