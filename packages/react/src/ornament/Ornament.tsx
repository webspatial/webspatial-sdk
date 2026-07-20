'use client'

import {
  type CSSProperties,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import {
  Ornament as CoreOrnament,
  normalizeOrnamentOptions,
  type BackgroundMaterialType,
  type CornerRadius,
  type OrnamentOptions,
  type OrnamentPoint3D,
  type OrnamentVisibility,
} from '@webspatial/core-sdk'

import { syncParentHeadToChild } from '../utils/windowStyleSync'
import { useSyncHeadStyles } from '../utils/useSyncHeadStyles'
import { getSession } from '../utils/getSession'
import { WebSpatialRuntime } from '../webSpatialRuntime'
import { useInsideAttachment } from '../reality/context/InsideAttachmentContext'
import {
  InsideOrnamentContext,
  useInsideOrnament,
} from './InsideOrnamentContext'

const ORNAMENT_BACKGROUND_MATERIAL_STYLE_VAR = '--xr-background-material'

type OrnamentStyle = CSSProperties & {
  [ORNAMENT_BACKGROUND_MATERIAL_STYLE_VAR]?: BackgroundMaterialType
}

type OrnamentPublicOptions = Omit<OrnamentOptions, 'backgroundMaterial'>

export type OrnamentProps = OrnamentPublicOptions & {
  children: ReactNode
  style?: OrnamentStyle
}

const UNITLESS_STYLE_PROPERTIES = new Set([
  'animationIterationCount',
  'aspectRatio',
  'borderImageOutset',
  'borderImageSlice',
  'borderImageWidth',
  'boxFlex',
  'boxFlexGroup',
  'boxOrdinalGroup',
  'columnCount',
  'columns',
  'flex',
  'flexGrow',
  'flexPositive',
  'flexShrink',
  'flexNegative',
  'flexOrder',
  'gridArea',
  'gridRow',
  'gridRowEnd',
  'gridRowSpan',
  'gridRowStart',
  'gridColumn',
  'gridColumnEnd',
  'gridColumnSpan',
  'gridColumnStart',
  'fontWeight',
  'lineClamp',
  'lineHeight',
  'opacity',
  'order',
  'orphans',
  'tabSize',
  'widows',
  'zIndex',
  'zoom',
  'fillOpacity',
  'floodOpacity',
  'stopOpacity',
  'strokeDasharray',
  'strokeDashoffset',
  'strokeMiterlimit',
  'strokeOpacity',
  'strokeWidth',
])

function getOrnamentStyleBackgroundMaterial(
  style: OrnamentStyle | undefined,
): OrnamentOptions['backgroundMaterial'] {
  return style?.[ORNAMENT_BACKGROUND_MATERIAL_STYLE_VAR] as
    | OrnamentOptions['backgroundMaterial']
    | undefined
}

function hyphenateStyleName(name: string) {
  if (name === 'cssFloat') return 'float'
  return name.replace(/[A-Z]/g, '-$&').toLowerCase().replace(/^ms-/, '-ms-')
}

function serializeStyleValue(name: string, value: unknown) {
  if (
    value === null ||
    value === undefined ||
    typeof value === 'boolean' ||
    value === ''
  ) {
    return undefined
  }
  if (
    typeof value === 'number' &&
    value !== 0 &&
    !name.startsWith('--') &&
    !UNITLESS_STYLE_PROPERTIES.has(name)
  ) {
    return `${value}px`
  }
  return String(value).trim()
}

function syncOrnamentDocumentStyle(
  element: HTMLElement,
  style: OrnamentStyle | undefined,
  appliedStyleNames: Set<string>,
) {
  const nextStyleNames = new Set<string>()
  const styleRecord = (style ?? {}) as Record<string, unknown>

  for (const name of Object.keys(styleRecord)) {
    const cssName = name.startsWith('--') ? name : hyphenateStyleName(name)
    const cssValue = serializeStyleValue(name, styleRecord[name])
    if (cssValue === undefined) {
      continue
    }
    element.style.setProperty(cssName, cssValue)
    nextStyleNames.add(name)
  }

  for (const name of appliedStyleNames) {
    if (!nextStyleNames.has(name)) {
      const cssName = name.startsWith('--') ? name : hyphenateStyleName(name)
      element.style.removeProperty(cssName)
      if (!name.startsWith('--')) {
        ;(element.style as unknown as Record<string, string>)[name] = ''
      }
    }
  }

  appliedStyleNames.clear()
  for (const name of nextStyleNames) {
    appliedStyleNames.add(name)
  }
}

function warnUnsupported(message: string) {
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') {
    return
  }
  console.warn(message)
}

function ensureViewportMeta(windowProxy: WindowProxy) {
  const viewport = windowProxy.document.querySelector('meta[name="viewport"]')
  if (viewport) {
    viewport.setAttribute(
      'content',
      'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no',
    )
    return
  }

  const meta = windowProxy.document.createElement('meta')
  meta.name = 'viewport'
  meta.content =
    'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
  windowProxy.document.head.appendChild(meta)
}

