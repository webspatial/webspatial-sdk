import {
  Spatialized2DElement as ISpatialized2DElement,
  SpatializedElementType,
  Vec2,
  ScrollAbleSpatialElementContainer,
} from '../types/types'
import { SpatializedElement } from './SpatializedElement'

export class Spatialized2DElement
  extends SpatializedElement
  implements ISpatialized2DElement
{
  private _cornerRadius: number = 0
  private _backgroundMaterial: any = null
  private _scrollEnabled: boolean = true
  private _scrollOffset: Vec2 = { x: 0, y: 0 }
  private _scrollPageEnabled: boolean = true

  private _children: Record<string, SpatializedElement> = {}
  constructor(id?: string) {
    super(SpatializedElementType.Spatialized2DElement, id)
  }

  get cornerRadius(): number {
    return this._cornerRadius
  }

  set cornerRadius(value: number) {
    this._cornerRadius = value
  }

  get backgroundMaterial(): any {
    return this._backgroundMaterial
  }

  set backgroundMaterial(value: any) {
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

  // 实现接口中定义的parent属性
  get parent(): ScrollAbleSpatialElementContainer | null {
    // 直接返回null作为默认值，因为父类没有定义parent属性
    return null
  }

  addChild(spatializedElement: SpatializedElement): void {
    if (!spatializedElement || !spatializedElement.id) {
      throw new Error('Invalid child element')
    }
    this._children[spatializedElement.id] = spatializedElement
    // 使用类型断言来避免类型错误
    try {
      spatializedElement.setParent(this as any)
    } catch (error) {
      console.warn('Failed to set parent:', error)
    }
  }

  removeChild(spatializedElement: SpatializedElement): void {
    delete this._children[spatializedElement.id]
    // 使用安全的方式设置parent
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
    return { ...this._children } // 返回副本
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
    // 简化实现，实际可能需要更多逻辑
    this._scrollOffset = { x: 0, y: 0 }
  }

  protected onDestroy(): void {
    super.onDestroy()
    // 销毁所有子元素
    Object.values(this._children).forEach(child => {
      child.destroy()
    })
    this._children = {}
  }
}
