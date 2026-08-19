import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { transferBlob } from './blobTransfer'

interface CommandResult {
  success: boolean
  errorMessage?: string
}

const commandState = vi.hoisted(() => ({
  calls: [] as Array<Record<string, unknown>>,
  chunkResult: { success: true } as CommandResult,
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
      return Promise.resolve({ success: true })
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
        return Promise.resolve(commandState.chunkResult)
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
      return Promise.resolve({ success: true })
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
      return Promise.resolve({ success: true })
    }
  },
}))

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

describe('transferBlob', () => {
  beforeEach(() => {
    commandState.calls.length = 0
    commandState.chunkResult = success()
    commandState.deferChunkAcknowledgements = false
    commandState.chunkResolvers.length = 0
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('keeps at most four chunks in flight through native acknowledgement', async () => {
    fetchBlob(new Blob([new Uint8Array(10 * 1024 * 1024)]))
    commandState.deferChunkAcknowledgements = true
    const encodeChunk = vi.fn(async () => '')

    const transfer = transferBlob({ element, requestId, src }, { encodeChunk })

    await vi.waitFor(() => {
      expect(commandState.chunkResolvers).toHaveLength(4)
    })
    expect(
      commandState.calls
        .filter(call => call.command === 'TransferBlobChunk')
        .map(call => call.offset),
    ).toEqual([0, 2 * 1024 * 1024, 4 * 1024 * 1024, 6 * 1024 * 1024])

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
    const encodeChunk = vi.fn(async () => '')

    await transferBlob({ element, requestId, src }, { encodeChunk })

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
    expect(encodeChunk).not.toHaveBeenCalled()
  })

  it('stops scheduling when native rejects an in-flight chunk', async () => {
    fetchBlob(new Blob([new Uint8Array(10 * 1024 * 1024)]))
    commandState.chunkResult = {
      success: false,
      errorMessage: 'native cancelled',
    }
    const encodeChunk = vi.fn(async () => '')

    await transferBlob({ element, requestId, src }, { encodeChunk })

    expect(encodeChunk).toHaveBeenCalledTimes(4)
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

  it('reports a fetch failure without starting the transfer', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('revoked')))

    await transferBlob({ element, requestId, src })

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
