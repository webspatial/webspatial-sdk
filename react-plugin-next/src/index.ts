// nextjs-webspatial-plugin.ts
import type { Configuration as WebpackConfig } from 'webpack'
import {
  addFirstSlash,
  AVP,
  getDefineByMode,
  getEnv,
  getFinalBase,
  getFinalOutdir,
  getReactSDKAliasByMode,
} from '@webspatial/shared'

interface WebSpatialOptions {
  mode?: 'avp'
  outputDir?: string
}

export default function withWebspatial<
  T extends {
    webpack?: (config: WebpackConfig, context: any) => WebpackConfig
    distDir?: string
    basePath?: string
  } = {},
>(options: WebSpatialOptions = {}) {
  const mode = options.mode ?? getEnv()
  const outputDir = options.outputDir
  console.log('🚀 ~ mode:', mode)

  return (
    config?: T,
  ): T & {
    webpack: (config: WebpackConfig, context: any) => WebpackConfig
    distDir: string
    basePath: string
  } => {
    const distDir = config?.distDir ?? '.next'
    const basePath = config?.basePath

    const finalBasePath = addFirstSlash(getFinalBase(basePath, mode, outputDir))
    console.log('🚀 ~ finalBasePath:', finalBasePath)

    const finalDistDir = getFinalOutdir(distDir, mode, outputDir)
    console.log('🚀 ~ finalDistDir:', finalDistDir)

    const finalConfig = {
      ...config,
      webpack: (webpackConfig: WebpackConfig, context: any) => {
        let modifiedConfig = webpackConfig
        if (config && typeof config.webpack === 'function') {
          modifiedConfig = config.webpack(modifiedConfig, context)
        }
        modifiedConfig.plugins = modifiedConfig.plugins || []

        // env define
        modifiedConfig.plugins.push(
          new (require('webpack').DefinePlugin)({
            ...getDefineByMode(mode),
          }),
        )

        // conditionNames
        modifiedConfig.plugins.push(new ModifyResolveConditionNamesPlugin())

        // alias for different target
        modifiedConfig.resolve = modifiedConfig.resolve || {}
        modifiedConfig.resolve.alias = {
          ...(modifiedConfig.resolve.alias || {}),
          ...getReactSDKAliasByMode(mode),
        }
        return modifiedConfig
      },
      distDir: finalDistDir,
      basePath: finalBasePath,
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
