import { version } from '@webspatial/core-sdk'

export function injectVersionInfo(env?: string) {
  if (typeof window !== 'undefined' && !window.__webspatialsdk__) {
    // prevent re-entry if __webspatialsdk__ is defined
    if (!env) env = (process.env.XR_ENV || import.meta.XR_ENV) ?? 'unknown'

    window.__webspatialsdk__ = {
      XR_ENV: env,
      'react-sdk-version': __reactsdkversion__,
      'core-sdk-version': version,
    }
  }
}

export function getClientVersion() {
  return __reactsdkversion__
}
