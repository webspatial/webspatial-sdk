import { defineConfig, type UserConfig } from 'vite'
import path from 'path'
import react from '@vitejs/plugin-react'
import corePkg from '../../packages/core/package.json'
import reactPkg from '../../packages/react/package.json'

const packagesBasePath = '../../packages'
const XRSDKBaseDir = path.join(__dirname, packagesBasePath)

const tsconfig = {
  compilerOptions: {
    jsx: 'react-jsx',
    jsxImportSource: '@webspatial/react-sdk/jsx',
  },
} satisfies NonNullable<
  Exclude<NonNullable<UserConfig['esbuild']>, false>['tsconfigRaw']
>

export default defineConfig({
  // root: './',
  // logLevel: 'silent',
  server: {
    port: 4000,
    open: false,
  },

  plugins: [react()],

  resolve: {
    // IMPORTANT — every published SDK subpath this fixture may
    // transitively reach MUST be listed here. Vite's `resolve.alias` is a
    // prefix-match remap (same trap as esbuild's `alias`), so an alias
    // `@webspatial/react-sdk` → `react/src` causes any longer specifier
    // (e.g. `@webspatial/react-sdk/internal/facades-client`) to get the
    // prefix replaced naively, producing a nonsense path. The fix is to
    // list every subpath explicitly so the more-specific alias wins.
    // Adding a new subpath to `packages/react/package.json#exports`
    // requires adding a matching alias here.
    alias: {
      '@webspatial/react-sdk/internal/facades-client': path.join(
        XRSDKBaseDir,
        'react/src/internal/facades-client.ts',
      ),
      '@webspatial/react-sdk': path.join(XRSDKBaseDir, 'react/src'),
      '@webspatial/core-sdk': path.join(XRSDKBaseDir, 'core/src'),
    },
  },
  define: {
    __WEBSPATIAL_CORE_SDK_VERSION__: JSON.stringify(corePkg.version),
    __WEBSPATIAL_REACT_SDK_VERSION__: JSON.stringify(reactPkg.version),
  },
  esbuild: {
    tsconfigRaw: tsconfig,
  },
})
