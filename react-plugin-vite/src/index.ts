import { PluginOption } from 'vite'
import {
  AVP,
  getDefineByMode,
  getEnv,
  getFinalBase,
  getFinalOutdir,
  getReactSDKAliasByMode,
} from '@webspatial/shared'
interface WebSpatialOptions {
  // XR_ENV
  mode?: 'avp'

  // base path
  outputDir?: string
}
export default function (options: WebSpatialOptions = {}): PluginOption[] {
  let mode = options?.mode ?? getEnv()
  let outputDir = options?.outputDir
  console.log('🚀 ~ mode:', mode)
  return [
    {
      name: 'vite-plugin-webspatial-serve',
      apply: 'serve',
      config: userCfg => {
        const userBase = userCfg.base
        const finalBase = getFinalBase(userBase, mode, outputDir)
        console.log('🚀 ~ finalBase:', finalBase)
        const config: any = {
          define: {},
          resolve: {
            alias: {},
          },
        }
        config.base = finalBase
        config.resolve.alias = getReactSDKAliasByMode(mode)
        config.define = getDefineByMode(mode)

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
      apply: 'build',
      config: (config, { command }) => {
        const userOutDir = config.build?.outDir
        const xrEnv = getEnv()
        const userBase = config.base
        const finalBase = getFinalBase(userBase, mode, outputDir)
        const finalOutdir = getFinalOutdir(userOutDir, xrEnv, outputDir)

        return {
          base: finalBase,
          resolve: {
            alias: {
              ...getReactSDKAliasByMode(mode),
            },
          },
          define: {
            // Define environment variables for both Node and browser
            ...getDefineByMode(mode),
          },
          build: {
            // Set output directory
            outDir: finalOutdir,
            // Do not empty the output directory for AVP build
            emptyOutDir: xrEnv !== AVP,
            // Remove custom rollup naming logic; use Vite defaults
          },
        }
      },
    },
  ]
}
