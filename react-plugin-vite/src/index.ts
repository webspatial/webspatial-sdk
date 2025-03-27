import { PluginOption } from 'vite'
import { AVP, getEnv, getFinalBase, getFinalOutdir } from './shared'
interface WebSpatialOptions {
  // XR_ENV
  mode?: 'avp'

  // base path
  outputDir?: string
}
export default function (options: WebSpatialOptions = {}): PluginOption[] {
  let mode = options?.mode ?? getEnv()
  let outputDir = options?.outputDir ?? '/webspatial/avp/'
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
            alias: {
              '@webspatial/react-sdk/jsx-dev-runtime':
                '@webspatial/react-sdk/jsx-dev-runtime',
              '@webspatial/react-sdk/jsx-runtime':
                '@webspatial/react-sdk/jsx-runtime',
            },
          },
        }
        config.base = finalBase
        if (mode === AVP) {
          config.define['window.XR_ENV'] = "'avp'"
          config.resolve.alias['@webspatial/react-sdk'] =
            '@webspatial/react-sdk/default'
        } else {
          config.resolve.alias['@webspatial/react-sdk'] =
            '@webspatial/react-sdk/web'
        }

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
        const isAVP = xrEnv === AVP
        const userBase = config.base
        const finalBase = getFinalBase(userBase, mode, outputDir)
        const finalOutdir = getFinalOutdir(userOutDir, xrEnv, outputDir)

        return {
          base: finalBase,
          resolve: {
            alias: [
              {
                // Use default or web version based on the environment
                find: /^@webspatial\/react-sdk$/,
                replacement: isAVP
                  ? '@webspatial/react-sdk/default'
                  : '@webspatial/react-sdk/web',
              },
            ],
          },
          define: {
            // Define environment variables for both Node and browser
            'process.env.XR_ENV': JSON.stringify(xrEnv),
            'import.meta.env.XR_ENV': JSON.stringify(xrEnv),
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
