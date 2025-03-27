// nextjs-webspatial-plugin.ts
import type { NextConfig } from 'next'
import { Configuration as WebpackConfig } from 'webpack'
import { AVP, getEnv } from './shared'

interface WebSpatialOptions {
  mode?: 'avp'
}

export default function withWebspatial(
  options: WebSpatialOptions = {},
): (nextConfig: NextConfig) => NextConfig {
  const mode = options?.mode ?? getEnv()
  console.log('🚀 ~ mode:', mode)

  return (nextConfig: NextConfig = {}) => {
    let distDir = nextConfig.distDir ?? '.next'
    let basePath = nextConfig.basePath ?? ''
    return {
      ...nextConfig,
      webpack: (config, context) => {
        // extends original webpack
        if (typeof nextConfig.webpack === 'function') {
          config = nextConfig.webpack(config, context)
        }
        config.plugins = config.plugins || []

        // set
        const xrEnv = mode === AVP ? AVP : ''
        config.plugins.push(
          new (require('webpack').DefinePlugin)({
            'process.env.XR_ENV': JSON.stringify(xrEnv),
            'window.XR_ENV': JSON.stringify(xrEnv),
          }),
        )

        // conditionNames plugin
        config.plugins.push(new ModifyResolveConditionNamesPlugin())

        // alias for react-sdk entry
        config.resolve = config.resolve || {}
        config.resolve.alias = {
          ...config.resolve.alias,
          '@webspatial/react-sdk$':
            mode === AVP
              ? '@webspatial/react-sdk/default'
              : '@webspatial/react-sdk/web',
        }

        return config
      },
      distDir: mode === AVP ? distDir + '/webspatial/avp' : distDir,
      basePath: mode === AVP ? `${basePath}/webspatial/avp` : basePath,
    }
  }
}

class ModifyResolveConditionNamesPlugin {
  apply(compiler: any) {
    compiler.hooks.afterEnvironment.tap(
      'ModifyResolveConditionNamesPlugin',
      () => {
        const isServer = compiler.options.name !== 'client'
        if (isServer) {
          compiler.options.resolve.conditionNames = [
            'react-server',
            ...(compiler.options.resolve.conditionNames || []),
          ]
        }
      },
    )
  }
}
