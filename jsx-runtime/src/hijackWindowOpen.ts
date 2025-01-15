export function hijackWindowOpen() {
  const sendMsg = (msg: any) => {
    ;(window as any).webkit.messageHandlers.bridge.postMessage(
      JSON.stringify(msg),
    )
  }

  const originalOpen = window.open

  window.open = function (url: string | URL | undefined, target, ...rest) {
    if (url instanceof URL) url = url.href

    if (url === undefined) url = ''

    if (!isProtocolHttp(url)) {
      // if is not http, we do nothing
      return originalOpen.apply(this, arguments as any)
    }

    // we handle http by some strategy

    // 1. navigate inside webview
    const isTargetEscape =
      target === '_self' || target === '_parent' || target === '_top'

    if (isTargetEscape) {
      return originalOpen.apply(this, arguments as any)
    }

    // 2. create or focus to scene
    const isNewDefault = target === undefined || target === '_blank'

    const newWindow = originalOpen.apply(this, arguments as any)

    let cnt = 2
    let timer = setInterval(() => {
      cnt -= 1
      if (cnt < 0) {
        clearInterval(timer)
        return
      }

      // we pass windowID to native, it will create windowGroup if it first see the windowID
      // we got windowID
      //@ts-ignore
      if (newWindow._webSpatialID) {
        clearInterval(timer)
        sendMsg({
          command: 'scene',
          data: {
            sceneData: {
              method: 'open',
              sceneName: isNewDefault ? '' : target,
              url,
              //@ts-ignore
              windowID: newWindow._webSpatialID,
            },
          },
          requestID: -2,
        })
      }
    }, 0) // _webSpatialID is async

    return newWindow
  }
}

function isProtocolHttp(url: string) {
  const hasProtocol = /^[a-zA-Z]+:/.test(url) // maybe webspatial://
  if (!hasProtocol) {
    // relative path
    return true
  }
  if (
    url.startsWith('about:blank') ||
    url.startsWith('http:') ||
    url.startsWith('https:') ||
    url.startsWith('//')
  ) {
    // absolute path of http
    return true
  }
  // custom url schema
  return false
}
