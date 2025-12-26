import { WindowStyle, SceneStateKind } from './types/types'
import { SpatialScene } from './model/SpatialScene'
import { Spatialized2DElement } from './model/Spatialized2DElement'
import { SpatialObjectWeakRefManager } from './model/SpatialObject'

export class WebSpatial {
  private static instance: WebSpatial
  private currentScene: SpatialScene | null = null
  private scenes: Record<string, SpatialScene> = {}

  private constructor() {
    // Private constructor
  }

  static getInstance(): WebSpatial {
    if (!WebSpatial.instance) {
      WebSpatial.instance = new WebSpatial()
    }
    return WebSpatial.instance
  }

  // Create a new spatial scene
  createScene(
    url: string,
    windowStyle: WindowStyle = WindowStyle.window,
  ): SpatialScene {
    // Pass parameters directly to match SpatialScene constructor
    const scene = new SpatialScene(url, windowStyle, SceneStateKind.idle)
    this.scenes[scene.id] = scene
    this.currentScene = scene

    return scene
  }

  // Get current scene
  getCurrentScene(): SpatialScene | null {
    return this.currentScene
  }

  // Destroy scene
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

  // Inspect current spatial scene
  inspectCurrentSpatialScene(): any {
    const scene = this.getCurrentScene()
    if (!scene) {
      // If there is no current scene, create a default scene
      this.createScene('default://scene', WindowStyle.window)
      return this.inspectCurrentSpatialScene()
    }

    // Get all children from scene
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

  // Format children data
  private formatChildren(children: any): Record<string, any> {
    const formatted: Record<string, any> = {}

    // Check whether children is an object
    if (typeof children === 'object' && children !== null) {
      // Handle different formats of children
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
        const child = value as any
        if (child && typeof child === 'object') {
          // Create a formatted object without parent reference to avoid cycles and duplicate additions
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
            backOffset: 'backOffset' in child ? child.backOffset : undefined,
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
            // Remove parent property to avoid cyclic references and duplicate children
          }
        }
      })
    }

    return formatted
  }
}
