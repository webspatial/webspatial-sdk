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
  private observer: MutationObserver | null = null

  constructor(id: string, options: AttachmentOptions) {
    this.id = id
    this.entityId = options.entityId
    this.anchor = options.anchor ?? [0.5, 0.5, 0.5]
    this.offset = options.offset ?? [0, 0, 0]
    this.size = options.size ?? { width: 400, height: 300 }
    this.container = document.createElement('div')
  }

  getContainer(): HTMLElement {
    return this.container
  }

  initRenderSync() {
    if (this.observer) return
    const platform = createPlatform()
    this.observer = new MutationObserver(() => {
      const html = this.container.innerHTML
      platform.callJSB(
        'SetAttachmentHTML',
        JSON.stringify({ id: this.id, html }),
      )
    })
    this.observer.observe(this.container, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
    })
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
    this.observer?.disconnect()
    this.observer = null
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

  const platform = createPlatform()
  console.log('[Attachment] Calling CreateAttachment JSB:', {
    id,
    entityId: options.entityId,
    anchorX: anchor[0],
    anchorY: anchor[1],
    anchorZ: anchor[2],
    offsetX: offset[0],
    offsetY: offset[1],
    offsetZ: offset[2],
    width: size.width,
    height: size.height,
  })
  await platform.callJSB(
    'CreateAttachment',
    JSON.stringify({
      id,
      entityId: options.entityId,
      anchorX: anchor[0],
      anchorY: anchor[1],
      anchorZ: anchor[2],
      offsetX: offset[0],
      offsetY: offset[1],
      offsetZ: offset[2],
      width: size.width,
      height: size.height,
    }),
  )

  const instance = new Attachment(id, options)
  instance.initRenderSync()
  return instance
}