function ensureBaseHref(windowProxy: WindowProxy) {
  let base = windowProxy.document.querySelector('base')
  if (!base) {
    base = windowProxy.document.createElement('base')
    windowProxy.document.head.appendChild(base)
  }
  base.href = document.baseURI
}

function setOrnamentWindowFrameFillStyle(windowProxy: WindowProxy) {
  windowProxy.document.documentElement.style.backgroundColor = 'transparent'
  windowProxy.document.body.style.margin = '0px'
  windowProxy.document.body.style.display = 'block'
  windowProxy.document.body.style.minWidth = '100%'
  windowProxy.document.body.style.maxWidth = '100%'
  windowProxy.document.body.style.minHeight = '100%'
}

async function prepareOrnamentWindow(windowProxy: WindowProxy) {
  setOrnamentWindowFrameFillStyle(windowProxy)
  ensureViewportMeta(windowProxy)
  ensureBaseHref(windowProxy)
  await syncParentHeadToChild(windowProxy)
}

export function Ornament({
  attachmentAnchor,
  contentAlignment,
  visibility,
  width,
  height,
  cornerRadius,
  style,
  children,
}: OrnamentProps): React.ReactElement | null {
  const insideOrnament = useInsideOrnament()
  const insideAttachment = useInsideAttachment()
  const supported = WebSpatialRuntime.supports('Ornament')
  const [windowProxy, setWindowProxy] = useState<WindowProxy | null>(null)
  const ornamentRef = useRef<CoreOrnament | null>(null)
  const appliedStyleNamesRef = useRef(new Set<string>())
  const backgroundMaterial = getOrnamentStyleBackgroundMaterial(style)

  const normalizedOptions = useMemo(
    () =>
      normalizeOrnamentOptions({
        attachmentAnchor,
        contentAlignment,
        visibility,
        width,
        height,
        cornerRadius,
        backgroundMaterial,
      }),
    [
      attachmentAnchor,
      backgroundMaterial,
      contentAlignment,
      cornerRadius,
      height,
      visibility,
      width,
    ],
  )

  const latestOptionsRef = useRef(normalizedOptions)
  const latestStyleRef = useRef(style)
  useEffect(() => {
    latestStyleRef.current = style
  }, [style])

  useEffect(() => {
    latestOptionsRef.current = normalizedOptions
    const ornament = ornamentRef.current
    if (ornament) {
      void ornament.update(normalizedOptions)
    }
  }, [normalizedOptions])

  useEffect(() => {
    if (!windowProxy) return
    syncOrnamentDocumentStyle(
      windowProxy.document.documentElement,
      style,
      appliedStyleNamesRef.current,
    )
  }, [windowProxy, style])

  useEffect(() => {
    if (insideOrnament) {
      warnUnsupported(
        '[WebSpatial] Ornament cannot be used inside Ornament content.',
      )
      return
    }
    if (insideAttachment) {
      warnUnsupported(
        '[WebSpatial] Ornament cannot be used inside Attachment content.',
      )
      return
    }
    if (!supported) {
      return
    }

    let disposed = false

    const init = async () => {
      const session = await getSession()
      if (!session || disposed) return

      let ornament: CoreOrnament | null = null
      try {
        let appliedOptions = latestOptionsRef.current
        ornament = await session.createOrnament(appliedOptions)
        if (disposed) {
          await ornament.destroy()
          return
        }

        const applyPendingOptions = async () => {
          const pendingOptions = latestOptionsRef.current
          if (pendingOptions !== appliedOptions) {
            await ornament!.update(pendingOptions)
            appliedOptions = pendingOptions
          }
        }

        const childWindow = ornament.getWindowProxy()
        await prepareOrnamentWindow(childWindow)
        syncOrnamentDocumentStyle(
          childWindow.document.documentElement,
          latestStyleRef.current,
          appliedStyleNamesRef.current,
        )
        if (disposed) {
          await ornament.destroy()
          return
        }

        await applyPendingOptions()
        if (disposed) {
          await ornament.destroy()
          return
        }

        const result = await session.getSpatialScene().addOrnament(ornament.id)
        if (!result.success || disposed) {
          await ornament.destroy()
          return
        }

        ornamentRef.current = ornament
        await applyPendingOptions()
        if (disposed) {
          await ornament.destroy()
          return
        }

        setWindowProxy(childWindow)
      } catch (error) {
        if (ornament) {
          await ornament.destroy()
        }
        if (!disposed) {
          console.error('[WebSpatial] create Ornament failed:', error)
        }
      }
    }

    void init()

    return () => {
      disposed = true
      setWindowProxy(null)
      appliedStyleNamesRef.current.clear()
      const ornament = ornamentRef.current
      ornamentRef.current = null
      if (ornament) {
        void ornament.destroy()
      }
    }
  }, [insideAttachment, insideOrnament, supported])

  useSyncHeadStyles(windowProxy)

  if (insideAttachment || insideOrnament || !supported || !windowProxy) {
    return null
  }

  return (
    <InsideOrnamentContext.Provider value={true}>
      {createPortal(children, windowProxy.document.body)}
    </InsideOrnamentContext.Provider>
  )
}

export type {
  BackgroundMaterialType,
  CornerRadius,
  OrnamentPoint3D,
  OrnamentVisibility,
}
