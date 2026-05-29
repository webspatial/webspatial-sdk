import { useEffect } from 'react'

import { syncParentHeadToChild } from './windowStyleSync'

interface Options {
  subtree?: boolean
  immediate?: boolean
}

function defaultShouldSync(mutations?: MutationRecord[] | null) {
  if (!Array.isArray(mutations) || mutations.length === 0) return false
  for (const mutation of mutations) {
    const nodes: Node[] = [
      ...Array.from(mutation.addedNodes),
      ...Array.from(mutation.removedNodes),
    ]
    for (const node of nodes) {
      if (!(node instanceof Element)) continue
      const tag = node.tagName
      if (tag === 'STYLE') return true
      if (tag === 'LINK') {
        const { rel } = node as HTMLLinkElement
        if (rel && rel.toLowerCase() === 'stylesheet') return true
      }
    }
  }
  return false
}

export function useSyncHeadStyles(
  childWindow: WindowProxy | null | undefined,
  options?: Options,
) {
  const delayMs = 100
  const subtree = options?.subtree ?? false
  const immediate = options?.immediate ?? true

  useEffect(() => {
    if (!childWindow) return

    let timer: number | undefined
    const scheduleSync = () => {
      if (timer) window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        syncParentHeadToChild(childWindow)
      }, delayMs)
    }

    if (immediate) scheduleSync()

    const observer = new MutationObserver(mutations => {
      if (!defaultShouldSync(mutations)) return
      scheduleSync()
    })
    observer.observe(document.head, { childList: true, subtree })

    return () => {
      if (timer) window.clearTimeout(timer)
      observer.disconnect()
    }
  }, [childWindow, delayMs, subtree, immediate])
}
