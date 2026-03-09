// Debounced head sync hook: mirrors parent document.head into a child window.
// Use for SpatialDivs and attachments to keep styles/meta in sync.
import { useEffect } from 'react'
import { syncParentHeadToChild } from './windowStyleSync'

// Observes parent head mutations and schedules a debounced sync.
export function useHeadSync(childWindow: WindowProxy | null) {
  useEffect(() => {
    if (!childWindow) return
    let timer: number | undefined
    const scheduleSync = () => {
      if (timer) window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        syncParentHeadToChild(childWindow)
      }, 100)
    }
    // Initial sync in case mutations happened before observer attached
    scheduleSync()
    const observer = new MutationObserver(scheduleSync)
    observer.observe(document.head, { childList: true, subtree: true })
    return () => {
      if (timer) window.clearTimeout(timer)
      observer.disconnect()
    }
  }, [childWindow])
}
