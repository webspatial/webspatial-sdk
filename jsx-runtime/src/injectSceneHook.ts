import { defaultSceneConfig, XRApp } from '@xrsdk/react'

export function injectSceneHook() {
  if (window.opener) {
    // see this flag, we have done create the root scene
    if ((window as any)._SceneHookOff) return
    document.addEventListener('DOMContentLoaded', async () => {
      try {
        if (typeof (window as any).xrCurrentSceneDefaults === 'function') {
          const ans = await (window as any).xrCurrentSceneDefaults?.()

          await XRApp.getInstance().show((window as any)._webSpatialID, ans)
        } else {
          await XRApp.getInstance().show(
            (window as any)._webSpatialID,
            defaultSceneConfig,
          )
        }
      } catch (error: any) {
        ;(window as any).hehe = error.message
        console.error(
          'Error executing xrCurrentSceneDefaults or sending ans:',
          error,
        )
      }
    })
  }
}
