import { defineConfig } from 'vite'
import path from 'path'
import react from '@vitejs/plugin-react'

const XRSDKBaseDir = path.join(__dirname, '../')

const corePkg = require('../core/package.json')
const reactPkg = require('../react/package.json')

const tsconfig: any = {
  compilerOptions: {
    jsx: 'react-jsx',
    jsxImportSource: '@webspatial/react-sdk/jsx',
  },
}

export default defineConfig({
  // root: './',
  // logLevel: 'silent',
  server: {
    port: 4000,
    open: false,
  },

  plugins: [react()],

  resolve: {
    alias: {
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
