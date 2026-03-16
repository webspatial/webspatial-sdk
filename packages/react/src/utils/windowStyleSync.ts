export function asyncLoadStyleToChildWindow(
  childWindow: WindowProxy,
  link: HTMLLinkElement,
  isCurrent: () => boolean,
): Promise<boolean> {
  return new Promise(resolve => {
    const { href } = link
    const sep = href.includes('?') ? '&' : '?'
    link.href = `${href}${sep}uniqueURL=${Math.random()}`

    let finished = false
    const finish = (ok: boolean) => {
      if (finished) return
      finished = true
      resolve(ok)
    }

    // need to wait for some time to make sure the style is loaded
    // otherwise, the style may not be applied
    link.onerror = () => {
      finish(false)
    }
    link.onload = () => {
      if (!isCurrent()) {
        link.parentNode?.removeChild(link)
        finish(false)
        return
      }
      finish(true)
    }

    setTimeout(() => {
      if (!isCurrent()) {
        finish(false)
        return
      }
      childWindow.document.head.appendChild(link)
    }, 50)
  })
}

const WEBSPATIAL_SYNC_ATTR = 'data-webspatial-sync'
const WEBSPATIAL_SYNC_KEY_ATTR = 'data-webspatial-sync-key'

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

interface SyncController {
  version: number
}

const controllers = new WeakMap<WindowProxy, SyncController>()

function getController(childWindow: WindowProxy): SyncController {
  const prev = controllers.get(childWindow)
  if (prev) return prev
  const next: SyncController = { version: 0 }
  controllers.set(childWindow, next)
  return next
}

export async function syncParentHeadToChild(childWindow: WindowProxy) {
  const controller = getController(childWindow)
  const version = ++controller.version
  const styleLoadedPromises: Promise<boolean>[] = []
  const { head } = childWindow.document

  const isCurrent = () => controller.version === version

  const parentStyles = Array.from(document.head.querySelectorAll('style'))
  const parentStylesheets = Array.from(
    document.head.querySelectorAll('link[rel="stylesheet"][href]'),
  ) as HTMLLinkElement[]

  const desiredStylesheetKeys = new Set<string>()
  for (const link of parentStylesheets) {
    if (link.href) desiredStylesheetKeys.add(link.href)
  }

  const existingSyncedLinks = Array.from(
    head.querySelectorAll(
      `link[rel="stylesheet"][${WEBSPATIAL_SYNC_ATTR}="1"]`,
    ),
  ) as HTMLLinkElement[]
  for (const link of existingSyncedLinks) {
    const key = link.getAttribute(WEBSPATIAL_SYNC_KEY_ATTR) ?? link.href
    if (!desiredStylesheetKeys.has(key)) link.parentNode?.removeChild(link)
  }

  const prevSyncedStyles = head.querySelectorAll(
    `style[${WEBSPATIAL_SYNC_ATTR}="1"]`,
  )
  prevSyncedStyles.forEach(n => n.parentNode?.removeChild(n))

  for (const styleEl of parentStyles) {
    const node = styleEl.cloneNode(true) as HTMLStyleElement
    node.setAttribute(WEBSPATIAL_SYNC_ATTR, '1')
    head.appendChild(node)
  }

  const currentKeys = new Set<string>()
  const currentSyncedLinks = Array.from(
    head.querySelectorAll(
      `link[rel="stylesheet"][${WEBSPATIAL_SYNC_ATTR}="1"]`,
    ),
  ) as HTMLLinkElement[]
  for (const link of currentSyncedLinks) {
    currentKeys.add(link.getAttribute(WEBSPATIAL_SYNC_KEY_ATTR) ?? link.href)
  }

  for (const link of parentStylesheets) {
    const key = link.href
    if (!key || currentKeys.has(key)) continue
    const node = link.cloneNode(true) as HTMLLinkElement
    node.setAttribute(WEBSPATIAL_SYNC_ATTR, '1')
    node.setAttribute(WEBSPATIAL_SYNC_KEY_ATTR, key)
    styleLoadedPromises.push(
      asyncLoadStyleToChildWindow(childWindow, node, isCurrent),
    )
  }

  // sync className
  childWindow.document.documentElement.className =
    document.documentElement.className

  return Promise.all(styleLoadedPromises)
}
