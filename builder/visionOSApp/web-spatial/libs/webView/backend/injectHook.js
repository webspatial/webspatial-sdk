;(function () {
  const sendMsg = msg => {
    try {
      //@ts-ignore
      window.webkit.messageHandlers.bridge.postMessage(JSON.stringify(msg))
    } catch (error) {
      console.error(error)
    }
  }

  if (window.opener) {
    document.addEventListener('DOMContentLoaded', async () => {
      try {
        // @ts-ignore
        if (typeof window.customHookForEntry === 'function') {
          // @ts-ignore
          const ans = await window.customHookForEntry()

          // window._webSpatialID must already exist, no need to check
          // @ts-ignore
          let windowID = window._webSpatialID
          sendMsg({
            command: 'scene',
            data: {
              sceneData: {
                method: 'setConfig',
                sceneName: windowID, // specialKEY
                sceneConfig: ans,
              },
            },
            requestID: -2,
          })

          sendMsg({
            command: 'scene',
            data: {
              sceneData: {
                method: 'open',
                sceneName: windowID,
                url: '',
                windowID: windowID,
              },
            },
            requestID: -3,
          })
          // todo: sceneMgr.getConfig() should not include these dynamic one
        } else {
          // console.error('window.customHookForEntry is not a function')
          sendMsg({
            command: 'scene',
            data: {
              sceneData: {
                method: 'open',
                sceneName: '_HOOK_NOT_FOUND',
                // we pass a name that not exist to fallback to defaultConfig
                url: '',
                // @ts-ignore
                windowID: window._webSpatialID,
              },
            },
            requestID: -3,
          })
        }
      } catch (error) {
        console.error(
          'Error executing customHookForEntry or sending ans:',
          error,
        )
      }
    })
  }
})()
