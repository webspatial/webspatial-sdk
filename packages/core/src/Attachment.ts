import { createPlatform } from './platform-adapter'

export interface AttachmentOptions {
  entityId: string
  url: string
  offset?: [number, number, number]
  size?: { width: number; height: number }
}

export class Attachment {
  readonly id: string
  private entityId: string
  private offset: [number, number, number]
  private size: { width: number; height: number }

  constructor(id: string, options: AttachmentOptions) {
    this.id = id
    this.entityId = options.entityId
    this.offset = options.offset ?? [0, 0, 0]
    this.size = options.size ?? { width: 400, height: 300 }
  }

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
  const offset = options.offset ?? [0, 0, 0]
  const size = options.size ?? { width: 400, height: 300 }

  const platform = createPlatform()
  await platform.callJSB(
    'CreateAttachment',
    JSON.stringify({
      id,
      entityId: options.entityId,
      url: options.url,
      offsetX: offset[0],
      offsetY: offset[1],
      offsetZ: offset[2],
      width: size.width,
      height: size.height,
    }),
  )

  return new Attachment(id, options)
}
