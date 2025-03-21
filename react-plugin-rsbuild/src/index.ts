// plugins/webspatial.ts
import type { RsbuildPlugin } from '@rsbuild/core'
import { AVP, getEnv } from './shared'

interface WebspatialOptions {
  mode?: string
  port?: number
}

export default function webspatialPlugin(
  options?: WebspatialOptions,
): RsbuildPlugin {
  const { mode = getEnv(), port = 3000 } = options ?? {}
  const isAVP = mode === AVP
  console.log('🚀 ~ mode:', mode)

  return {
    name: 'webspatial-plugin',
    setup(api) {
      // server
      api.modifyRsbuildConfig(config => {
        config.server = config.server || {}
        config.server.base = isAVP ? '/webspatial/avp' : '/'
        config.server.port = isAVP ? port + 1 : port
        if (!isAVP) {
          config.server.proxy = {
            '/webspatial/avp': {
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
        config.source = config.source || {}
        config.source.alias = {
          '@webspatial/react-sdk': isAVP
            ? '@webspatial/react-sdk/default'
            : '@webspatial/react-sdk/web',
        }
        // fixme: this will be override by server in front
        config.source.define = {
          'process.env.XR_ENV': JSON.stringify(xrEnv),
          'import.meta.env.XR_ENV': JSON.stringify(xrEnv),
        }
        return config
      })

      // output
      api.modifyRsbuildConfig(config => {
        config.output = config.output || {}
        config.output.distPath = {
          root: isAVP ? 'dist/webspatial/avp' : 'dist',
        }
        return config
      })
    },
  }
}
