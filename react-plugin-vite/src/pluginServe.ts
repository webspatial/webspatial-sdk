import { Plugin, defineConfig } from 'vite'
import { injectProcessEnv } from './injectProcessEnv'
import { AVP, getEnv } from './shared'

interface WebSpatialOptions {
  // XR_ENV
  mode?: 'avp'
  // devServer port
  port?: number
}

export function pluginServe(options: WebSpatialOptions = {}): Plugin {
  return {
    name: 'vite-plugin-webspatial-serve',
    config: () => {
      let mode = options?.mode ?? getEnv()
      let port = options?.port ?? 3000
      const config: any = {
        plugins: [injectProcessEnv()],
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
  }
}
