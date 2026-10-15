// Next.js config for `spatial-next-min`.
//
// We intentionally stay on the default Webpack bundler here. The
// `lazy-load-spatial-runtime` spec lists Next.js Turbopack as
// **out of scope for v1** (see openspec/changes/lazy-load-spatial-runtime/
// specs/spatial-lazy-load/spec.md "Plugin-free integration" Requirement —
// Module Federation, Turbopack, Webpack 4, and CommonJS-only consumers
// are explicitly not validated). Pinning the bundler choice here keeps
// the demo aligned with the spec's tested target.
//
// React Strict Mode is enabled so the demo exercises the
// double-mount / double-effect path the spec's bridge contract is
// validated against (see `bootSpatial` Requirement, "StrictMode safe"
// Scenario).

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Allow the SDK's published ESM `dist/` to be consumed as-is. Without
  // this Next.js sometimes transforms the workspace symlink target
  // unexpectedly, defeating the SDK's own dynamic-import boundary.
  transpilePackages: [],
}

module.exports = nextConfig
