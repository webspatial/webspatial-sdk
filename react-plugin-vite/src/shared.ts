const AVP = 'avp'
function getEnv(): ModeKind {
  const env = process.env.XR_ENV
  return env === 'avp' ? 'avp' : undefined
}

type ModeKind = 'avp' | undefined

export { getEnv, AVP }

export function getFinalBase(
  userBase: string | undefined,
  mode: ModeKind,
  outputDir?: string,
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
  pluginOutputDir?: string,
) {
  if (mode === 'avp') {
    return `${userOutDir}/${pluginOutputDir}`
  }

  // web version
  return userOutDir
}
