import { createSpatialSceneCommand, FocusScene } from './JSBCommand'
import { SpatialScene } from './SpatialScene'
import { SpatialSceneCreationOptions, SpatialSceneState } from './types/types'

const defaultSceneConfig: SpatialSceneCreationOptions = {
  defaultSize: {
    width: 900,
    height: 700,
  },
}

const INTERNAL_SCHEMA_PREFIX = 'webspatial://'
const originalOpen = window.open

class SceneManager {
  private static instance: SceneManager
  static getInstance() {
    if (!SceneManager.instance) {
      SceneManager.instance = new SceneManager()
    }
    return SceneManager.instance
  }

  init(window: WindowProxy) {
    ;(window as any).open = this.open
  }

  private configMap: Record<string, SpatialSceneCreationOptions> = {} // name=>config
  private getConfig(name?: string) {
    if (name === undefined || !this.configMap[name]) return undefined
    return this.configMap[name]
  }

  private open = (url?: string, target?: string, features?: string) => {
    // bypass internal
    if (url?.startsWith(INTERNAL_SCHEMA_PREFIX)) {
      return originalOpen(url, target, features)
    }

    // if target is special
    if (target === '_self' || target === '_parent' || target === '_top') {
      const newWindow = originalOpen(url, target, features)
      return newWindow
    }

    const cfg = target ? this.getConfig(target) : undefined
    const cmd = new createSpatialSceneCommand(url!, cfg, target, features)
    const result = cmd.executeSync()

    if (typeof target === 'string' && this.configMap[target]) {
      delete this.configMap[target]
    }

    const id = result.data?.id

    if (id) {
      // send JSB to focus
      let focusCmd = new FocusScene(id)
      focusCmd.execute()
    }

    return result.data?.windowProxy
  }
  initScene(
    name: string,
    callback: (pre: SpatialSceneCreationOptions) => SpatialSceneCreationOptions,
  ) {
    let rawReturnVal = callback({ ...defaultSceneConfig })
    this.configMap[name] = formatSceneConfig(rawReturnVal)
  }
}

function pxToMeter(px: number): number {
  return px / 1360
}

function meterToPx(meter: number): number {
  return meter * 1360
}

function formatToNumber(
  str: string | number,
  targetUnit: 'px' | 'm',
  defaultUnit: 'px' | 'm',
): number {
  if (typeof str === 'number') {
    if (
      (defaultUnit === 'px' && targetUnit === 'px') ||
      (defaultUnit === 'm' && targetUnit === 'm')
    ) {
      return str
    }
    // unit not match target
    if (defaultUnit === 'px' && targetUnit === 'm') {
      return pxToMeter(str)
    } else if (defaultUnit === 'm' && targetUnit === 'px') {
      return meterToPx(str)
    }
    // fallback
    return str
  }
  if (targetUnit === 'm') {
    if (str.endsWith('m')) {
      // 1m
      return Number(str.slice(0, -1))
    } else if (str.endsWith('px')) {
      // 100px
      return pxToMeter(Number(str.slice(0, -2)))
    } else {
      throw new Error('formatToNumber: invalid str')
    }
  } else if (targetUnit === 'px') {
    if (str.endsWith('px')) {
      // 100px
      return Number(str.slice(0, -2))
    } else if (str.endsWith('m')) {
      // 1m
      return meterToPx(Number(str.slice(0, -1)))
    } else {
      throw new Error('formatToNumber: invalid str')
    }
  } else {
    throw new Error('formatToNumber: invalid targetUnit')
  }
}

export function formatSceneConfig(config: SpatialSceneCreationOptions) {
  // defaultSize and resizability's width/height/depth can be 100 or "100px" or "1m"
  // expect:
  // resizability should format into px
  // defaultSize should format into px if window
  // defaultSize should format into m if volume

  const isWindow = config.type === 'window' || config.type === undefined

  // format resizability
  if (config.resizability) {
    const iterKeys = ['minWidth', 'minHeight', 'maxWidth', 'maxHeight']

    for (let k of iterKeys) {
      if ((config.resizability as any)[k]) {
        ;(config.resizability as any)[k] = formatToNumber(
          (config.resizability as any)[k],
          'px',
          isWindow ? 'px' : 'm',
        )
      }
    }
  }

  // format defaultSize
  if (config.defaultSize) {
    if (config.type === 'window' || config.type === undefined) {
      if (config.defaultSize.width) {
        config.defaultSize.width = formatToNumber(
          config.defaultSize.width,
          'px',
          'px',
        )
      }
      if (config.defaultSize.height) {
        config.defaultSize.height = formatToNumber(
          config.defaultSize.height,
          'px',
          'px',
        )
      }
    } else if (config.type === 'volume') {
      if (config.defaultSize.width) {
        config.defaultSize.width = formatToNumber(
          config.defaultSize.width,
          'm',
          'm',
        )
      }
      if (config.defaultSize.height) {
        config.defaultSize.height = formatToNumber(
          config.defaultSize.height,
          'm',
          'm',
        )
      }
      if (config.defaultSize.depth) {
        config.defaultSize.depth = formatToNumber(
          config.defaultSize.depth,
          'm',
          'm',
        )
      }
    }
  }
  return config
}

export function initScene(
  name: string,
  callback: (pre: SpatialSceneCreationOptions) => SpatialSceneCreationOptions,
) {
  return SceneManager.getInstance().initScene(name, callback)
}

export function hijackWindowOpen(window: WindowProxy) {
  SceneManager.getInstance().init(window)
}

export function hijackWindowATag(openedWindow: WindowProxy) {
  openedWindow!.document.onclick = function (e) {
    let element = e.target as HTMLElement | null
    let found = false

    // Look for <a> element in the clicked elements parents and if found override navigation behavior if needed
    while (!found) {
      if (element && element.tagName == 'A') {
        // When using libraries like react route's <Link> it sets an onclick event, when this happens we should do nothing and let that occur

        // if onClick is set for the element, the raw onclick will be noop() trapped so the onclick check is no longer trustable
        // we handle all the scenarios

        if (handleATag(e)) {
          return false // prevent default action and stop event propagation
        }

        return true
      }
      if (element && element.parentElement) {
        element = element.parentElement
      } else {
        break
      }
    }
  }
}

function handleATag(event: MouseEvent) {
  const targetElement = event.target as HTMLElement
  if (targetElement.tagName === 'A') {
    const link = targetElement as HTMLAnchorElement
    const target = link.target
    const url = link.href

    if (target && target !== '_self') {
      event.preventDefault()
      window.open(url, target)
      return true
    }
  }
}

async function injectScenePolyfill() {
  if (!window.opener) return

  const state = await SpatialScene.getInstance().getState()

  // only run this in pending state
  if (state !== SpatialSceneState.pending) return

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
    await SpatialScene.getInstance().updateSceneCreationConfig(cfg)
  })
}

export function injectSceneHook() {
  hijackWindowOpen(window)
  hijackWindowATag(window)
  injectScenePolyfill()
}
