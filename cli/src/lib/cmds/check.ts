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
  if (!(args['i'] && args['u']) || !(args['k'] && args['a'])) {
    throw new Error('-i and -u or -k and -a is required')
  }
}
