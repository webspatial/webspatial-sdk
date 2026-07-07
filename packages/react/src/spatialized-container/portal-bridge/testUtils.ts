/**
 * Test-only helpers for portal-bridge suites. Mirrors the fake-WindowProxy
 * pattern used by `hooks/useSync2DFrame.test.tsx` and
 * `utils/windowStyleSync.test.ts`.
 */

export function createFakePortalWindow(): {
  windowProxy: WindowProxy
  portalDocument: Document
} {
  const portalDocument = document.implementation.createHTMLDocument()
  return {
    windowProxy: { document: portalDocument } as unknown as WindowProxy,
    portalDocument,
  }
}

export function createHostPlaceholder(): HTMLElement {
  const placeholder = document.createElement('div')
  placeholder.setAttribute('data-testid', 'placeholder')
  document.body.appendChild(placeholder)
  return placeholder
}
