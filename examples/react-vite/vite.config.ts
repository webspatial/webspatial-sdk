import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import xrsdkPlugin from '@xrsdk/react/plugin-vite.js'

// https://vite.dev/config/

// we should build in such order: web, avp
export default defineConfig({
  plugins: [
    react(),
    xrsdkPlugin(), // <-- add this plugin
  ],
})
