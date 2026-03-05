import { SpatialObject } from '../SpatialObject'
import {
  CreateAttachmentEntityCommand,
  UpdateAttachmentEntityCommand,
} from '../JSBCommand'
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
    if (options.size) this.options.size = options.size
    return new UpdateAttachmentEntityCommand(this.id, options).execute()
  }
}

export async function createAttachmentEntity(
  options: AttachmentEntityOptions,
): Promise<Attachment> {
  const result = await new CreateAttachmentEntityCommand(options).execute()
  if (!result.success) {
    throw new Error('createAttachmentEntity failed: ' + result?.errorMessage)
  }
  const { id, windowProxy } = result.data!
  return new Attachment(id, windowProxy, options)
}
