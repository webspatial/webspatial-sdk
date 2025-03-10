import { Plugin } from 'vite'

declare function injectProcessEnv(): Plugin

export = injectProcessEnv
