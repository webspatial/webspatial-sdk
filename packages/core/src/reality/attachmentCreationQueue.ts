/**
 * Serializes attachment creation (window.open + InitializeAttachment).
 * WebKit on visionOS rejects or returns null for window.open when many child
 * webviews are created concurrently; draining one create fully before starting
 * the next keeps the pending-attachment pipeline stable.
 */
let chain: Promise<unknown> = Promise.resolve()
let cancelled = false

export class AttachmentCreationCancelledError extends Error {
  constructor() {
    super('Attachment creation cancelled')
    this.name = 'AttachmentCreationCancelledError'
  }
}

export function cancelAttachmentCreationQueue() {
  cancelled = true
  chain = Promise.resolve()
}

export function resumeAttachmentCreationQueue() {
  cancelled = false
}

export function enqueueAttachmentCreation<T>(
  task: () => Promise<T>,
): Promise<T> {
  if (cancelled) {
    return Promise.reject(new AttachmentCreationCancelledError())
  }
  const run = chain.then(
    () => {
      if (cancelled) {
        throw new AttachmentCreationCancelledError()
      }
      return task()
    },
    () => {
      if (cancelled) {
        throw new AttachmentCreationCancelledError()
      }
      return task()
    },
  )
  chain = run.catch(() => {})
  return run
}
