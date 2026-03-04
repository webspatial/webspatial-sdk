export function asyncLoadStyleToChildWindow(
  childWindow: WindowProxy,
  n: HTMLLinkElement,
): Promise<boolean> {
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
    n.onload = () => resolve(true)

    // need to wait for some time to make sure the style is loaded
    // otherwise, the style may not be applied
    setTimeout(() => {
      childWindow.document.head.appendChild(n)
    }, 50)
  })
}

export function setOpenWindowStyle(openedWindow: WindowProxy) {
  openedWindow.document.documentElement.style.cssText +=
    document.documentElement.style.cssText
  openedWindow.document.documentElement.style.backgroundColor = 'transparent'
  openedWindow.document.body.style.margin = '0px'

  // openedWindow body's width and height should be set to inline-block to make sure the width and height are correct
  openedWindow.document.body.style.display = 'inline-block'
  openedWindow.document.body.style.minWidth = 'auto'
  openedWindow.document.body.style.minHeight = 'auto'
  openedWindow.document.body.style.maxWidth = 'fit-content'
  openedWindow.document.body.style.minWidth = 'fit-content'
  openedWindow.document.body.style.background = 'transparent'
}

export async function syncParentHeadToChild(childWindow: WindowProxy) {
  const styleLoadedPromises: Array<Promise<any>> = []
  for (let i = 0; i < document.head.children.length; i++) {
    const n = document.head.children[i].cloneNode(true) as any
    if (
      n.nodeName === 'LINK' &&
      (n as HTMLLinkElement).rel === 'stylesheet' &&
      (n as HTMLLinkElement).href
    ) {
      styleLoadedPromises.push(
        asyncLoadStyleToChildWindow(childWindow, n as HTMLLinkElement),
      )
    } else {
      childWindow.document.head.appendChild(n)
    }
  }

  // sync className
  childWindow.document.documentElement.className =
    document.documentElement.className

  return Promise.all(styleLoadedPromises)
}
