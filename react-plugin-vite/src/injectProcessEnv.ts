import { PluginOption } from 'vite'
import { getEnv, AVP } from './shared'
export function injectProcessEnv(): PluginOption[] {
  return [
    {
      name: 'inject-xr-env',
      apply: 'serve',
      transformIndexHtml(html, { originalUrl }) {
        const xrEnv = originalUrl?.includes('/webspatial/avp/') ? AVP : ''
        const injectedScript = `<script>window.XR_ENV = ${JSON.stringify(xrEnv)}</script>`
        return html.replace('<head>', `<head>${injectedScript}`)
      },
    },

    {
      name: 'react-vite-plugin-for-webspatial',
      apply: 'build',
      config: () => {
        const xrEnv = getEnv()
        const isAVP = xrEnv === AVP

        return {
          resolve: {
            alias: [
              {
                // Use default or web version based on the environment
                find: /^@webspatial\/react-sdk$/,
                replacement: isAVP
                  ? '@webspatial/react-sdk/default'
                  : '@webspatial/react-sdk/web',
              },
            ],
          },
          define: {
            // Define environment variables for both Node and browser
            'process.env.XR_ENV': JSON.stringify(xrEnv),
            'import.meta.env.XR_ENV': JSON.stringify(xrEnv),
          },
          build: {
            // Set output directory for AVP version to /dist/spatial/avp
            outDir: isAVP ? 'dist/webspatial/avp' : 'dist',
            // Do not empty the output directory for AVP build
            emptyOutDir: xrEnv !== AVP,
            // Remove custom rollup naming logic; use Vite defaults
            rollupOptions: {},
          },
          optimizeDeps: {},
        }
      },
    },
  ]
}
