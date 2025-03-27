// nextjs-webspatial-plugin.ts
import type { Configuration as WebpackConfig } from 'webpack'
import { AVP, getEnv } from './shared'

interface WebSpatialOptions {
  mode?: 'avp'
}

export default function withWebspatial<
  T extends {
    webpack?: (config: WebpackConfig, context: any) => WebpackConfig
    distDir?: string
    basePath?: string
  } = {},
>(options: WebSpatialOptions = {}) {
  const mode = options.mode ?? getEnv()
  console.log('🚀 ~ mode:', mode)

  return (
    config?: T,
  ): T & {
    webpack: (config: WebpackConfig, context: any) => WebpackConfig
    distDir: string
    basePath: string
  } => {
    const distDir = config?.distDir ?? '.next'
    const basePath = config?.basePath ?? ''

    const finalConfig = {
      ...config,
      webpack: (webpackConfig: WebpackConfig, context: any) => {
        let modifiedConfig = webpackConfig
        if (config && typeof config.webpack === 'function') {
          modifiedConfig = config.webpack(modifiedConfig, context)
        }
        modifiedConfig.plugins = modifiedConfig.plugins || []

        // env
        const xrEnv = mode === AVP ? AVP : ''
        modifiedConfig.plugins.push(
          new (require('webpack').DefinePlugin)({
            'process.env.XR_ENV': JSON.stringify(xrEnv),
            'window.XR_ENV': JSON.stringify(xrEnv),
          }),
        )

        // conditionNames
        modifiedConfig.plugins.push(new ModifyResolveConditionNamesPlugin())

        // alias for different target
        modifiedConfig.resolve = modifiedConfig.resolve || {}
        modifiedConfig.resolve.alias = {
          ...(modifiedConfig.resolve.alias || {}),
          '@webspatial/react-sdk$':
            mode === AVP
              ? '@webspatial/react-sdk/default'
              : '@webspatial/react-sdk/web',
        }
        return modifiedConfig
      },
      distDir: mode === AVP ? `${distDir}/webspatial/avp` : distDir,
      basePath: mode === AVP ? `${basePath}/webspatial/avp` : basePath,
    }

    return finalConfig as T & {
      webpack: (config: WebpackConfig, context: any) => WebpackConfig
      distDir: string
      basePath: string
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
