const AVP = 'avp'
function getEnv(): ModeKind {
  const env = process.env.XR_ENV
  return env === 'avp' ? 'avp' : undefined
}

export type ModeKind = 'avp' | undefined

export { getEnv, AVP }

export function getFinalBase(
  userBase: string | undefined,
  mode: ModeKind,
  outputDir: string = '/webspatial/avp',
) {
  if (mode === 'avp') {
    if (userBase !== undefined) {
      return userBase
    } else {
      return outputDir
    }
  }

  // web version
  return userBase
}

export function getFinalOutdir(
  userOutDir: string | undefined = 'dist',
  mode: ModeKind,
  pluginOutputDir: string = '/webspatial/avp',
) {
  if (mode === 'avp') {
    pluginOutputDir = removeFirstSlash(pluginOutputDir)
    return `${userOutDir}/${pluginOutputDir}`
  }

  // web version
  return userOutDir
}

export function removeFirstSlash(input?: string) {
  if (input === undefined) return ''

  let idx = 0
  while (input.length > 0 && input[idx] === '/') {
    idx += 1
  }
  return input.slice(idx)
}

export function getReactSDKAliasByMode(mode?: ModeKind) {
  if (mode === 'avp') {
    return { '@webspatial/react-sdk$': '@webspatial/react-sdk/default' }
  }
  return { '@webspatial/react-sdk$': '@webspatial/react-sdk/web' }
}

export function getDefineByMode(mode?: ModeKind) {
  if (mode === 'avp') {
    return {
      'window.XR_ENV': JSON.stringify('avp'),
      'process.env.XR_ENV': JSON.stringify('avp'),
      'import.meta.env.XR_ENV': JSON.stringify('avp'),
    }
  }
  return {
    'window.XR_ENV': undefined,
    'process.env.XR_ENV': undefined,
    'import.meta.env.XR_ENV': undefined,
  }
}
