import { PluginOption, UserConfig, mergeConfig } from 'vite'
import {
  AVP,
  getDefineByMode,
  getDefineXrEnvBase,
  getEnv,
  getFinalBase,
  getFinalOutdir,
  getReactSDKAliasReplacementByMode,
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
      name: 'vite-plugin-webspatial-common',
      config: config => {
        const myConfig: UserConfig = {
          esbuild: {
            jsxImportSource:
              mode === 'avp'
                ? '@webspatial/react-sdk/default'
                : '@webspatial/react-sdk/web',
          },
        }
        const finalConfig = mergeConfig(config, myConfig)

        return finalConfig
      },
    },
    {
      name: 'vite-plugin-webspatial-serve',
      apply: 'serve',
      config: userCfg => {
        const userBase = userCfg.base
        const finalBase = getFinalBase(userBase, mode, outputDir)
        console.log('🚀 ~ finalBase:', finalBase)
        const userOutDir = userCfg.build?.outDir
        const finalOutdir = getFinalOutdir(userOutDir, mode, outputDir)
        const config: UserConfig = {
          define: {},
          resolve: {
            alias: [getReactSDKAliasReplacementByMode(mode)],
          },
          build: {
            // Set output directory
            outDir: finalOutdir,
          },
        }
        config.base = finalBase
        config.define = {
          // Define environment variables for both Node and browser
          ...getDefineByMode(mode),
          ...getDefineXrEnvBase(finalBase),
        }

        console.log('🚀 ~ config:', config)
        return config
      },
    },

    {
      name: 'vite-plugin-webspatial-build',
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
            alias: [getReactSDKAliasReplacementByMode(mode)],
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
