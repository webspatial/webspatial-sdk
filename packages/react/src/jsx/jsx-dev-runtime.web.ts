// Historically this file was the strip-only sibling of `jsx-dev-runtime.ts`,
// produced for plain-web / `react-server` consumers. Per spatial-lazy-load
// spec tasks.md §6.1 the unified JSX dev runtime now serves every
// environment (plain web, AVP, SSR, RSC); a separate strip-only sibling is
// no longer needed. PR 5 of the lazy-load roll-out drops the corresponding
// `tsup` entry, the `dist/jsx/jsx-dev-runtime.web.js` output, and the
// `react-server` conditional in `packages/react/package.json` exports — at
// which point this file is physically deleted. Until then it re-exports
// the unified runtime so the published `dist/jsx/jsx-dev-runtime.web.js`
// keeps resolving to identical strip + facade-HOC wrap behavior (per the
// spec "SSR strips and wraps identically to client-side rendering"
// Scenario).
export * from './jsx-dev-runtime'
