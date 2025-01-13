;(function () {
  const sendMsg = msg => {
    //@ts-ignore
    window.webkit.messageHandlers.bridge.postMessage(JSON.stringify(msg))
  }

  const originalOpen = window.open
  window.open = function (url, target, ...rest) {
    const isUrlEscape =
      !url || (typeof url === 'string' && url.startsWith('about:blank'))

    const isNewDefault = target === undefined || target === '_blank'

    const isTargetEscape =
      target === '_self' || target === '_parent' || target === '_top'

    if (isUrlEscape || isTargetEscape) {
      return originalOpen.apply(this, arguments)
    }

    const newWindow = originalOpen.apply(this, arguments)

    let cnt = 2
    let timer = setInterval(() => {
      cnt -= 1
      if (cnt < 0) {
        clearInterval(timer)
        return
      }

      // we pass windowID to native, it will create windowGroup if it first see the windowID
      // we got windowID
      if (newWindow._webSpatialID) {
        clearInterval(timer)
        sendMsg({
          command: 'scene',
          data: {
            sceneData: {
              method: 'open',
              sceneName: isNewDefault ? '' : target,
              url,
              windowID: newWindow._webSpatialID,
            },
          },
          requestID: -2,
        })
      }
    }, 0) // _webSpatialID is async

    return newWindow
  }

  // a tag click hijack
  document.addEventListener('click', event => {
    const link = event.target.closest('a')
    if (!link) return

    const { href, target, rel, download } = link

    if (
      !href ||
      href.startsWith('javascript:') ||
      target === '_self' ||
      download
    ) {
      return
    }

    event.preventDefault()

    const newTarget = target || '_self'

    let features = ''
    if (rel && rel.includes('noopener')) {
      features += 'noopener=yes,'
    }
    if (rel && rel.includes('noreferrer')) {
      features += 'noreferrer=yes,'
    }
    // forward to window.open
    window.open(href, newTarget, features)
  })
})()
