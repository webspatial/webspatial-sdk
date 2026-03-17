import {
  Spatialized2DElement as ISpatialized2DElement,
  SpatializedElementType,
  Vec2,
  ScrollAbleSpatialElementContainer,
  BackgroundMaterial,
  CornerRadius,
} from '../types/types'
import { SpatializedElement } from './SpatializedElement'

export class Spatialized2DElement
  extends SpatializedElement
  implements ISpatialized2DElement
{
  private _cornerRadius: CornerRadius = {
    topLeading: 0,
    topTrailing: 0,
    bottomLeading: 0,
    bottomTrailing: 0,
  }
  private _backgroundMaterial: BackgroundMaterial = BackgroundMaterial.none
  private _scrollEnabled: boolean = true
  private _scrollOffset: Vec2 = { x: 0, y: 0 }
  private _scrollPageEnabled: boolean = false

  private _children: Record<string, SpatializedElement> = {}
  constructor(id?: string) {
    super(SpatializedElementType.Spatialized2DElement, id)
  }

  get cornerRadius(): CornerRadius {
    return this._cornerRadius
  }

  set cornerRadius(value: CornerRadius) {
    this._cornerRadius = value
  }

  get backgroundMaterial(): BackgroundMaterial {
    return this._backgroundMaterial
  }

  set backgroundMaterial(value: BackgroundMaterial) {
    this._backgroundMaterial = value
  }

  get scrollEnabled(): boolean {
    return this._scrollEnabled
  }

  set scrollEnabled(value: boolean) {
    this._scrollEnabled = value
  }

  get scrollOffset(): Vec2 {
    return this._scrollOffset
  }

  set scrollOffset(value: Vec2) {
    this._scrollOffset = value
  }

  get scrollPageEnabled(): boolean {
    return this._scrollPageEnabled
  }

  set scrollPageEnabled(value: boolean) {
    this._scrollPageEnabled = value
  }

  // Implement parent property defined in interface
  get parent(): ScrollAbleSpatialElementContainer | null {
    // Return null by default because base class does not define parent
    return null
  }

  addChild(spatializedElement: SpatializedElement): void {
    if (!spatializedElement || !spatializedElement.id) {
      throw new Error('Invalid child element')
    }
    this._children[spatializedElement.id] = spatializedElement
    // Use type assertion to avoid type errors
    try {
      spatializedElement.setParent(this as any)
    } catch (error) {
      console.warn('Failed to set parent:', error)
    }
  }

  removeChild(spatializedElement: SpatializedElement): void {
    delete this._children[spatializedElement.id]
    // Safely set parent
    try {
      if (spatializedElement.setParent) {
        spatializedElement.setParent(null as any)
      }
    } catch (error) {
      console.warn('Failed to set parent to null:', error)
    }
  }

  getChild(id: string): SpatializedElement | null {
    return this._children[id] || null
  }

  getChildren(): Record<string, SpatializedElement> {
    return { ...this._children } // return a copy
  }

  getChildrenOfType(
    type: SpatializedElementType,
  ): Record<string, SpatializedElement> {
    const result: Record<string, SpatializedElement> = {}

    Object.entries(this._children).forEach(([key, child]) => {
      if (child.type === type) {
        result[key] = child
      }
    })

    return result
  }

  updateDeltaScrollOffset(delta: Vec2): void {
    if (this._scrollEnabled) {
      this._scrollOffset.x += delta.x
      this._scrollOffset.y += delta.y
    }
  }

  stopScrolling(): void {
    // Simplified implementation; may need more logic in practice
    this._scrollOffset = { x: 0, y: 0 }
  }

  protected onDestroy(): void {
    super.onDestroy()
    // Destroy all child elements
    Object.values(this._children).forEach(child => {
      child.destroy()
    })
    this._children = {}
  }
}
