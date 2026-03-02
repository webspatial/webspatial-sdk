export function asyncLoadStyleToChildWindow(
  childWindow: WindowProxy,
  n: HTMLLinkElement,
): Promise<boolean> {
  return new Promise(resolve => {
    n.href += '?uniqueURL=' + Math.random()
    n.onerror = () => resolve(false)
    n.onload = () => resolve(true)
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
  childWindow.document.documentElement.className =
    document.documentElement.className
  return Promise.all(styleLoadedPromises)
}
