import { defaultSceneConfig, XRApp } from '@xrsdk/react'

export function injectSceneHook() {
  const sendMsg = (msg: any) => {
    try {
      //@ts-ignore
      window.webkit.messageHandlers.bridge.postMessage(JSON.stringify(msg))
    } catch (error) {
      console.error(error)
    }
  }
  if (window.opener) {
    // see this flag, we have done create the root scene
    if ((window as any)._SceneHookOff) return
    document.addEventListener('DOMContentLoaded', async () => {
      try {
        if (typeof (window as any).xrCurrentSceneDefaults === 'function') {
          const ans = await (window as any).xrCurrentSceneDefaults?.()

          // raw version of await XRApp.getInstance().show((window as any)._webSpatialID, ans)

          sendMsg({
            command: 'createWindowGroup',
            data: {
              windowStyle: 'Plain',
              sceneData: {
                method: 'showRoot',
                sceneConfig: ans,
                windowID: (window as any)._webSpatialID,
              },
            },
            requestID: -3,
          })
        } else {
          // raw version of await XRApp.getInstance().show(window, defaultSceneConfig)
          sendMsg({
            command: 'createWindowGroup',
            data: {
              windowStyle: 'Plain',
              sceneData: {
                method: 'showRoot',
                sceneConfig: defaultSceneConfig,
                windowID: (window as any)._webSpatialID,
              },
            },
            requestID: -3,
          })
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
