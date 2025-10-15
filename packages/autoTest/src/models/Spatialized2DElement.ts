// src/models/Spatialized2DElement.ts

import { PuppeteerRunner } from '../runtime/puppeteerRunner.js'
import { SpatializedElement } from './SpatializedElement.js'
import { Spatialized2DElementProperties, Vec2 } from './types.js'

/**
 * Spatialized2DElement类
 * 模拟CoreSDK中的Spatialized2DElement
 */
export class Spatialized2DElement extends SpatializedElement {
  private _windowProxy: WindowProxy | null = null
  private _scrollOffset: Vec2 = { x: 0, y: 0 }
  private children: Map<string, SpatializedElement> = new Map()

  constructor(runner: PuppeteerRunner, id: string, windowProxy: WindowProxy) {
    super(runner, id)
    this._windowProxy = windowProxy
  }

  /**
   * 获取windowProxy
   */
  get windowProxy(): WindowProxy {
    if (!this._windowProxy) {
      throw new Error('WindowProxy not initialized')
    }
    return this._windowProxy
  }

  /**
   * 更新2D元素属性
   */
  async updateProperties(
    properties: Partial<Spatialized2DElementProperties>,
  ): Promise<void> {
    await super.updateProperties(properties)

    // 处理2D特有属性
    if (properties.scrollEnabled !== undefined) {
      await this.runner.evaluate(
        (elementId: string, scrollEnabled: boolean) => {
          console.log(
            `Setting scroll enabled for ${elementId}: ${scrollEnabled}`,
          )
          // 这里可以添加更多的DOM操作来模拟滚动启用/禁用
        },
        this.id,
        properties.scrollEnabled,
      )
    }

    if (properties.cornerRadius !== undefined) {
      await this.runner.evaluate(
        (elementId: string, cornerRadius: any) => {
          console.log(`Setting corner radius for ${elementId}:`, cornerRadius)
          // 这里可以添加更多的DOM操作来模拟圆角设置
        },
        this.id,
        properties.cornerRadius,
      )
    }
  }

  /**
   * 设置滚动偏移
   */
  async setScrollOffset(offset: Vec2): Promise<void> {
    this._scrollOffset = offset

    if (this._windowProxy) {
      await this.runner.evaluate(
        (elementId: string, x: number, y: number) => {
          console.log(`Setting scroll offset for ${elementId}: x=${x}, y=${y}`)
          // 在实际的windowProxy中设置滚动位置
          window.scrollTo(x, y)
        },
        this.id,
        offset.x,
        offset.y,
      )
    }
  }

  /**
   * 更新滚动偏移增量
   */
  async updateDeltaScrollOffset(delta: Vec2): Promise<void> {
    const newOffset = {
      x: this._scrollOffset.x + delta.x,
      y: this._scrollOffset.y + delta.y,
    }
    await this.setScrollOffset(newOffset)
  }

  /**
   * 停止滚动
   */
  async stopScrolling(): Promise<void> {
    if (this._windowProxy) {
      await this.runner.evaluate(() => {
        // 停止任何正在进行的滚动动画
        if ('scrollEndTimer' in window) {
          clearTimeout((window as any).scrollEndTimer)
        }
      })
    }
  }

  /**
   * 添加子元素
   */
  async addSpatializedElement(element: SpatializedElement): Promise<void> {
    this.children.set(element.getId(), element)

    await this.runner.evaluate(
      (parentId: string, childId: string) => {
        console.log(`Adding element ${childId} as child of ${parentId}`)
        // 这里可以添加更多的DOM操作来模拟子元素添加
      },
      this.id,
      element.getId(),
    )
  }

  /**
   * 获取所有子元素
   */
  getChildren(): SpatializedElement[] {
    return Array.from(this.children.values())
  }

  /**
   * 更新内容
   */
  async updateContent(content: string): Promise<void> {
    if (this._windowProxy) {
      await this.runner.evaluate(
        (elementId: string, htmlContent: string) => {
          console.log(`Updating content for ${elementId}`)
          // 在实际的windowProxy中更新内容
          document.body.innerHTML = htmlContent
        },
        this.id,
        content,
      )
    }
  }

  /**
   * 在窗口中执行JavaScript
   */
  async evaluate<T>(
    fn: (...args: any[]) => T | Promise<T>,
    ...args: any[]
  ): Promise<T> {
    if (!this._windowProxy) {
      throw new Error('WindowProxy not initialized')
    }
    return this.runner.evaluate(fn, ...args)
  }
}
