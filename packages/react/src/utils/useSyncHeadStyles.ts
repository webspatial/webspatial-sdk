import { useEffect } from 'react'

import {
  disposeSyncParentHeadToChild,
  registerParentHeadSyncTarget,
} from './windowStyleSync'

interface Options {
  /** @deprecated The singleton parent-head observer always watches subtree changes. */
  subtree?: boolean
  immediate?: boolean
}

export function useSyncHeadStyles(
  childWindow: WindowProxy | null | undefined,
  options?: Options,
) {
  const immediate = options?.immediate ?? true

  useEffect(() => {
    if (!childWindow) return

    const unregister = registerParentHeadSyncTarget(childWindow, { immediate })

    return () => {
      unregister()
      disposeSyncParentHeadToChild(childWindow)
    }
  }, [childWindow, immediate])
}
