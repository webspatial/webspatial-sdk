import { defaultSceneConfig, XRApp, getSession } from '@webspatial/react-sdk'

export async function injectSceneHook() {
  let isDynamicRoot = (window as any)._isDynamicRoot

  if (!window.opener && !isDynamicRoot) return
  if ((window as any)._SceneHookOff) return

  await createRoot()
  await showLoading()

  await onContentLoaded()

  let cfg = defaultSceneConfig

  // run hook to get sceneDefaults
  if (typeof (window as any).xrCurrentSceneDefaults === 'function') {
    try {
      cfg = await (window as any).xrCurrentSceneDefaults?.()
    } catch (error) {
      console.error(error)
    }
  }

  // make sure we are ready to show scene
  await ensureDoneCheck(
    () =>
      (window as any)._webSpatialGroupID &&
      (window as any)._webSpatialParentGroupID,
  )

  await XRApp.getInstance().show(window, cfg) // showRoot

  // delay for what?
  await new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(null)
    }, 800)
  })

  await hideLoading()

  // dismiss root scene
  // await getSession()

  //\\\\\\\\\\\\\\\
  // helpers
  //\\\\\\\\\\\\\\\\

  async function createRoot() {
    if (isDynamicRoot) {
      // this is a dynamic root
      // create wrapper for it
      await XRApp.getInstance().moveECIntoNewContainer()
    } else {
      // already created
    }
  }

  async function showLoading() {
    if (isDynamicRoot) {
      // already loading
    } else {
      await getSession()?.setLoading('show')
    }
  }

  async function hideLoading() {
    if (isDynamicRoot) {
      await XRApp.getInstance().closeRootScene()
    } else {
      await getSession()?.setLoading('hide')
    }
  }

  function onContentLoaded() {
    return new Promise(resolve => {
      if (
        document.readyState === 'interactive' ||
        document.readyState === 'complete'
      ) {
        resolve(null)
      } else {
        document.addEventListener('DOMContentLoaded', resolve)
      }
    })
  }

  // a promise wrapper of checkDone
  async function ensureDoneCheck(condition) {
    return new Promise(resolve => {
      checkDone(condition, resolve)
    })
  }

  async function checkDone(condition, next) {
    if (!condition()) {
      await new Promise(resolve => {
        setTimeout(resolve, 100)
      })
      checkDone(condition, next)
    } else {
      next()
    }
  }
}
