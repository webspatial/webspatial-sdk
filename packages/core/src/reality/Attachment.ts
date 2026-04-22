import { SpatialEntity } from './entity/SpatialEntity'
import {
  CreateAttachmentEntityCommand,
  InitializeAttachmentCommand,
  UpdateAttachmentSizeCommand,
} from '../JSBCommand'
import { AttachmentEntityOptions } from '../types/types'

export class Attachment extends SpatialEntity {
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

  async setWidth(width: number) {
    if (this.isDestroyed) return
    this.options.size = { ...this.options.size, width }
    return new UpdateAttachmentSizeCommand(this.id, { width }).execute()
  }

  async setHeight(height: number) {
    if (this.isDestroyed) return
    this.options.size = { ...this.options.size, height }
    return new UpdateAttachmentSizeCommand(this.id, { height }).execute()
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
  await new InitializeAttachmentCommand(id, options).execute()
  return new Attachment(id, windowProxy, options)
}
