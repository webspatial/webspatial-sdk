import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { transferBlob } from './blobTransfer'

interface CommandResult {
  success: boolean
  errorMessage?: string
}

const commandState = vi.hoisted(() => ({
  calls: [] as Array<Record<string, unknown>>,
  results: {} as Record<string, CommandResult>,
  deferChunkAcknowledgements: false,
  chunkResolvers: [] as Array<(result: CommandResult) => void>,
}))

vi.mock('../JSBCommand', () => ({
  StartBlobTransferCommand: class {
    constructor(
      private element: { id: string },
      private params: Record<string, unknown>,
    ) {}

    execute() {
      commandState.calls.push({
        command: 'StartBlobTransfer',
        id: this.element.id,
        ...this.params,
      })
      return Promise.resolve(
        commandState.results.StartBlobTransfer ?? { success: true },
      )
    }
  },
  TransferBlobChunkCommand: class {
    constructor(
      private element: { id: string },
      private params: Record<string, unknown>,
    ) {}

    execute() {
      commandState.calls.push({
        command: 'TransferBlobChunk',
        id: this.element.id,
        ...this.params,
      })
      if (!commandState.deferChunkAcknowledgements) {
        return Promise.resolve(
          commandState.results.TransferBlobChunk ?? { success: true },
        )
      }
      return new Promise<CommandResult>(resolve => {
        commandState.chunkResolvers.push(resolve)
      })
    }
  },
  CompleteBlobTransferCommand: class {
    constructor(
      private element: { id: string },
      private params: Record<string, unknown>,
    ) {}

    execute() {
      commandState.calls.push({
        command: 'CompleteBlobTransfer',
        id: this.element.id,
        ...this.params,
      })
      return Promise.resolve(
        commandState.results.CompleteBlobTransfer ?? { success: true },
      )
    }
  },
  FailBlobTransferCommand: class {
    constructor(
      private element: { id: string },
      private params: Record<string, unknown>,
    ) {}

    execute() {
      commandState.calls.push({
        command: 'FailBlobTransfer',
        id: this.element.id,
        ...this.params,
      })
      return Promise.resolve(
        commandState.results.FailBlobTransfer ?? { success: true },
      )
    }
  },
}))

const CHUNK_SIZE = 2 * 1024 * 1024
const element = { id: 'model-1' } as any
const requestId = 'request-1'
const src = 'blob:https://example.com/model'
const success = (): CommandResult => ({ success: true })

function fetchBlob(blob: Blob) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ blob: () => Promise.resolve(blob) }),
  )
}

function stubEncodingFileReader() {
  class EncodingFileReader {
    result: string | ArrayBuffer | null = null
    error: DOMException | null = null
    onload: (() => void) | null = null
    onerror: (() => void) | null = null

    readAsDataURL(blob: Blob) {
      this.result = `data:${blob.type};base64,encoded-${blob.size}`
      queueMicrotask(() => this.onload?.())
    }
  }

  vi.stubGlobal('FileReader', EncodingFileReader)
}

