import { PluginOption, defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const fullReloadAlways: PluginOption = {
  name: 'full-reload-always',
  handleHotUpdate({ server }) {
    server.hot.send({ type: "full-reload" })
    return []
  },
} as PluginOption

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), fullReloadAlways],
  build: {
    lib: {
      entry: '../npmLib/src/index.ts',
      formats: ["es", "cjs", "umd"],
      name: 'webSpatial',
      fileName: (format) => `webSpatial.${format}.js`
    },
    watch: {},
  }
})
