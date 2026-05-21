const REQUEST_ID_PREFIX = 'wsreq'

export const DEFAULT_SPATIAL_REQUEST_TIMEOUT_MS = 30_000

let requestSequence = 0

// One nonce per JS execution context keeps request ids refresh-safe without
// exposing host-specific lifecycle details in the protocol surface.
const contextNonce = createContextNonce()

function createContextNonce(): string {
  const cryptoApi = globalThis.crypto
  if (cryptoApi?.getRandomValues) {
    const values = new Uint32Array(2)
    cryptoApi.getRandomValues(values)
    return Array.from(values, value => value.toString(36)).join('')
  }

  return Math.random().toString(36).slice(2, 12)
}

export function createSpatialRequestId(): string {
  requestSequence += 1
  return `${REQUEST_ID_PREFIX}_${contextNonce}_${requestSequence}`
}

export function getCurrentPageEpoch(): string | undefined {
  const pageEpoch = window.__webspatialsdk__?.pageEpoch
  if (pageEpoch === undefined || pageEpoch === null || pageEpoch === '') {
    return undefined
  }

  return String(pageEpoch)
}

export function buildSpatialRequestQuery(
  requestId: string,
  pageEpoch = getCurrentPageEpoch(),
): string {
  const params = new URLSearchParams()
  params.set('wsrid', requestId)
  // Keep the legacy rid key during rollout so older native hosts can still
  // resolve the async creation callback.
  params.set('rid', requestId)

  if (pageEpoch !== undefined) {
    params.set('wsepoch', pageEpoch)
  }

  return params.toString()
}
