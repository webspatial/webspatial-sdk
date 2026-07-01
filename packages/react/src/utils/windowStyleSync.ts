import { SpatialStyleInfoUpdateEvent } from '../notifyUpdateStandInstanceLayout'

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
    let timeoutId: number | undefined
    const finish = (ok: boolean) => {
      if (finished) return
      finished = true
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId)
      }
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

    // Bound stylesheet loads so a missing load/error event cannot block portal mount.
    timeoutId = window.setTimeout(() => {
      finish(false)
    }, 2000)
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

function getStyleTextForRules(
  source: HTMLStyleElement,
  parentRules?: string[] | null,
) {
  if (parentRules && parentRules.length > 0) return parentRules.join('\n')
  return source.textContent ?? ''
}

function applyFullTextStyleSync(
  target: HTMLStyleElement,
  source: HTMLStyleElement,
  text = getStyleElementTextForSync(source),
) {
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
  precomputedParentRules?: string[] | null,
  precomputedText?: string,
) {
  const parentRules =
    precomputedParentRules === undefined
      ? getStyleSheetRuleTexts(source)
      : precomputedParentRules
  const parentText =
    precomputedText ?? getStyleTextForRules(source, parentRules)
  if (parentRules === null) {
    applyFullTextStyleSync(target, source, parentText)
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
    if (target.textContent !== parentText) target.textContent = parentText
    return
  }

  const sheet = target.sheet
  if (!sheet) {
    applyFullTextStyleSync(target, source, parentText)
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
    applyFullTextStyleSync(target, source, parentText)
  }
}

export type ParentHeadSnapshot = {
  parentStyles: HTMLStyleElement[]
  parentStylesheets: HTMLLinkElement[]
  documentElementClassName: string
  styleRuleTexts: Array<string[] | null>
  styleTextContents: string[]
}

export function captureParentHeadSnapshot(): ParentHeadSnapshot {
  const parentStyles = Array.from(
    document.head.querySelectorAll('style'),
  ) as HTMLStyleElement[]
  const styleRuleTexts = parentStyles.map(getStyleSheetRuleTexts)
  const styleTextContents = parentStyles.map((style, index) =>
    getStyleTextForRules(style, styleRuleTexts[index]),
  )
  const parentStylesheets = Array.from(
    document.head.querySelectorAll('link[rel="stylesheet"][href]'),
  ) as HTMLLinkElement[]

  return {
    parentStyles,
    parentStylesheets,
    documentElementClassName: document.documentElement.className,
    styleRuleTexts,
    styleTextContents,
  }
}

