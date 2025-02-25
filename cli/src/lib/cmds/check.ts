import { ParsedArgs } from 'minimist'
export function checkBuildParams(args: ParsedArgs) {
  if (!args['manifest'] && !args['manifest-url']) {
    throw new Error('manifest or manifest-url is required')
  }
  if (args['manifest'] && args['manifest-url']) {
    throw new Error('manifest and manifest-url cannot be used at the same time')
  }
  if (!args['teamId']) {
    throw new Error('teamId is required')
  }
}

export function checkStoreParams(args: ParsedArgs) {
  if (!args['name']) {
    throw new Error('name is required')
  }
  if (!(args['u'] && args['p']) || !(args['k'] && args['i'])) {
    throw new Error('u and p or k and i is required')
  }
}
