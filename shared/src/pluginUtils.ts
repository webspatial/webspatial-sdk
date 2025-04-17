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
  pluginOutputDir: string = '/webspatial/avp',
) {
  if (mode === 'avp') {
    if (userBase !== undefined) {
      return userBase
    } else {
      return pluginOutputDir
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

export function addFirstSlash(input?: string) {
  if (input === undefined || input.length === 0) return ''
  if (input[0] !== '/') return '/' + input
  return input
}

export function removeFirstSlash(input?: string) {
  if (input === undefined) return ''

  let idx = 0
  while (idx < input.length && input[idx] === '/') {
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

export function getReactSDKAliasReplacementByMode(mode?: ModeKind) {
  if (mode === 'avp') {
    return {
      find: /^@webspatial\/react-sdk$/,
      replacement: '@webspatial/react-sdk/default',
    }
  }
  return {
    find: /^@webspatial\/react-sdk$/,
    replacement: '@webspatial/react-sdk/web',
  }
}

export function getJSXAliasByMode(mode?: ModeKind) {
  if (mode === 'avp') {
    return {
      '@webspatial/react-sdk/jsx-dev-runtime':
        '@webspatial/react-sdk/default/jsx-dev-runtime',
      '@webspatial/react-sdk/jsx-runtime':
        '@webspatial/react-sdk/default/jsx-runtime',
    }
  }
  return {
    '@webspatial/react-sdk/jsx-dev-runtime':
      '@webspatial/react-sdk/web/jsx-dev-runtime',
    '@webspatial/react-sdk/jsx-runtime':
      '@webspatial/react-sdk/web/jsx-runtime',
  }
}

export function getJSXImportSourceByMode(mode?: ModeKind) {
  if (mode === 'avp') {
    return '@webspatial/react-sdk/default'
  }
  return '@webspatial/react-sdk/web'
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

export function getDefineXrEnvBase(finalBase?: string) {
  return {
    __XR_ENV_BASE__: JSON.stringify(finalBase),
  }
}
