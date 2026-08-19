import {
  CompleteBlobTransferCommand,
  FailBlobTransferCommand,
  StartBlobTransferCommand,
  TransferBlobChunkCommand,
} from '../JSBCommand'
import { SpatialObject } from '../SpatialObject'

/** Bytes per chunk shipped over the (string-only) bridge. */
const CHUNK_SIZE = 2 * 1024 * 1024 // 2 MiB
const MAX_IN_FLIGHT = 4

export interface TransferBlobOptions {
  /** The element whose transfer this is; supplies the id native routes chunks on. */
  element: SpatialObject
  /** Which native source attempt these bytes belong to. */
  requestId: string
  /** The `blob:` URL to ship. */
  src: string
}

interface TransferBlobDependencies {
  encodeChunk: (slice: Blob) => Promise<string>
}

/**
 * Fetches a blob URL and streams it to native with bounded parallelism.
 *
 * At most four operations are in flight from slice encoding through native
 * acknowledgement. The first failure stops new scheduling; already-started
 * operations settle before a best-effort terminal error is sent.
 *
 * Component-agnostic: it only needs an element, request ID, and blob URL, so it
 * can back blob transfers for components other than `<Model>` later.
 */
export async function transferBlob(
  { element, requestId, src }: TransferBlobOptions,
  { encodeChunk = encodeBase64 }: Partial<TransferBlobDependencies> = {},
): Promise<void> {
  try {
    const response = await fetch(src)
    const blob = await response.blob()
    ensureSuccess(
      await new StartBlobTransferCommand(element, {
        requestId,
        src,
        mimeType: blob.type,
        size: blob.size,
      }).execute(),
    )

    let nextOffset = 0
    let firstError: Error | undefined
    const operationCount = Math.min(
      MAX_IN_FLIGHT,
      Math.ceil(blob.size / CHUNK_SIZE),
    )

    const pump = async () => {
      while (firstError === undefined) {
        const offset = nextOffset
        if (offset >= blob.size) return
        nextOffset += CHUNK_SIZE

        try {
          const data = await encodeChunk(
            blob.slice(offset, offset + CHUNK_SIZE),
          )
          ensureSuccess(
            await new TransferBlobChunkCommand(element, {
              requestId,
              offset,
              data,
            }).execute(),
          )
        } catch (error) {
          firstError ??= toError(error)
        }
      }
    }

    await Promise.all(Array.from({ length: operationCount }, pump))
    if (firstError) throw firstError

    ensureSuccess(
      await new CompleteBlobTransferCommand(element, {
        requestId,
      }).execute(),
    )
  } catch (error) {
    await sendError(element, requestId, toError(error).message)
  }
}

/** Base64-encodes a blob slice without materialising the bytes as a string. */
function encodeBase64(slice: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      // `readAsDataURL` yields `data:<type>;base64,<payload>`; keep the payload.
      const result = reader.result as string
      resolve(result.slice(result.indexOf(',') + 1))
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(slice)
  })
}

function ensureSuccess(result: { success: boolean; errorMessage?: string }) {
  if (!result.success) {
    throw new Error(result.errorMessage || 'Blob transfer command failed')
  }
}

async function sendError(
  element: SpatialObject,
  requestId: string,
  message: string,
) {
  try {
    await new FailBlobTransferCommand(element, {
      requestId,
      message,
    }).execute()
  } catch {
    // Best effort: native may already have invalidated this request.
  }
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error))
}
