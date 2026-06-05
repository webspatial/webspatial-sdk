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

/**
 * styled-components (and similar runtimes) often update CSS via CSSStyleSheet
 * insertRule/deleteRule without mutating the <style> node's text children.
 * cloneNode(true) would miss those live rules — serialize sheet.cssRules instead.
 */
export function getStyleElementTextForSync(styleEl: HTMLStyleElement): string {
  const sheet = styleEl.sheet
  if (sheet) {
    try {
      const parts: string[] = []
      for (let i = 0; i < sheet.cssRules.length; i++) {
        parts.push(sheet.cssRules[i]!.cssText)
      }
      if (parts.length > 0) return parts.join('\n')
    } catch {
      // Inaccessible stylesheet (e.g. cross-origin) — fall back to DOM text.
    }
  }
  return styleEl.textContent ?? ''
}

function copyParentStyleAttributes(
  source: HTMLStyleElement,
  target: HTMLStyleElement,
) {
  const sourceAttrNames = new Set(
    Array.from(source.attributes, attr => attr.name),
  )
  for (const attr of Array.from(target.attributes)) {
    if (attr.name === WEBSPATIAL_SYNC_ATTR) continue
    if (!sourceAttrNames.has(attr.name)) target.removeAttribute(attr.name)
  }

  for (const attr of Array.from(source.attributes)) {
    if (attr.name === WEBSPATIAL_SYNC_ATTR) continue
    target.setAttribute(attr.name, attr.value)
  }
}

export function cloneParentStyleElementForSync(
  styleEl: HTMLStyleElement,
): HTMLStyleElement {
  const node = document.createElement('style')
  copyParentStyleAttributes(styleEl, node)
  node.setAttribute(WEBSPATIAL_SYNC_ATTR, '1')
  return node
}

function getStyleSheetRuleTexts(styleEl: HTMLStyleElement): string[] | null {
  const sheet = styleEl.sheet
  if (!sheet) return null
  try {
    const texts: string[] = []
    for (let i = 0; i < sheet.cssRules.length; i++) {
      texts.push(sheet.cssRules[i]!.cssText)
    }
    return texts
  } catch {
    return null
  }
}

function clearStyleSheetRules(sheet: CSSStyleSheet) {
  while (sheet.cssRules.length > 0) {
    sheet.deleteRule(sheet.cssRules.length - 1)
  }
}

function applyFullTextStyleSync(
  target: HTMLStyleElement,
  source: HTMLStyleElement,
) {
  const text = getStyleElementTextForSync(source)
  const sheet = target.sheet
  if (sheet) {
    try {
      clearStyleSheetRules(sheet)
    } catch {
      // Fall through to textContent assignment.
    }
  }
  target.textContent = text
}

/**
 * Mirror parent CSSOM into an existing portal <style> via insertRule/deleteRule
 * so append-only CSS-in-JS updates do not replace the whole stylesheet text.
 */
export function syncStyleSheetRulesToChild(
  target: HTMLStyleElement,
  source: HTMLStyleElement,
) {
  const parentRules = getStyleSheetRuleTexts(source)
  if (parentRules === null) {
    applyFullTextStyleSync(target, source)
    return
  }

  if (parentRules.length === 0) {
    const sheet = target.sheet
    if (sheet) {
      try {
        clearStyleSheetRules(sheet)
      } catch {
        applyFullTextStyleSync(target, source)
        return
      }
    }
    const text = source.textContent ?? ''
    if (target.textContent !== text) target.textContent = text
    return
  }

  const sheet = target.sheet
  if (!sheet) {
    applyFullTextStyleSync(target, source)
    return
  }

  try {
    let commonPrefix = 0
    const maxPrefix = Math.min(sheet.cssRules.length, parentRules.length)
    while (commonPrefix < maxPrefix) {
      if (sheet.cssRules[commonPrefix]!.cssText !== parentRules[commonPrefix]) {
        break
      }
      commonPrefix++
    }

    while (sheet.cssRules.length > commonPrefix) {
      sheet.deleteRule(sheet.cssRules.length - 1)
    }

    for (let i = commonPrefix; i < parentRules.length; i++) {
      sheet.insertRule(parentRules[i]!, i)
    }
  } catch {
    applyFullTextStyleSync(target, source)
  }
}

