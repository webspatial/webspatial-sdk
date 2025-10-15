// Minimal browser polyfills for Node
if (typeof global.window === 'undefined') {
  global.window = global
  global.navigator = { userAgent: 'node' }
  global.document = { createElement: () => ({ getContext: () => null }) }
}
