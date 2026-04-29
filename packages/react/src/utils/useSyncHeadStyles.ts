import { useEffect } from 'react'

import { syncParentHeadToChild } from './windowStyleSync'

interface Options {
  subtree?: boolean
  immediate?: boolean
}

type SyncTiming = 'immediate' | 'delayed'

function getSyncTiming(mutations?: MutationRecord[] | null): SyncTiming | null {
  if (!Array.isArray(mutations) || mutations.length === 0) return null
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
        if (rel && rel.toLowerCase() === 'stylesheet') return 'delayed'
      }
    }
  }
  return null
}

export function useSyncHeadStyles(
  childWindow: WindowProxy | null | undefined,
  options?: Options,
) {
  const delayMs = 100
  const subtree = options?.subtree ?? true
  const immediate = options?.immediate ?? true

  useEffect(() => {
    if (!childWindow) return

    let timer: number | undefined
    let immediateQueued = false
    const scheduleSync = (timing: SyncTiming = 'delayed') => {
      if (timer) window.clearTimeout(timer)
      if (timing === 'immediate') {
        if (immediateQueued) return
        immediateQueued = true
        queueMicrotask(() => {
          immediateQueued = false
          syncParentHeadToChild(childWindow)
        })
        return
      }
      timer = window.setTimeout(() => {
        syncParentHeadToChild(childWindow)
      }, delayMs)
    }

    if (immediate) scheduleSync()

    const observer = new MutationObserver(mutations => {
      const timing = getSyncTiming(mutations)
      if (!timing) return
      scheduleSync(timing)
    })
    observer.observe(document.head, {
      childList: true,
      characterData: true,
      subtree,
    })

    return () => {
      if (timer) window.clearTimeout(timer)
      observer.disconnect()
    }
  }, [childWindow, delayMs, subtree, immediate])
}
