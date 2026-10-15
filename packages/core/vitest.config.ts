import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    // Use happy-dom instead of jsdom because jsdom does not implement
    // W3C Geometry Interfaces (DOMMatrix, DOMPoint, etc.).
    // composeSRT in utils.ts relies on `new DOMMatrix()` which is only
    // available in happy-dom's environment.
    environment: 'happy-dom',
  },
})
