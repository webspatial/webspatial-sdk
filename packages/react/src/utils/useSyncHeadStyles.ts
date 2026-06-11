import { useEffect } from 'react'

import {
  disposeSyncParentHeadToChild,
  registerParentHeadSyncTarget,
} from './windowStyleSync'

export function useSyncHeadStyles(childWindow: WindowProxy | null | undefined) {
  useEffect(() => {
    if (!childWindow) return

    const unregister = registerParentHeadSyncTarget(childWindow)

    return () => {
      unregister()
      disposeSyncParentHeadToChild(childWindow)
    }
  }, [childWindow])
}
