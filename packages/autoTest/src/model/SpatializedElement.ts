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
  transform: any = {} // simplified implementation
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
    // If parent is the same, return to avoid duplicate work
    if (this._parent?.id === parent?.id) {
      return
    }

    // Remove old parent reference
    if (this._parent) {
      // Store the old parent reference
      const oldParent = this._parent
      // Set _parent to null first to avoid recursive calls
      this._parent = null
      // Remove from old parent
      oldParent.removeChild(this)
    }

    // Set new parent reference
    this._parent = parent

    // Add to the new parent, but avoid recursion
    // Check whether parent's addChild causes recursion
    // Rely on SpatialScene.addChild checks to avoid duplicate additions
  }

  getParent(): ScrollAbleSpatialElementContainer | null {
    return this._parent
  }

  protected onDestroy(): void {
    super.onDestroy()
    // Clear parent reference
    if (this._parent) {
      this._parent.removeChild(this)
    }
  }
}
