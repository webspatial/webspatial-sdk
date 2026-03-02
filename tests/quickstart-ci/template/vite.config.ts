import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import webSpatial from '@webspatial/vite-plugin'

export default defineConfig(() => {
  return {
    plugins: [
      webSpatial(),
      react({
        jsxImportSource: '@webspatial/react-sdk',
      }),
    ],
    server: {
      host: '127.0.0.1',
      strictPort: true,
    },
  }
})
