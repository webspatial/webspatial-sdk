// Typical SDK consumer — exercises the recommended named-import pattern
// (`import { Model, bootSpatial } from '@webspatial/react-sdk'`) plus
// minimal usage so the imports survive Rollup tree-shaking. The
// marginal-delta budget pins this against `app-base.tsx`: per spec
// `tasks.md §9.2` the gzipped delta MUST be at most 8192 bytes.
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Model, bootSpatial } from '@webspatial/react-sdk'

export async function mount(el: HTMLElement): Promise<void> {
  await bootSpatial()
  createRoot(el).render(
    <StrictMode>
      <Model src="/scene.usdz" style={{ width: 320, height: 320 }} />
    </StrictMode>,
  )
}
