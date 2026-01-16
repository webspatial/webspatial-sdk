import { createPlatform } from './platform-adapter'

export interface AttachmentOptions {
  entityId: string
  anchor?: [number, number, number]
  offset?: [number, number, number]
  size?: { width: number; height: number }
}

export class Attachment {
  readonly id: string
  private entityId: string
  private anchor: [number, number, number]
  private offset: [number, number, number]
  private size: { width: number; height: number }
  private container: HTMLElement
  private windowProxy: WindowProxy

  constructor(id: string, options: AttachmentOptions, windowProxy: WindowProxy) {
    this.id = id
    this.entityId = options.entityId
    this.anchor = options.anchor ?? [0.5, 0.5, 0.5]
    this.offset = options.offset ?? [0, 0, 0]
    this.size = options.size ?? { width: 400, height: 300 }
    this.windowProxy = windowProxy
    const root = this.windowProxy.document.createElement('div')
    this.windowProxy.document.body.appendChild(root)
    this.container = root
  }

  getContainer(): HTMLElement {
    return this.container
  }

  initRenderSync() {}

  async update(
    options: Partial<Pick<AttachmentOptions, 'offset' | 'size'>>,
  ): Promise<void> {
    if (options.offset) this.offset = options.offset
    if (options.size) this.size = options.size

    const platform = createPlatform()
    await platform.callJSB(
      'UpdateAttachment',
      JSON.stringify({
        id: this.id,
        offsetX: this.offset[0],
        offsetY: this.offset[1],
        offsetZ: this.offset[2],
        width: this.size.width,
        height: this.size.height,
      }),
    )
  }

  async destroy(): Promise<void> {
    const platform = createPlatform()
    await platform.callJSB('DestroyAttachment', JSON.stringify({ id: this.id }))
  }
}

export async function createAttachment(
  options: AttachmentOptions,
): Promise<Attachment> {
  const id = crypto.randomUUID()
  const anchor = options.anchor ?? [0.5, 0.5, 0.5]
  const offset = options.offset ?? [0, 0, 0]
  const size = options.size ?? { width: 400, height: 300 }

  const query = new URLSearchParams({
    id,
    entityId: options.entityId,
    anchorX: String(anchor[0]),
    anchorY: String(anchor[1]),
    anchorZ: String(anchor[2]),
    offsetX: String(offset[0]),
    offsetY: String(offset[1]),
    offsetZ: String(offset[2]),
    width: String(size.width),
    height: String(size.height),
  }).toString()

  const platform = createPlatform()
  const result = await platform.callWebSpatialProtocol('createAttachment', query)
  if (!result.success || !result.data) {
    throw new Error('createAttachment failed')
  }
  const { windowProxy } = result.data
  const instance = new Attachment(id, options, windowProxy)
  return instance
}
