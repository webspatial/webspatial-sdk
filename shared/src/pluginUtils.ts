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
  outputDir: string = 'webspatial/avp',
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
  pluginOutputDir: string = 'webspatial/avp',
) {
  if (mode === 'avp') {
    return `${userOutDir}/${pluginOutputDir}`
  }

  // web version
  return userOutDir
}