/** Update portal <style> nodes in place; prefer CSSOM rule deltas over full text replace. */
function syncInlineStylesToChild(
  childHead: HTMLHeadElement,
  parentStyles: HTMLStyleElement[],
) {
  const existing = Array.from(
    childHead.querySelectorAll(`style[${WEBSPATIAL_SYNC_ATTR}="1"]`),
  ) as HTMLStyleElement[]

  for (let i = 0; i < parentStyles.length; i++) {
    const source = parentStyles[i]!
    const target = existing[i]
    if (target) {
      copyParentStyleAttributes(source, target)
      syncStyleSheetRulesToChild(target, source)
    } else {
      const node = cloneParentStyleElementForSync(source)
      childHead.appendChild(node)
      syncStyleSheetRulesToChild(node, source)
    }
  }

  for (let i = parentStyles.length; i < existing.length; i++) {
    existing[i]!.parentNode?.removeChild(existing[i]!)
  }
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

  syncInlineStylesToChild(head, parentStyles)

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

type SyncScheduleTiming = 'immediate' | 'delayed' | 'afterHostLayout'

type HeadSyncScheduler = {
  delayTimer?: number
  immediateQueued: boolean
  afterHostLayoutRaf?: number
  afterHostLayoutComplete?: () => void
  disposed: boolean
}

const headSyncSchedulers = new WeakMap<WindowProxy, HeadSyncScheduler>()

function getHeadSyncScheduler(childWindow: WindowProxy): HeadSyncScheduler {
  const prev = headSyncSchedulers.get(childWindow)
  if (prev) return prev
  const next: HeadSyncScheduler = {
    immediateQueued: false,
    disposed: false,
  }
  headSyncSchedulers.set(childWindow, next)
  return next
}

/**
 * Coalesced head sync for a portal window. `afterHostLayout` runs after the next
 * animation frame so CSS-in-JS (e.g. styled-components) can commit head rules
 * that follow a spatial host class/style update.
 */
export function scheduleSyncParentHeadToChild(
  childWindow: WindowProxy,
  timing: SyncScheduleTiming = 'immediate',
  onComplete?: () => void,
) {
  const scheduler = getHeadSyncScheduler(childWindow)
  if (scheduler.disposed) return

  const run = () => {
    if (scheduler.disposed) return
    void syncParentHeadToChild(childWindow).then(() => {
      if (timing === 'afterHostLayout') {
        const complete = scheduler.afterHostLayoutComplete
        scheduler.afterHostLayoutComplete = undefined
        complete?.()
      }
    })
  }

  if (timing === 'delayed') {
    if (scheduler.delayTimer) window.clearTimeout(scheduler.delayTimer)
    scheduler.delayTimer = window.setTimeout(run, 100)
    return
  }

  if (scheduler.delayTimer) {
    window.clearTimeout(scheduler.delayTimer)
    scheduler.delayTimer = undefined
  }

  if (timing === 'afterHostLayout') {
    if (onComplete) {
      scheduler.afterHostLayoutComplete = onComplete
    }
    if (scheduler.afterHostLayoutRaf != null) {
      return
    }
    queueMicrotask(() => {
      if (scheduler.disposed || scheduler.afterHostLayoutRaf != null) return
      scheduler.afterHostLayoutRaf = window.requestAnimationFrame(() => {
        scheduler.afterHostLayoutRaf = undefined
        run()
      })
    })
    return
  }

  if (scheduler.immediateQueued) return
  scheduler.immediateQueued = true
  queueMicrotask(() => {
    scheduler.immediateQueued = false
    run()
  })
}

export function disposeSyncParentHeadToChild(childWindow: WindowProxy) {
  const scheduler = headSyncSchedulers.get(childWindow)
  if (!scheduler) return
  scheduler.disposed = true
  if (scheduler.delayTimer) window.clearTimeout(scheduler.delayTimer)
  if (scheduler.afterHostLayoutRaf) {
    window.cancelAnimationFrame(scheduler.afterHostLayoutRaf)
  }
  headSyncSchedulers.delete(childWindow)
}
