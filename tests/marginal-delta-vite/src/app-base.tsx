// Baseline app — does NOT import `@webspatial/react-sdk`. Provides the
// "without the SDK" half of the marginal-delta measurement (spec
// `tasks.md §9.2`). Everything else (React, react-dom render call) is
// identical to `app-typical.tsx` so the subtraction nets out non-SDK
// concerns.
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

export function mount(el: HTMLElement): void {
  createRoot(el).render(
    <StrictMode>
      <div>baseline</div>
    </StrictMode>,
  )
}
