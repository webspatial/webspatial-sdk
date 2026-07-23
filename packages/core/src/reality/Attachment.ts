import { SpatialObject } from '../SpatialObject'
import {
  UpdateAttachmentEntityCommand,
  InitializeAttachmentCommand,
} from '../JSBCommand'
import { createNativeAttachment } from '../spatial-host'
import {
  AttachmentEntityOptions,
  AttachmentEntityUpdateOptions,
} from '../types/types'

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

  async update(options: AttachmentEntityUpdateOptions) {
    if (this.isDestroyed) return
    if (options.position) this.options.position = options.position
    if (options.rotation) this.options.rotation = options.rotation
    if (options.scale) this.options.scale = options.scale
    if (options.width !== undefined) this.options.width = options.width
    if (options.height !== undefined) this.options.height = options.height
    return new UpdateAttachmentEntityCommand(this.id, options).execute()
  }
}

export async function createAttachmentEntity(
  options: AttachmentEntityOptions,
): Promise<Attachment> {
  const result = await createNativeAttachment(options)
  if (!result.success) {
    throw new Error('createAttachmentEntity failed: ' + result?.errorMessage)
  }
  const { id, windowProxy } = result.data!
  await new InitializeAttachmentCommand(id, options).execute()
  return new Attachment(id, windowProxy, options)
}
