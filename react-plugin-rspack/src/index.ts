import { Compiler, DefinePlugin } from '@rspack/core'
import {
  AVP,
  getDefineByMode,
  getEnv,
  getFinalBase,
  getFinalOutdir,
  getReactSDKAliasByMode,
  ModeKind,
} from '@webspatial/shared'
import path from 'node:path'

export interface WebSpatialOptions {
  mode?: ModeKind
  outputDir?: string
}

export default class WebSpatialRspackPlugin {
  private options: WebSpatialOptions
  constructor(options: WebSpatialOptions = {}) {
    this.options = options
  }

  apply(compiler: Compiler) {
    const mode = this.options.mode ?? getEnv()
    const outputDir = this.options.outputDir
    console.log('[WebSpatialRspackPlugin] mode:', mode)

    // DefinePlugin
    compiler.options.plugins = compiler.options.plugins || []
    compiler.options.plugins.push(new DefinePlugin(getDefineByMode(mode)))

    let userBase = compiler.options.output.publicPath
    if (userBase === 'auto') {
      userBase = undefined
    }

    const finalBase = getFinalBase(userBase as any, mode, outputDir) ?? ''
    console.log('[WebSpatialRspackPlugin] finalBase:', finalBase)
    const userOutDir = compiler.options.output?.path
    const finalOutdir = path.resolve(
      getFinalOutdir(userOutDir, mode, outputDir),
    )
    console.log('[WebSpatialRspackPlugin] finalOutdir:', finalOutdir)

    // run
    compiler.hooks.beforeRun.tap('WebSpatialRspackPlugin', () => {
      // set publicPath
      if (compiler.options.output) {
        compiler.options.output.publicPath = finalBase
      } else {
        compiler.options.output = { publicPath: finalBase }
      }

      // set alias
      compiler.options.resolve = compiler.options.resolve || {}
      compiler.options.resolve.alias = {
        ...compiler.options.resolve.alias,
        ...getReactSDKAliasByMode(mode),
      }
    })

    // build
    compiler.hooks.beforeCompile.tap('WebSpatialRspackPluginBuild', () => {
      // set output publicPath and dist path
      if (compiler.options.output) {
        compiler.options.output.publicPath = finalBase
        compiler.options.output.path = finalOutdir
      }

      // set alias
      compiler.options.resolve.alias = {
        ...compiler.options.resolve.alias,
        ...getReactSDKAliasByMode(mode),
      }

      // clean dist when web version
      ;(compiler.options as any).clean = mode !== AVP
    })

    compiler.hooks.done.tap('WebSpatialRspackPlugin', () => {
      // only run when devServer up
      if (process.env.WEBPACK_SERVE) {
        // get devServer port, fallback to 8080
        const port =
          //@ts-ignore
          (compiler.options.devServer && compiler.options.devServer.port) ||
          8080
        console.log(
          `\n [WebSpatialRspackPlugin]  service running: http://localhost:${port}${finalBase}\n`,
        )
      }
    })
  }
}
