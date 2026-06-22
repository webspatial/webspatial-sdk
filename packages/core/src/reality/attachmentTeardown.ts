import {
  DestroyAllAttachmentsCommand,
  DestroyAttachmentsCommand,
  DestroyCommand,
} from '../JSBCommand'
import {
  cancelAttachmentCreationQueue,
  resumeAttachmentCreationQueue,
} from './attachmentCreationQueue'

const pendingDestroyIds = new Set<string>()
let flushPromise: Promise<void> | null = null
let pageGeneration = 0
let realityMountCount = 0
let teardownPromise: Promise<void> | null = null

export function getAttachmentPageGeneration(): number {
  return pageGeneration
}

/** First Reality on a page mounted — allow attachment creates for this generation. */
export function onRealityMounted(): void {
  if (realityMountCount === 0) {
    pageGeneration++
    resumeAttachmentCreationQueue()
  }
  realityMountCount++
}

/** Last Reality on a page unmounted — cancel creates and destroy all native attachments. */
export function onRealityUnmounted(): Promise<void> {
  realityMountCount = Math.max(0, realityMountCount - 1)
  if (realityMountCount > 0) {
    return Promise.resolve()
  }
  pageGeneration++
  cancelAttachmentCreationQueue()
  pendingDestroyIds.clear()
  if (!teardownPromise) {
    teardownPromise = new DestroyAllAttachmentsCommand()
      .execute()
      .then(() => {})
      .finally(() => {
        teardownPromise = null
      })
  }
  return teardownPromise
}

export function scheduleAttachmentDestroy(attachmentId: string) {
  pendingDestroyIds.add(attachmentId)
}

/**
 * Destroy all attachments scheduled since the last flush. Waits one microtask
 * so sibling AttachmentEntity cleanups can register ids before the batch runs.
 */
export function flushAttachmentDestroys(): Promise<void> {
  if (!flushPromise) {
    flushPromise = new Promise<void>(resolve => {
      queueMicrotask(() => {
        void flushPendingDestroys().finally(() => {
          flushPromise = null
          resolve()
        })
      })
    })
  }
  return flushPromise
}

async function flushPendingDestroys() {
  const ids = Array.from(pendingDestroyIds)
  pendingDestroyIds.clear()
  if (ids.length === 0) {
    return
  }
  if (ids.length === 1) {
    await new DestroyCommand(ids[0]).execute()
    return
  }
  await new DestroyAttachmentsCommand(ids).execute()
}

export function isAttachmentPageStale(sinceGeneration: number): boolean {
  return sinceGeneration !== pageGeneration
}
