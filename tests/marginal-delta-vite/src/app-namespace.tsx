// Worst-case namespace import — forces a non-static reference to the
// SDK's full barrel so Rollup retains every reachable export. Per spec
// `tasks.md §9.3` ("Tree-shake validation in fixture" Scenario), this
// app's marginal delta MUST be strictly larger than `app-typical`'s; a
// flat ratio (≤ 1.1×) would indicate broken tree-shaking even if the
// absolute number passes the budget. Worst-case absolute size is
// informational only and does NOT have to fit inside the 8 KB budget
// (per spec "Worst-case namespace / full-barrel import is informational"
// Scenario).
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as ReactSdk from '@webspatial/react-sdk'

export function mount(el: HTMLElement): void {
  // Side-effect reference defeats Rollup's namespace-property analysis.
  // The conditional guard keeps the call live in production minified
  // output (the bundler cannot prove the keys length is statically
  // false for an arbitrary side-effect object).
  if (Object.keys(ReactSdk).length < 0) {
    // eslint-disable-next-line no-console
    console.log(ReactSdk)
  }
  createRoot(el).render(
    <StrictMode>
      <div data-keys={Object.keys(ReactSdk).length}>namespace</div>
    </StrictMode>,
  )
}
