import { getSession, parseCornerRadius } from '@xrsdk/react'

const isWebSpatialEnv = getSession() !== null

const SpatialGlobalCustomVars = {
  backgroundMaterial: '--xr-background-material',
}

// keep track of current html background material
let htmlBackgroundMaterial = ''
function setCurrentWindowStyle(backgroundMaterial: string) {
  if (backgroundMaterial !== htmlBackgroundMaterial) {
    const session = getSession()!
    session.getCurrentWindowComponent().setStyle({
      material: { type: backgroundMaterial as any },
    })
    htmlBackgroundMaterial = backgroundMaterial
  }
}

function checkHtmlBackgroundMaterial() {
  const computedStyle = getComputedStyle(document.documentElement)

  const backgroundMaterial = computedStyle.getPropertyValue(
    SpatialGlobalCustomVars.backgroundMaterial,
  )

  setCurrentWindowStyle(backgroundMaterial || 'none')
}

// keep track of current corner radius
let htmlCornerRadius = {
  topLeading: 0,
  bottomLeading: 0,
  topTrailing: 0,
  bottomTrailing: 0,
}
function checkCornerRadius() {
  const computedStyle = getComputedStyle(document.documentElement)
  const cornerRadius = parseCornerRadius(computedStyle)
  setCornerRadius(cornerRadius)
}

function setCornerRadius(cornerRadius: any) {
  if (
    htmlCornerRadius.topLeading !== cornerRadius.topLeading ||
    htmlCornerRadius.bottomLeading !== cornerRadius.bottomLeading ||
    htmlCornerRadius.topTrailing !== cornerRadius.topTrailing ||
    htmlCornerRadius.bottomTrailing !== cornerRadius.bottomTrailing
  ) {
    const session = getSession()!
    session.getCurrentWindowComponent().setStyle({
      cornerRadius,
    })
    htmlCornerRadius.topLeading = cornerRadius.topLeading
    htmlCornerRadius.bottomLeading = cornerRadius.bottomLeading
    htmlCornerRadius.topTrailing = cornerRadius.topTrailing
    htmlCornerRadius.bottomTrailing = cornerRadius.bottomTrailing
  }
}

function setOpacity(opacity: number) {
  const session = getSession()!
  session.getCurrentWindowComponent().setOpacity(opacity)
}

function checkOpacity() {
  const computedStyle = getComputedStyle(document.documentElement)
  const opacity = parseFloat(computedStyle.getPropertyValue('opacity'))
  setOpacity(opacity)
}

async function setHtmlVisible(visible: boolean) {
  const session = getSession()!
  const wc = session.getCurrentWindowComponent()
  const ent = await wc.getEntity()
  ent?.setVisible(visible)
}

function checkHtmlVisible() {
  const computedStyle = getComputedStyle(document.documentElement)
  const visibility = computedStyle.getPropertyValue('visibility') !== 'hidden'
  const widthGtZero = parseFloat(computedStyle.getPropertyValue('width')) > 0
  setHtmlVisible(visibility && widthGtZero)
}

function hijackDocumentElementStyle() {
  const rawDocumentStyle = document.documentElement.style
  const styleProxy = new Proxy(rawDocumentStyle, {
    set: function (target, key, value) {
      const ret = Reflect.set(target, key, value)

      if (key === SpatialGlobalCustomVars.backgroundMaterial) {
        setCurrentWindowStyle(value)
      }

      if (
        key === 'border-radius' ||
        key === 'borderRadius' ||
        key === 'border-top-left-radius' ||
        key === 'borderTopLeftRadius' ||
        key === 'border-top-right-radius' ||
        key === 'borderTopRightRadius' ||
        key === 'border-bottom-left-radius' ||
        key === 'borderBottomLeftRadius' ||
        key === 'border-bottom-right-radius' ||
        key === 'borderBottomRightRadius'
      ) {
        checkCornerRadius()
      }

      if (key === 'opacity') {
        checkOpacity()
      }

      if (key === 'visibility' || key === 'display') {
        checkHtmlVisible()
      }

      return ret
    },
    get: function (target, key) {
      return Reflect.get(target, key)
    },
  })
  Object.defineProperty(document.documentElement, 'style', {
    get: function () {
      return styleProxy
    },
  })
}

function monitorExternalStyleChange() {
  const headObserver = new MutationObserver(function (mutationsList) {
    for (const mutation of mutationsList) {
      if (mutation.type === 'childList') {
        let needCheck = false
        mutation.addedNodes.forEach(node => {
          if (
            node.nodeName === 'LINK' &&
            (node as HTMLLinkElement).rel === 'stylesheet'
          ) {
            needCheck = true
          }
        })

        mutation.removedNodes.forEach(node => {
          if (
            node.nodeName === 'LINK' &&
            (node as HTMLLinkElement).rel === 'stylesheet'
          ) {
            needCheck = true
          }
        })

        if (needCheck) {
          checkCSSProperties()
        }
      }
    }
  })

  headObserver.observe(document.head, { childList: true, subtree: true })
}

function checkCSSProperties() {
  checkHtmlBackgroundMaterial()
  checkCornerRadius()
  checkOpacity()
  checkHtmlVisible()
}

export function spatialPolyfill() {
  if (!isWebSpatialEnv) {
    return
  }
  checkCSSProperties()

  hijackDocumentElementStyle()
  monitorExternalStyleChange()
}
