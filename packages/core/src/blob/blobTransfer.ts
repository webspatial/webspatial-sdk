import {
  CompleteBlobTransferCommand,
  FailBlobTransferCommand,
  SpatializedElementCommand,
  StartBlobTransferCommand,
  TransferBlobChunkCommand,
} from '../JSBCommand'
import { SpatialObject } from '../SpatialObject'

// Bytes per chunk shipped over the (string-only) bridge.
const CHUNK_SIZE = 2 * 1024 * 1024 // 2 MiB
const MAX_IN_FLIGHT = 4

// Fetches a blob URL and streams it to native with bounded parallelism.
export async function transferBlob(
  element: SpatialObject,
  requestId: string,
  src: string,
) {
  try {
    const response = await fetch(src)
    const blob = await response.blob()
    await execute(
      new StartBlobTransferCommand(element, {
        requestId,
        src,
        mimeType: blob.type,
        size: blob.size,
      }),
    )

    // Workers share one iterator, so each pulls the next unsent chunk.
    const chunks = chunkBlob(blob)
    const transferChunks = async () => {
      for (const { offset, slice } of chunks) {
        const data = await encodeBase64(slice)
        await execute(
          new TransferBlobChunkCommand(element, { requestId, offset, data }),
        )
      }
    }

    await Promise.all(Array.from({ length: MAX_IN_FLIGHT }, transferChunks))
    await execute(new CompleteBlobTransferCommand(element, { requestId }))
  } catch (ex) {
    const message = ex instanceof Error ? ex.message : String(ex)
    await new FailBlobTransferCommand(element, { requestId, message }).execute()
  }
}

function* chunkBlob(blob: Blob) {
  for (let offset = 0; offset < blob.size; offset += CHUNK_SIZE) {
    yield { offset, slice: blob.slice(offset, offset + CHUNK_SIZE) }
  }
}

// Base64-encodes a blob slice without materialising the bytes as a string
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

// Execute command and convert failure to exception
async function execute(command: SpatializedElementCommand) {
  const result = await command.execute()
  if (!result.success) {
    throw new Error(result.errorMessage || 'Blob transfer command failed')
  }
  return result
}
