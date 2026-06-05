import { useEffect } from 'react'

import { SpatialStyleInfoUpdateEvent } from '../notifyUpdateStandInstanceLayout'
import {
  disposeSyncParentHeadToChild,
  scheduleSyncParentHeadToChild,
} from './windowStyleSync'

interface Options {
  subtree?: boolean
  immediate?: boolean
}

type SyncTiming = 'immediate' | 'delayed'

const activeChildWindows = new Set<WindowProxy>()

let patchedCssomUsers = 0
let originalInsertRule: CSSStyleSheet['insertRule'] | undefined
let originalDeleteRule: CSSStyleSheet['deleteRule'] | undefined

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

function scheduleActiveChildWindowSync() {
  for (const childWindow of activeChildWindows) {
    scheduleSyncParentHeadToChild(childWindow, 'immediate')
  }
}

function installCssomRuleObserver() {
  if (typeof CSSStyleSheet === 'undefined') return () => {}

  patchedCssomUsers++
  if (patchedCssomUsers > 1) {
    return uninstallCssomRuleObserver
  }

  originalInsertRule = CSSStyleSheet.prototype.insertRule
  originalDeleteRule = CSSStyleSheet.prototype.deleteRule

  CSSStyleSheet.prototype.insertRule = function patchedInsertRule(
    rule: string,
    index?: number,
  ) {
    const result = originalInsertRule!.call(this, rule, index)
    if (isParentHeadStyleSheet(this)) scheduleActiveChildWindowSync()
    return result
  }

  CSSStyleSheet.prototype.deleteRule = function patchedDeleteRule(
    index: number,
  ) {
    originalDeleteRule!.call(this, index)
    if (isParentHeadStyleSheet(this)) scheduleActiveChildWindowSync()
  }

  return uninstallCssomRuleObserver
}

function uninstallCssomRuleObserver() {
  if (patchedCssomUsers <= 0) return
  patchedCssomUsers--
  if (patchedCssomUsers > 0) return
  if (originalInsertRule) {
    CSSStyleSheet.prototype.insertRule = originalInsertRule
  }
  if (originalDeleteRule) {
    CSSStyleSheet.prototype.deleteRule = originalDeleteRule
  }
  originalInsertRule = undefined
  originalDeleteRule = undefined
}

function getSyncTiming(mutations?: MutationRecord[] | null): SyncTiming | null {
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

export function useSyncHeadStyles(
  childWindow: WindowProxy | null | undefined,
  options?: Options,
) {
  const immediate = options?.immediate ?? true

  useEffect(() => {
    if (!childWindow) return

    activeChildWindows.add(childWindow)
    const uninstallCssomRuleObserver = installCssomRuleObserver()

    if (immediate) scheduleSyncParentHeadToChild(childWindow)

    const observer = new MutationObserver(mutations => {
      const timing = getSyncTiming(mutations)
      if (!timing) return
      scheduleSyncParentHeadToChild(childWindow, timing)
    })
    observer.observe(document.head, {
      childList: true,
      characterData: true,
      subtree: true,
    })

    const onDomUpdated = () =>
      scheduleSyncParentHeadToChild(childWindow, 'afterHostLayout')
    document.addEventListener(
      SpatialStyleInfoUpdateEvent.domUpdated,
      onDomUpdated,
    )

    return () => {
      activeChildWindows.delete(childWindow)
      uninstallCssomRuleObserver()
      observer.disconnect()
      document.removeEventListener(
        SpatialStyleInfoUpdateEvent.domUpdated,
        onDomUpdated,
      )
      disposeSyncParentHeadToChild(childWindow)
    }
  }, [childWindow, immediate])
}
