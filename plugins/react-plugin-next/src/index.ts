// nextjs-webspatial-plugin.ts
import type { Configuration as WebpackConfig } from 'webpack'
import {
  addFirstSlash,
  AVP,
  getDefineByMode,
  getEnv,
  getFinalBase,
  getFinalOutdir,
  getJSXAliasByMode,
  getReactSDKAliasByMode,
  ModeKind,
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
  // console.log('🚀 ~ mode:', mode)

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
    // console.log('🚀 ~ finalBasePath:', finalBasePath)

    const finalDistDir = getFinalOutdir(distDir, mode, outputDir)
    // console.log('🚀 ~ finalDistDir:', finalDistDir)

    const finalConfig = {
      ...config,
      experimental: {
        turbo: {
          root: '..', // https://github.com/vercel/next.js/issues/71886
          resolveAlias: {
            ...getJSXAliasByMode(mode),
            ...getReactSDKAliasByMode(mode),
          },
        },
      },
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

        if (context.dev) {
          modifiedConfig.plugins.push(
            new PrintDevInfoPlugin({ mode, finalBasePath, finalDistDir }),
          )
        }

        // conditionNames
        modifiedConfig.plugins.push(new ModifyResolveConditionNamesPlugin())

        // alias for different target
        modifiedConfig.resolve = modifiedConfig.resolve || {}
        modifiedConfig.resolve.alias = {
          ...(modifiedConfig.resolve.alias || {}),
          ...getJSXAliasByMode(mode),
          ...getReactSDKAliasByMode(mode),
        }
        return modifiedConfig
      },
      distDir: finalDistDir,
      basePath: finalBasePath,
    }

    return finalConfig as T & {
      webpack: (config: WebpackConfig, context: any) => WebpackConfig
      experimental: any
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

class PrintDevInfoPlugin {
  private static hasPrinted = false
  finalBasePath: string
  finalDistDir: string
  mode: ModeKind
  constructor(props: {
    finalBasePath: string
    mode: ModeKind
    finalDistDir: string
  }) {
    this.finalBasePath = props.finalBasePath
    this.finalDistDir = props.finalDistDir
    this.mode = props.mode
  }
  apply(compiler: any) {
    compiler.hooks.done.tap('WebspatialURLPlugin', () => {
      if (
        compiler.options.name === 'client' &&
        !PrintDevInfoPlugin.hasPrinted
      ) {
        console.log('[WebSpatialNextjsPlugin]  mode:', this.mode)
        console.log(
          '[WebSpatialNextjsPlugin] finalBasePath:',
          this.finalBasePath,
        )

        console.log('[WebSpatialNextjsPlugin] finalDistDir:', this.finalDistDir)

        let port = process.env.PORT ? Number(process.env.PORT) : 3000
        const argv = process.argv
        const idx = argv.findIndex(v => v === '-p' || v === '--port')
        if (idx !== -1 && argv[idx + 1]) {
          port = Number(argv[idx + 1])
        }
        console.log(
          `[WebSpatialNextjsPlugin] > Dev URL: http://localhost:${port}${this.finalBasePath}`,
        )
        PrintDevInfoPlugin.hasPrinted = true
      }
    })
  }
}
