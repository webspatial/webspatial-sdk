import { ParsedArgs } from 'minimist'
export function checkBuildParams(args: ParsedArgs, isDev: boolean = false) {
  if (args['manifest'] && args['manifest-url']) {
    throw new Error(
      '--manifest and --manifest-url cannot be used at the same time',
    )
  }
  if (!args['teamId'] && !isDev) {
    throw new Error('--teamId is required')
  }
  if (!args['url-root']) {
    throw new Error('--url-root is required')
  }
}

export function checkStoreParams(args: ParsedArgs) {
  if (!(args['u'] && args['p'])) {
    throw new Error('--u and --p is required')
  }
  if (!args['version']) {
    throw new Error('version is required')
  }
}
