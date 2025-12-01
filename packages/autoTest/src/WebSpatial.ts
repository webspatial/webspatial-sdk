import { WindowStyle, SceneStateKind } from './types/types'
import { SpatialScene } from './model/SpatialScene'
import { Spatialized2DElement } from './model/Spatialized2DElement'
import { SpatialObjectWeakRefManager } from './model/SpatialObject'

export class WebSpatial {
  private static instance: WebSpatial
  private currentScene: SpatialScene | null = null
  private scenes: Record<string, SpatialScene> = {}

  private constructor() {
    // 私有构造函数
  }

  static getInstance(): WebSpatial {
    if (!WebSpatial.instance) {
      WebSpatial.instance = new WebSpatial()
    }
    return WebSpatial.instance
  }

  // 创建一个新的空间场景
  createScene(
    url: string,
    windowStyle: WindowStyle = WindowStyle.window,
  ): SpatialScene {
    // 直接传递参数，使用与SpatialScene构造函数匹配的参数列表
    const scene = new SpatialScene(url, windowStyle, SceneStateKind.idle)
    this.scenes[scene.id] = scene
    this.currentScene = scene

    return scene
  }

  // 获取当前场景
  getCurrentScene(): SpatialScene | null {
    return this.currentScene
  }

  // 销毁场景
  destroyScene(sceneId: string): void {
    const scene = this.scenes[sceneId]
    if (scene) {
      scene.destroy()
      delete this.scenes[sceneId]
      if (this.currentScene?.id === sceneId) {
        this.currentScene = null
      }
    }
  }

  // 检查当前空间场景
  inspectCurrentSpatialScene(): any {
    const scene = this.getCurrentScene()
    if (!scene) {
      // 如果没有当前场景，创建一个默认场景
      this.createScene('default://scene', WindowStyle.window)
      return this.inspectCurrentSpatialScene()
    }

    // 从scene获取所有children
    const children = scene.children || {}
    console.log('inspectCurrentSpatialScene children: ', Object.keys(children))

    return {
      id: scene.id || scene.spatialId || 'default-scene',
      name: scene.name || 'Default Scene',
      backgroundMaterial: scene.backgroundMaterial,
      cornerRadius: scene.cornerRadius,
      scrollOffset: scene.scrollOffset,
      spatialObjectCount: scene.spatialObjects.length,
      spatialObjectRefCount: SpatialObjectWeakRefManager.getWeakRefCount(),
      version: scene.version || '1.0.0',
      children: this.formatChildren(children),
      url: scene.url,
      windowStyle: scene.windowStyle,
      state: scene.state,
      sceneConfig: scene.sceneConfig,
    }
  }

  // 格式化子元素数据
  private formatChildren(children: any): Record<string, any> {
    const formatted: Record<string, any> = {}

    // 检查children是否为对象
    if (typeof children === 'object' && children !== null) {
      // 处理不同格式的children
      const childrenToProcess = Array.isArray(children)
        ? children.reduce(
            (acc: Record<string, any>, child: any) => {
              if (child && child.id) acc[child.id] = child
              return acc
            },
            {} as Record<string, any>,
          )
        : children

      Object.entries(childrenToProcess).forEach(([key, value]) => {
        const child = value as any // 使用类型断言
        if (child && typeof child === 'object') {
          // 创建一个不包含parent引用的格式化对象，避免循环引用和重复添加
          formatted[key] = {
            id: 'id' in child ? child.id : key,
            type: 'type' in child ? child.type : 'Spatialized2DElement',
            transform:
              'transform' in child
                ? child.transform
                : {
                    translation:
                      'position' in child ? child.position : [0, 0, 0],
                    rotation: [0, 0, 0],
                    scale: [1, 1, 1],
                  },
            style: 'style' in child ? child.style : {},
            clientX: 'clientX' in child ? child.clientX : undefined,
            clientY: 'clientY' in child ? child.clientY : undefined,
            width: 'width' in child ? child.width : undefined,
            height: 'height' in child ? child.height : undefined,
            depth: 'depth' in child ? child.depth : undefined,
            opacity: 'opacity' in child ? child.opacity : undefined,
            visibility: 'visibility' in child ? child.visibility : undefined,
            zIndex: 'zIndex' in child ? child.zIndex : undefined,
            enableDragEndGesture:
              'enableDragEndGesture' in child
                ? child.enableDragEndGesture
                : undefined,
            enableDragGesture:
              'enableDragGesture' in child
                ? child.enableDragGesture
                : undefined,
            enableMagnifyGesture:
              'enableMagnifyGesture' in child
                ? child.enableMagnifyGesture
                : undefined,
            enableMagnifyEndGesture:
              'enableMagnifyEndGesture' in child
                ? child.enableMagnifyEndGesture
                : undefined,
            enableMagnifyStartGesture:
              'enableMagnifyStartGesture' in child
                ? child.enableMagnifyStartGesture
                : undefined,
            enableRotateGesture:
              'enableRotateGesture' in child
                ? child.enableRotateGesture
                : undefined,
            enableRotateEndGesture:
              'enableRotateEndGesture' in child
                ? child.enableRotateEndGesture
                : undefined,
            enableRotateStartGesture:
              'enableRotateStartGesture' in child
                ? child.enableRotateStartGesture
                : undefined,
            enableTapGesture:
              'enableTapGesture' in child ? child.enableTapGesture : undefined,
            // 移除parent属性，避免循环引用和children重复添加
          }
        }
      })
    }

    return formatted
  }
}
