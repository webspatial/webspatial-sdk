// Shared helpers for opening and initializing child windows (SpatialDiv, attachments).
// Keep logic centralized to avoid duplicating style, meta, and head-sync setup.
import { setOpenWindowStyle, syncParentHeadToChild } from './windowStyleSync'

// Yield to the browser event loop so expensive operations like window.open()
// don't stack up during a React effect flush.
export function yieldToMainThread(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0))
}

// Apply base styles, sync parent head, and ensure viewport/base tags for the child window.
export async function setupChildWindow(
  windowProxy: WindowProxy,
  mode: 'div' | 'attachment',
): Promise<void> {
  // Base HTML/body styles (transparent, margins, etc.)
  setOpenWindowStyle(windowProxy)

  if (mode === 'attachment') {
    // Attachments should fill their RealityKit frame
    const body = windowProxy.document.body
    body.style.display = 'block'
    body.style.minWidth = '100%'
    body.style.maxWidth = '100%'
    body.style.minHeight = '100%'
  }

  // Copy parent head links/meta/classes into the child window
  await syncParentHeadToChild(windowProxy)

  // Ensure viewport meta is present and correct
  const head = windowProxy.document.head
  const existing = windowProxy.document.querySelector('meta[name="viewport"]')
  if (existing) {
    existing.setAttribute(
      'content',
      'initial-scale=1.0, maximum-scale=1.0, user-scalable=no',
    )
  } else {
    const meta = windowProxy.document.createElement('meta')
    meta.name = 'viewport'
    meta.content =
      mode === 'attachment'
        ? 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
        : 'initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
    head.appendChild(meta)
  }

  if (mode === 'attachment') {
    // Ensure relative URLs resolve relative to the parent document
    const base = windowProxy.document.createElement('base')
    base.href = document.baseURI
    head.appendChild(base)
  }
}
