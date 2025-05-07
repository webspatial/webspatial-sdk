import { validateURL } from '../pwa/validate'
export function checkBuildParams(args: any, isDev: boolean = false) {
  if (args['manifest'] && args['manifest-url']) {
    throw new Error(
      '--manifest and --manifest-url cannot be used at the same time',
    )
  }
  if (!args['teamId'] && !isDev) {
    throw new Error('--teamId is required')
  }
  if (args['base']) {
    if (validateURL(args['base'])) {
      try {
        const baseUrl = new URL(args['base'])
        if (baseUrl.search || baseUrl.hash) {
          throw new Error(
            'The base parameter must be a path or url and cannot contain parameters or suffixes.',
          )
        }
      } catch (e) {
        throw new Error(
          'The base parameter must be a path or url and cannot contain parameters or suffixes.',
        )
      }
    } else {
      const pathRegex = /(\?.*|\.\w+|#.*)$/
      const pathPart = args['base'].split('/').pop() || ''
      if (pathRegex.test(pathPart)) {
        throw new Error(
          'The base parameter must be a path or url and cannot contain parameters or suffixes.',
        )
      }
    }
  }
}

export function checkStoreParams(args: any) {
  if (!(args['u'] && args['p'])) {
    throw new Error('--u and --p is required')
  }
  if (!args['version']) {
    throw new Error('version is required')
  }
}
