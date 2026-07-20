import { TransferModelBlobDataCommand } from '../JSBCommand'
import { SpatialObject } from '../SpatialObject'

/** Bytes per chunk shipped over the (string-only) bridge. */
const CHUNK_SIZE = 8 * 1024 * 1024 // 8 MiB

export interface TransferBlobOptions {
  /** The element whose transfer this is; supplies the id native routes chunks on. */
  element: SpatialObject
  /** The `blob:` URL to ship. */
  src: string
  /** Aborts the pump between chunks (e.g. once the element is destroyed). */
  isAborted?: () => boolean
}

/**
 * Fetches a blob URL and streams it to native as sequential base64 chunks.
 *
 * Each chunk waits for its ack before the next is sent, which bounds memory to a
 * single in-flight chunk and gives natural backpressure. A rejected ack (native
 * error, timeout, unsupported type) or a caller-signalled abort stops the pump.
 * Fetch failures are reported to native as an `isError` message rather than thrown.
 *
 * Component-agnostic: it only needs an element and a blob URL, so it can back blob
 * transfers for components other than `<Model>` later.
 */
export async function transferBlob({
  element,
  src,
  isAborted,
}: TransferBlobOptions): Promise<void> {
  let blob: Blob
  try {
    const response = await fetch(src)
    blob = await response.blob()
  } catch {
    await new TransferModelBlobDataCommand(element, {
      src,
      isError: true,
    }).execute()
    return
  }

  const { size, type } = blob
  for (let offset = 0; offset < size; offset += CHUNK_SIZE) {
    if (isAborted?.()) return
    const data = await encodeBase64(blob.slice(offset, offset + CHUNK_SIZE))
    const { success } = await new TransferModelBlobDataCommand(element, {
      src,
      data,
      type,
      size,
    }).execute()
    if (!success) return
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
