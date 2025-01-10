//@ts-nocheck
;(function () {
  const sendMsg = msg => {
    // we should send message to parent swc
    window.opener.webkit.messageHandlers.bridge.postMessage(JSON.stringify(msg))
  }

  if (!window.opener) return // if no parent, do nothing
  document.addEventListener('DOMContentLoaded', async () => {
    try {
      // 检查 customHookForEntry 是否存在
      if (typeof window.customHookForEntry === 'function') {
        sendMsg({
          command: 'scene',
          data: {
            sceneData: {
              method: 'test',
            },
          },
          requestID: -1,
        })
        const ans = await window.customHookForEntry()

        let windowID = window._webSpatialID
        sendMsg({
          command: 'scene',
          data: {
            sceneData: {
              method: 'setConfig',
              sceneName: windowID, // specialKEY
              // url, // not used
              // windowID: windowID,
              sceneConfig: ans,
            },
          },
          requestID: -2,
        })

        setTimeout(() => {
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
        }, 0)
        // todo: sceneMgr.getConfig() should not include these dynamic one
      } else {
        // console.error('window.customHookForEntry is not a function')
        sendMsg({
          command: 'scene',
          data: {
            sceneData: {
              method: 'open',
              sceneName: '_HOOK_NOT_FOUND',
              url: '',
              windowID: window._webSpatialID,
            },
          },
          requestID: -3,
        })
      }
    } catch (error) {
      console.error('Error executing customHookForEntry or sending ans:', error)
    }
  })
})()
