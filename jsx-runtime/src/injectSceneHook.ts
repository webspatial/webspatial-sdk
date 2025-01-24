import { defaultSceneConfig, getSession, XRApp } from '@xrsdk/react'

export function injectSceneHook() {
  if (!window.opener) return
  if ((window as any)._SceneHookOff) return

  // getSession()?.setLoading('show')

  // see this flag, we have done create the root scene
  document.addEventListener('DOMContentLoaded', async () => {
    let cfg = defaultSceneConfig
    if (typeof (window as any).xrCurrentSceneDefaults === 'function') {
      try {
        cfg = await (window as any).xrCurrentSceneDefaults?.()
      } catch (error) {
        console.error(error)
      }
    }
    // await getSession()?.setLoading('hide')
    await XRApp.getInstance().show((window as any)._webSpatialID, cfg)
  })
}
