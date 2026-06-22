import { SpatialObject } from '../SpatialObject'
import {
  UpdateAttachmentEntityCommand,
  InitializeAttachmentCommand,
  DestroyCommand,
} from '../JSBCommand'
import { createNativeAttachment } from '../spatial-host'
import {
  AttachmentEntityOptions,
  AttachmentEntityUpdateOptions,
  Vec3Like,
} from '../types/types'
import {
  AttachmentCreationCancelledError,
  enqueueAttachmentCreation,
} from './attachmentCreationQueue'
import {
  getAttachmentPageGeneration,
  isAttachmentPageStale,
} from './attachmentTeardown'

/**
 * Entity-like attachment surface. Not a SpatialEntity: the native entity is
 * created and owned by SwiftUI's RealityView attachments mechanism, so only
 * transform-style behavior (position/rotation/scale/sizing) is exposed —
 * no components, children, events or transform animation.
 */
export class Attachment extends SpatialObject {
  constructor(
    id: string,
    private readonly windowProxy: WindowProxy,
    private options: AttachmentEntityOptions,
  ) {
    super(id)
  }

  getContainer(): HTMLElement {
    return (this.windowProxy as Window).document.body
  }

  getWindowProxy(): WindowProxy {
    return this.windowProxy
  }

  /** Set position relative to the parent entity, in meters. */
  async setPosition(position: Vec3Like) {
    return this.update({ position })
  }

  /** Set rotation relative to the parent entity, Euler degrees (XYZ). */
  async setRotation(rotation: Vec3Like) {
    return this.update({ rotation })
  }

  /** Set scale relative to the parent entity. */
  async setScale(scale: Vec3Like) {
    return this.update({ scale })
  }

  async update(options: AttachmentEntityUpdateOptions) {
    if (this.isDestroyed) return
    if (options.position) this.options.position = options.position
    if (options.rotation) this.options.rotation = options.rotation
    if (options.scale) this.options.scale = options.scale
    if (options.size) this.options.size = options.size
    if (options.width !== undefined) this.options.width = options.width
    if (options.height !== undefined) this.options.height = options.height
    return new UpdateAttachmentEntityCommand(this.id, options).execute()
  }
}

export async function createAttachmentEntity(
  options: AttachmentEntityOptions,
): Promise<Attachment> {
  return enqueueAttachmentCreation(() => createAttachmentEntityImpl(options))
}

async function createAttachmentEntityImpl(
  options: AttachmentEntityOptions,
): Promise<Attachment> {
  const pageGen = getAttachmentPageGeneration()
  const result = await openNativeAttachmentWithRetry(options)
  if (isAttachmentPageStale(pageGen)) {
    const orphanId = result.data?.id
    if (orphanId) {
      await new DestroyCommand(orphanId).execute()
    }
    throw new AttachmentCreationCancelledError()
  }
  if (!result.success) {
    throw new Error('createAttachmentEntity failed: ' + result?.errorMessage)
  }
  const { id, windowProxy } = result.data!
  if (!windowProxy || !id) {
    throw new Error(
      'createAttachmentEntity failed: window.open returned no WindowProxy (native child webview limit or concurrent create rejected)',
    )
  }
  await new InitializeAttachmentCommand(id, options).execute()
  if (isAttachmentPageStale(pageGen)) {
    await new DestroyCommand(id).execute()
    throw new AttachmentCreationCancelledError()
  }
  return new Attachment(id, windowProxy, options)
}

const OPEN_ATTACHMENT_MAX_ATTEMPTS = 12

async function openNativeAttachmentWithRetry(options: AttachmentEntityOptions) {
  for (let attempt = 1; attempt <= OPEN_ATTACHMENT_MAX_ATTEMPTS; attempt++) {
    const result = await createNativeAttachment(options)
    const windowProxy = result.data?.windowProxy
    const id = result.data?.id
    if (result.success && windowProxy && id) {
      return result
    }
    await waitForNextFrame()
  }
  return createNativeAttachment(options)
}

function waitForNextFrame() {
  return new Promise<void>(resolve => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  })
}