describe('transferBlob', () => {
  beforeEach(() => {
    commandState.calls.length = 0
    commandState.results = {}
    commandState.deferChunkAcknowledgements = false
    commandState.chunkResolvers.length = 0
    stubEncodingFileReader()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('sends metadata and offset chunks before completing', async () => {
    fetchBlob(
      new Blob([new Uint8Array(CHUNK_SIZE + 3)], {
        type: 'model/vnd.usdz+zip',
      }),
    )

    await transferBlob(element, requestId, src)

    expect(commandState.calls[0]).toEqual({
      command: 'StartBlobTransfer',
      id: 'model-1',
      requestId,
      src,
      mimeType: 'model/vnd.usdz+zip',
      size: CHUNK_SIZE + 3,
    })
    expect(commandState.calls.slice(1, -1)).toEqual(
      expect.arrayContaining([
        {
          command: 'TransferBlobChunk',
          id: 'model-1',
          requestId,
          offset: 0,
          data: `encoded-${CHUNK_SIZE}`,
        },
        {
          command: 'TransferBlobChunk',
          id: 'model-1',
          requestId,
          offset: CHUNK_SIZE,
          data: 'encoded-3',
        },
      ]),
    )
    expect(commandState.calls.at(-1)).toEqual({
      command: 'CompleteBlobTransfer',
      id: 'model-1',
      requestId,
    })
  })

  it('keeps at most four chunks in flight through native acknowledgement', async () => {
    fetchBlob(new Blob([new Uint8Array(5 * CHUNK_SIZE)]))
    commandState.deferChunkAcknowledgements = true

    const transfer = transferBlob(element, requestId, src)

    await vi.waitFor(() => {
      expect(commandState.chunkResolvers).toHaveLength(4)
    })
    expect(
      commandState.calls
        .filter(call => call.command === 'TransferBlobChunk')
        .map(call => call.offset),
    ).toEqual([0, CHUNK_SIZE, 2 * CHUNK_SIZE, 3 * CHUNK_SIZE])
    expect(
      commandState.calls.some(call => call.command === 'CompleteBlobTransfer'),
    ).toBe(false)

    commandState.chunkResolvers.shift()!(success())
    await vi.waitFor(() => {
      expect(
        commandState.calls.filter(call => call.command === 'TransferBlobChunk'),
      ).toHaveLength(5)
    })
    expect(commandState.chunkResolvers).toHaveLength(4)

    for (const resolve of commandState.chunkResolvers.splice(0)) {
      resolve(success())
    }
    await transfer

    expect(commandState.calls.at(-1)).toEqual({
      command: 'CompleteBlobTransfer',
      id: 'model-1',
      requestId,
    })
  })

  it('starts and immediately completes a zero-byte blob', async () => {
    fetchBlob(new Blob([], { type: 'model/vnd.usdz+zip' }))

    await transferBlob(element, requestId, src)

    expect(commandState.calls).toEqual([
      {
        command: 'StartBlobTransfer',
        id: 'model-1',
        requestId,
        src,
        mimeType: 'model/vnd.usdz+zip',
        size: 0,
      },
      {
        command: 'CompleteBlobTransfer',
        id: 'model-1',
        requestId,
      },
    ])
  })

  it('stops scheduling and reports a rejected chunk', async () => {
    fetchBlob(new Blob([new Uint8Array(5 * CHUNK_SIZE)]))
    commandState.results.TransferBlobChunk = {
      success: false,
      errorMessage: 'native cancelled',
    }

    await transferBlob(element, requestId, src)

    expect(
      commandState.calls.filter(call => call.command === 'TransferBlobChunk'),
    ).toHaveLength(4)
    expect(commandState.calls.at(-1)).toEqual({
      command: 'FailBlobTransfer',
      id: 'model-1',
      requestId,
      message: 'native cancelled',
    })
    expect(
      commandState.calls.some(call => call.command === 'CompleteBlobTransfer'),
    ).toBe(false)
  })

  it('uses the default command error when native omits a message', async () => {
    fetchBlob(new Blob(['model']))
    commandState.results.StartBlobTransfer = { success: false }

    await transferBlob(element, requestId, src)

    expect(commandState.calls).toEqual([
      expect.objectContaining({ command: 'StartBlobTransfer' }),
      {
        command: 'FailBlobTransfer',
        id: 'model-1',
        requestId,
        message: 'Blob transfer command failed',
      },
    ])
  })

  it('reports a FileReader encoding error without completing', async () => {
    class FailingFileReader {
      result: string | ArrayBuffer | null = null
      error = new Error('encoding failed')
      onload: (() => void) | null = null
      onerror: (() => void) | null = null

      readAsDataURL() {
        queueMicrotask(() => this.onerror?.())
      }
    }

    fetchBlob(new Blob(['model']))
    vi.stubGlobal('FileReader', FailingFileReader)

    await transferBlob(element, requestId, src)

    expect(commandState.calls.at(-1)).toEqual({
      command: 'FailBlobTransfer',
      id: 'model-1',
      requestId,
      message: 'encoding failed',
    })
    expect(
      commandState.calls.some(call => call.command === 'CompleteBlobTransfer'),
    ).toBe(false)
  })

  it('stringifies a non-Error fetch failure without starting', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue('revoked'))

    await transferBlob(element, requestId, src)

    expect(commandState.calls).toEqual([
      {
        command: 'FailBlobTransfer',
        id: 'model-1',
        requestId,
        message: 'revoked',
      },
    ])
  })
})
