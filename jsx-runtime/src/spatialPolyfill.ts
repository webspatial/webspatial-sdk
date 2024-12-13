import { getSession } from '@xrsdk/react'

const isWebSpatialEnv = getSession() !== null

const SpatialGlobalCustomVars = {
  backgroundMaterial: '--xr-background-material',
}

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

function hijackDocumentElementStyle() {
  const rawDocumentStyle = document.documentElement.style
  const styleProxy = new Proxy(rawDocumentStyle, {
    set: function (target, key, value) {
      if (key === SpatialGlobalCustomVars.backgroundMaterial) {
        setCurrentWindowStyle(value)
      }
      return Reflect.set(target, key, value)
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
          checkHtmlBackgroundMaterial()
        }
      }
    }
  })

  headObserver.observe(document.head, { childList: true, subtree: true })
}

export function spatialPolyfill() {
  if (!isWebSpatialEnv) {
    return
  }
  checkHtmlBackgroundMaterial()

  hijackDocumentElementStyle()
  monitorExternalStyleChange()
}
