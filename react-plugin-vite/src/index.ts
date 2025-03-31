import { PluginOption } from 'vite'
import {
  AVP,
  getDefineByMode,
  getDefineXrEnvBase,
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
        const userOutDir = userCfg.build?.outDir
        const finalOutdir = getFinalOutdir(userOutDir, mode, outputDir)
        const config: any = {
          define: {},
          resolve: {
            alias: {},
          },
          build: {
            // Set output directory
            outDir: finalOutdir,
          },
        }
        config.base = finalBase
        config.resolve.alias = getReactSDKAliasByMode(mode)
        config.define = {
          // Define environment variables for both Node and browser
          ...getDefineByMode(mode),
          ...getDefineXrEnvBase(finalBase),
        }

        return config
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
            ...getDefineXrEnvBase(finalBase),
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
