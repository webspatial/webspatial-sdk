import { PluginOption } from 'vite'
import { AVP, getEnv } from './shared'
interface WebSpatialOptions {
  // XR_ENV
  mode?: 'avp'
  // devServer port
  port?: number
}
export default function (options: WebSpatialOptions = {}): PluginOption[] {
  return [
    {
      name: 'vite-plugin-webspatial-serve',
      apply: 'serve',
      config: () => {
        let mode = options?.mode ?? getEnv()
        let port = options?.port ?? 3000
        const config: any = {
          define: {},
          resolve: {
            alias: {
              '@webspatial/react-sdk/jsx-dev-runtime':
                '@webspatial/react-sdk/jsx-dev-runtime',
              '@webspatial/react-sdk/jsx-runtime':
                '@webspatial/react-sdk/jsx-runtime',
            },
          },
        }

        if (mode === AVP) {
          config.base = '/webspatial/avp/'
          config.server = {
            port: port + 1,
          }
          config.define['window.XR_ENV'] = "'avp'"
          config.resolve.alias['@webspatial/react-sdk'] =
            '@webspatial/react-sdk/default'
        } else {
          config.server = {
            port: port,
            proxy: {
              '/webspatial/avp': {
                target: `http://localhost:${port + 1}`,
                changeOrigin: true,
              },
            },
          }
          config.resolve.alias['@webspatial/react-sdk'] =
            '@webspatial/react-sdk/web'
        }

        return config
      },
    },
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
      // apply: 'build',
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
