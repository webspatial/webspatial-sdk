// plugins/webspatial.ts
import type { RsbuildPlugin } from '@rsbuild/core'
import { AVP, getEnv } from './shared'

interface WebspatialOptions {
  // base path
  base?: string

  // running mode
  mode?: string
  // server port
  port?: number
}

export default function webspatialPlugin(
  options?: WebspatialOptions,
): RsbuildPlugin {
  let { mode = getEnv(), port = 3000, base = '/' } = options ?? {}
  const isAVP = mode === AVP

  if (base.endsWith('/')) {
    base = base.slice(0, base.length - 1)
  }

  let AVP_PATH = base + '/webspatial/avp'

  return {
    name: 'webspatial-plugin',
    setup(api) {
      // server
      api.modifyRsbuildConfig(config => {
        config.server = config.server || {}
        config.dev = config.dev ?? {}
        config.server.base = isAVP ? AVP_PATH : '/'
        config.server.port = isAVP ? port + 1 : port
        if (isAVP) {
          config.dev.assetPrefix = AVP_PATH
        } else {
          config.server.proxy = {
            [`${AVP_PATH}`]: {
              target: `http://localhost:${port + 1}`,
              changeOrigin: true,
            },
          }
        }

        return config
      })

      // alias
      api.modifyRsbuildConfig(config => {
        const xrEnv = getEnv()

        config.resolve = config.resolve ?? {}
        config.resolve.alias = {
          //! only set root import
          '@webspatial/react-sdk$': isAVP
            ? '@webspatial/react-sdk/default'
            : '@webspatial/react-sdk/web',
        }
        // define
        config.source = config.source || {}
        config.source.define = {
          'process.env.XR_ENV': JSON.stringify(xrEnv),
          'import.meta.env.XR_ENV': JSON.stringify(xrEnv),
        }
        return config
      })

      // output
      api.modifyRsbuildConfig(config => {
        config.output = config.output || {}
        if (isAVP) {
          config.output.assetPrefix = AVP_PATH
        }
        config.output.distPath = {
          root: isAVP ? 'dist/webspatial/avp' : 'dist',
        }
        return config
      })
    },
  }
}
