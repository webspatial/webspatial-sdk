import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  define: {
    __WEBSPATIAL_CORE_SDK_VERSION__: JSON.stringify('local'),
    __WEBSPATIAL_REACT_SDK_VERSION__: JSON.stringify('local'),
  },
  resolve: {
    alias: [
      {
        find: '@webspatial/core-sdk/runtime',
        replacement: fileURLToPath(
          new URL('../../packages/core/src/runtime/index.ts', import.meta.url),
        ),
      },
      {
        find: '@webspatial/core-sdk/install-polyfills',
        replacement: fileURLToPath(
          new URL(
            '../../packages/core/src/install-polyfills.ts',
            import.meta.url,
          ),
        ),
      },
      {
        find: '@webspatial/core-sdk',
        replacement: fileURLToPath(
          new URL('../../packages/core/src/index.ts', import.meta.url),
        ),
      },
      {
        find: '@webspatial/react-sdk/internal/facades-client',
        replacement: fileURLToPath(
          new URL(
            '../../packages/react/src/internal/facades-client.ts',
            import.meta.url,
          ),
        ),
      },
      {
        find: '@webspatial/react-sdk/jsx-runtime',
        replacement: fileURLToPath(
          new URL(
            '../../packages/react/src/jsx/jsx-runtime.ts',
            import.meta.url,
          ),
        ),
      },
      {
        find: '@webspatial/react-sdk/jsx-dev-runtime',
        replacement: fileURLToPath(
          new URL(
            '../../packages/react/src/jsx/jsx-dev-runtime.ts',
            import.meta.url,
          ),
        ),
      },
      {
        find: '@webspatial/react-sdk',
        replacement: fileURLToPath(
          new URL('../../packages/react/src/index.ts', import.meta.url),
        ),
      },
    ],
  },
})
