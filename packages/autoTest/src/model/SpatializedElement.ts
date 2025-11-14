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

  setParent(parent: ScrollAbleSpatialElementContainer): void {
    this._parent = parent
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
