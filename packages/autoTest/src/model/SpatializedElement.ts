import {
  SpatializedElement as ISpatializedElement,
  SpatializedElementType,
  Vec3,
  ScrollAbleSpatialElementContainer,
} from '../types/types'
import { SpatialObject } from './SpatialObject'

export class SpatializedElement
  extends SpatialObject
  implements ISpatializedElement
{
  type: SpatializedElementType
  clientX: number = 0
  clientY: number = 0
  width: number = 0
  height: number = 0
  depth: number = 0
  backOffset: number = 0
  transform: any = {} // 简化实现
  rotationAnchor: Vec3 = { x: 0, y: 0, z: 0 }
  opacity: number = 1
  visible: boolean = true
  scrollWithParent: boolean = true
  zIndex: number = 0
  clip: boolean = false

  enableTapGesture: boolean = false
  enableDragStartGesture: boolean = false
  enableDragGesture: boolean = false
  enableDragEndGesture: boolean = false
  enableRotateStartGesture: boolean = false
  enableRotateGesture: boolean = false
  enableRotateEndGesture: boolean = false
  enableMagnifyStartGesture: boolean = false
  enableMagnifyGesture: boolean = false
  enableMagnifyEndGesture: boolean = false

  private _parent: ScrollAbleSpatialElementContainer | null = null

  constructor(type: SpatializedElementType, id?: string) {
    super(id)
    this.type = type
  }

  setParent(parent: ScrollAbleSpatialElementContainer | null): void {
    // 如果parent相同，直接返回，避免重复操作
    if (this._parent?.id === parent?.id) {
      return
    }

    // 移除旧的父引用
    if (this._parent) {
      // 存储旧父引用
      const oldParent = this._parent
      // 先设置_parent为null，避免循环调用
      this._parent = null
      // 移除从旧父元素
      oldParent.removeChild(this)
    }

    // 设置新的父引用
    this._parent = parent

    // 添加到新父元素，但避免循环调用
    // 检查parent的addChild方法是否会导致循环
    // 这里依赖SpatialScene.addChild方法中的检查来避免重复添加
  }

  getParent(): ScrollAbleSpatialElementContainer | null {
    return this._parent
  }

  protected onDestroy(): void {
    super.onDestroy()
    // 清理父引用
    if (this._parent) {
      this._parent.removeChild(this)
    }
  }
}
