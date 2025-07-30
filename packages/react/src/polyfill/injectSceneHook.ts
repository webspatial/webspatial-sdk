import { SpatialScene } from '@webspatial/core-sdk'
//@ts-ignore
import { defaultSceneConfig } from '@webspatial/react-sdk'

export async function injectSceneHook() {
  if (!window.opener) return
  if ((window as any)._SceneHookOff) return

  // see this flag, we have done create the root scene

  function onContentLoaded(callback: any) {
    if (
      document.readyState === 'interactive' ||
      document.readyState === 'complete'
    ) {
      callback()
    } else {
      document.addEventListener('DOMContentLoaded', callback)
    }
  }

  onContentLoaded(async () => {
    let cfg = defaultSceneConfig
    if (typeof (window as any).xrCurrentSceneDefaults === 'function') {
      try {
        cfg = await (window as any).xrCurrentSceneDefaults?.()
      } catch (error) {
        console.error(error)
      }
    }
    // fixme: this duration is too short so that hide and show is at racing, so add a little delay to avoid
    await new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve(null)
      }, 1000)
    })
    await SpatialScene.getInstance().updateSceneConfig(cfg)
  })
}