/** Update portal <style> nodes in place; prefer CSSOM rule deltas over full text replace. */
function syncInlineStylesToChild(
  childHead: HTMLHeadElement,
  snapshot: ParentHeadSnapshot,
) {
  const { parentStyles, styleRuleTexts, styleTextContents } = snapshot
  const existing = Array.from(
    childHead.querySelectorAll(`style[${WEBSPATIAL_SYNC_ATTR}="1"]`),
  ) as HTMLStyleElement[]

  for (let i = 0; i < parentStyles.length; i++) {
    const source = parentStyles[i]!
    const target = existing[i]
    if (target) {
      copyParentStyleAttributes(source, target)
      syncStyleSheetRulesToChild(
        target,
        source,
        styleRuleTexts[i],
        styleTextContents[i],
      )
    } else {
      const node = cloneParentStyleElementForSync(source)
      childHead.appendChild(node)
      syncStyleSheetRulesToChild(
        node,
        source,
        styleRuleTexts[i],
        styleTextContents[i],
      )
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

export async function syncParentHeadToChild(
  childWindow: WindowProxy,
  snapshot = captureParentHeadSnapshot(),
) {
  const controller = getController(childWindow)
  const version = ++controller.version
  const styleLoadedPromises: Promise<boolean>[] = []
  const { head } = childWindow.document

  const isCurrent = () => controller.version === version
  const { parentStylesheets } = snapshot

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

  syncInlineStylesToChild(head, snapshot)

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
    snapshot.documentElementClassName

  return Promise.all(styleLoadedPromises)
}

type SyncScheduleTiming = 'immediate' | 'delayed' | 'afterHostLayout'

type HeadSyncScheduler = {
  disposed: boolean
}

const headSyncSchedulers = new WeakMap<WindowProxy, HeadSyncScheduler>()

function getHeadSyncScheduler(childWindow: WindowProxy): HeadSyncScheduler {
  const prev = headSyncSchedulers.get(childWindow)
  if (prev) return prev
  const next: HeadSyncScheduler = {
    disposed: false,
  }
  headSyncSchedulers.set(childWindow, next)
  return next
}

type SyncTimingFromMutation = 'immediate' | 'delayed'

type PendingWave = {
  timing: SyncScheduleTiming
  broadcast: boolean
  targets: Set<WindowProxy>
  onComplete: Map<WindowProxy, () => void>
}

const activeTargets = new Set<WindowProxy>()

let headObserver: MutationObserver | null = null
let domUpdatedHandler: (() => void) | null = null
let originalInsertRule: CSSStyleSheet['insertRule'] | undefined
let originalDeleteRule: CSSStyleSheet['deleteRule'] | undefined
let pendingWave: PendingWave | null = null
let flushQueued: SyncScheduleTiming | null = null
let delayTimer: number | undefined
let afterHostLayoutRaf: number | undefined

const timingPriority: Record<SyncScheduleTiming, number> = {
  delayed: 1,
  afterHostLayout: 2,
  immediate: 3,
}

function isParentHeadStyleSheet(sheet: CSSStyleSheet) {
  const ownerNode = (sheet as CSSStyleSheet & { ownerNode?: Node }).ownerNode
  if (
    ownerNode instanceof HTMLStyleElement &&
    ownerNode.ownerDocument === document &&
    document.head.contains(ownerNode)
  ) {
    return true
  }

  return Array.from(document.head.querySelectorAll('style')).some(
    style => style.sheet === sheet,
  )
}

function getSyncTiming(
  mutations?: MutationRecord[] | null,
): SyncTimingFromMutation | null {
  if (!Array.isArray(mutations) || mutations.length === 0) return null
  let hasDelayed = false
  for (const mutation of mutations) {
    if (mutation.type === 'characterData') {
      const parent = mutation.target.parentElement
      if (parent?.tagName === 'STYLE') return 'immediate'
    }

    const nodes: Node[] = [
      mutation.target,
      ...Array.from(mutation.addedNodes),
      ...Array.from(mutation.removedNodes),
    ]
    for (const node of nodes) {
      if (!(node instanceof Element)) continue
      const tag = node.tagName
      if (tag === 'STYLE') return 'immediate'
      if (tag === 'LINK') {
        const { rel } = node as HTMLLinkElement
        if (rel && rel.toLowerCase() === 'stylesheet') hasDelayed = true
      }
    }
  }
  return hasDelayed ? 'delayed' : null
}

function installCssomRuleObserver() {
  if (typeof CSSStyleSheet === 'undefined' || originalInsertRule) return

  originalInsertRule = CSSStyleSheet.prototype.insertRule
  originalDeleteRule = CSSStyleSheet.prototype.deleteRule

  CSSStyleSheet.prototype.insertRule = function patchedInsertRule(
    rule: string,
    index?: number,
  ) {
    const result = originalInsertRule!.call(this, rule, index)
    if (isParentHeadStyleSheet(this)) {
      enqueueParentHeadSync('immediate', { broadcast: true })
    }
    return result
  }

  CSSStyleSheet.prototype.deleteRule = function patchedDeleteRule(
    index: number,
  ) {
    originalDeleteRule!.call(this, index)
    if (isParentHeadStyleSheet(this)) {
      enqueueParentHeadSync('immediate', { broadcast: true })
    }
  }
}

function uninstallCssomRuleObserver() {
  if (originalInsertRule) {
    CSSStyleSheet.prototype.insertRule = originalInsertRule
  }
  if (originalDeleteRule) {
    CSSStyleSheet.prototype.deleteRule = originalDeleteRule
  }
  originalInsertRule = undefined
  originalDeleteRule = undefined
}

function installParentHeadSyncRegistry() {
  if (!headObserver) {
    headObserver = new MutationObserver(mutations => {
      const timing = getSyncTiming(mutations)
      if (!timing) return
      enqueueParentHeadSync(timing, { broadcast: true })
    })
    headObserver.observe(document.head, {
      childList: true,
      characterData: true,
      subtree: true,
    })
  }

  if (!domUpdatedHandler) {
    domUpdatedHandler = () =>
      enqueueParentHeadSync('afterHostLayout', { broadcast: true })
    document.addEventListener(
      SpatialStyleInfoUpdateEvent.domUpdated,
      domUpdatedHandler,
    )
  }

  installCssomRuleObserver()
}

function clearQueuedFlush() {
  if (delayTimer) {
    window.clearTimeout(delayTimer)
    delayTimer = undefined
  }
  if (afterHostLayoutRaf) {
    window.cancelAnimationFrame(afterHostLayoutRaf)
    afterHostLayoutRaf = undefined
  }
  flushQueued = null
}

function teardownParentHeadSyncRegistry() {
  headObserver?.disconnect()
  headObserver = null

  if (domUpdatedHandler) {
    document.removeEventListener(
      SpatialStyleInfoUpdateEvent.domUpdated,
      domUpdatedHandler,
    )
    domUpdatedHandler = null
  }

  uninstallCssomRuleObserver()
  clearQueuedFlush()
  pendingWave = null
}

function teardownParentHeadSyncRegistryIfEmpty() {
  if (activeTargets.size > 0) return
  teardownParentHeadSyncRegistry()
}

function isWindowDisposed(childWindow: WindowProxy) {
  return headSyncSchedulers.get(childWindow)?.disposed === true
}

function getOrCreatePendingWave(timing: SyncScheduleTiming) {
  if (!pendingWave) {
    pendingWave = {
      timing,
      broadcast: false,
      targets: new Set(),
      onComplete: new Map(),
    }
    return pendingWave
  }

  if (timingPriority[timing] > timingPriority[pendingWave.timing]) {
    pendingWave.timing = timing
  }
  return pendingWave
}

async function flushHeadSyncWave() {
  const wave = pendingWave
  pendingWave = null
  flushQueued = null
  delayTimer = undefined
  afterHostLayoutRaf = undefined
  if (!wave) return

  const targets = (
    wave.broadcast ? Array.from(activeTargets) : Array.from(wave.targets)
  ).filter(childWindow => !isWindowDisposed(childWindow))

  if (targets.length === 0) return

  const snapshot = captureParentHeadSnapshot()
  await Promise.all(
    targets.map(async childWindow => {
      await syncParentHeadToChild(childWindow, snapshot)
      wave.onComplete.get(childWindow)?.()
    }),
  )
}

function queuePendingWaveFlush(timing: SyncScheduleTiming) {
  if (timing === 'delayed') {
    if (flushQueued) return
    flushQueued = 'delayed'
    delayTimer = window.setTimeout(() => {
      void flushHeadSyncWave()
    }, 100)
    return
  }

  if (delayTimer) {
    window.clearTimeout(delayTimer)
    delayTimer = undefined
  }

  if (timing === 'immediate') {
    if (afterHostLayoutRaf) {
      window.cancelAnimationFrame(afterHostLayoutRaf)
      afterHostLayoutRaf = undefined
    }
    if (flushQueued === 'immediate') return
    flushQueued = 'immediate'
    queueMicrotask(() => {
      if (flushQueued !== 'immediate') return
      void flushHeadSyncWave()
    })
    return
  }

  if (flushQueued === 'immediate' || flushQueued === 'afterHostLayout') return

  flushQueued = 'afterHostLayout'
  queueMicrotask(() => {
    if (flushQueued !== 'afterHostLayout') return
    afterHostLayoutRaf = window.requestAnimationFrame(() => {
      if (flushQueued !== 'afterHostLayout') return
      void flushHeadSyncWave()
    })
  })
}

function enqueueParentHeadSync(
  timing: SyncScheduleTiming,
  options:
    | { broadcast: true; onComplete?: never }
    | {
        broadcast?: false
        childWindow: WindowProxy
        onComplete?: () => void
      },
) {
  const wave = getOrCreatePendingWave(timing)
  if (options.broadcast) {
    wave.broadcast = true
  } else {
    const scheduler = getHeadSyncScheduler(options.childWindow)
    if (scheduler.disposed) return
    wave.targets.add(options.childWindow)
    if (options.onComplete) {
      wave.onComplete.set(options.childWindow, options.onComplete)
    }
  }
  queuePendingWaveFlush(wave.timing)
}

function addParentHeadSyncTarget(childWindow: WindowProxy) {
  const scheduler = getHeadSyncScheduler(childWindow)
  scheduler.disposed = false
  activeTargets.add(childWindow)
  installParentHeadSyncRegistry()

  let unregistered = false
  return () => {
    if (unregistered) return
    unregistered = true
    activeTargets.delete(childWindow)
    teardownParentHeadSyncRegistryIfEmpty()
  }
}

export function registerParentHeadSyncTarget(childWindow: WindowProxy) {
  const unregister = addParentHeadSyncTarget(childWindow)
  scheduleSyncParentHeadToChild(childWindow)
  return unregister
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
  enqueueParentHeadSync(timing, {
    broadcast: false,
    childWindow,
    onComplete: timing === 'afterHostLayout' ? onComplete : undefined,
  })
}

export function disposeSyncParentHeadToChild(childWindow: WindowProxy) {
  const scheduler = headSyncSchedulers.get(childWindow)
  if (scheduler) scheduler.disposed = true
  activeTargets.delete(childWindow)
  teardownParentHeadSyncRegistryIfEmpty()
  headSyncSchedulers.delete(childWindow)
}

export const __parentHeadSyncRegistryTest__ = {
  getActiveTargetCount: () => activeTargets.size,
  getObserverInstalled: () => headObserver != null,
  flushPendingWaveForTest: flushHeadSyncWave,
  registerTarget(childWindow: WindowProxy, options?: { immediate?: boolean }) {
    const unregister = addParentHeadSyncTarget(childWindow)
    if (options?.immediate ?? true) {
      scheduleSyncParentHeadToChild(childWindow)
    }
    return unregister
  },
  reset: () => {
    activeTargets.clear()
    teardownParentHeadSyncRegistry()
  },
}
