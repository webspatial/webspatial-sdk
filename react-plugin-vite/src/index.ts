import { PluginOption } from 'vite'
import { pluginServe } from './pluginServe'
import { injectProcessEnv } from './injectProcessEnv'

export default function (): PluginOption[] {
  return [injectProcessEnv(), pluginServe()]
}
