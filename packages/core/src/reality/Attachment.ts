import {
  CreateAttachmentEntityCommand,
  UpdateAttachmentEntityCommand,
  DestroyCommand,
} from '../JSBCommand'
import {
  AttachmentEntityOptions,
  AttachmentEntityUpdateOptions,
} from '../types/types'

export class Attachment {
  private _isDestroyed = false

  constructor(
    public readonly id: string,
    private readonly windowProxy: WindowProxy,
    private options: AttachmentEntityOptions,
  ) {}

  get isDestroyed() {
    return this._isDestroyed
  }

  getContainer(): HTMLElement {
    return (this.windowProxy as any).document.body
  }

  async update(options: AttachmentEntityUpdateOptions) {
    if (this._isDestroyed) return
    if (options.position) this.options.position = options.position
    if (options.size) this.options.size = options.size
    return new UpdateAttachmentEntityCommand(this.id, options).execute()
  }

  async destroy() {
    if (this._isDestroyed) return
    this._isDestroyed = true
    return new DestroyCommand(this.id).execute()
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
  // Set base href so relative URLs resolve correctly in the child webview
  ;(windowProxy as any).document.head.innerHTML = `<meta name="viewport" content="width=device-width, initial-scale=1">
    <base href="${document.baseURI}">`
  return new Attachment(id, windowProxy, options)
}
