// src/models/SpatialScene.ts

import { PuppeteerRunner } from '../runtime/puppeteerRunner.js'
import { Spatialized2DElement } from './Spatialized2DElement.js'
import { SpatializedElement } from './SpatializedElement.js'
import { Transform, Vec3 } from './types.js'

/**
 * SpatialScene类
 * 模拟CoreSDK中的SpatialScene
 */
export class SpatialScene {
  private runner: PuppeteerRunner
  private selector: string
  private elements: Map<string, SpatializedElement> = new Map()

  constructor(runner: PuppeteerRunner, selector: string = 'body') {
    this.runner = runner
    this.selector = selector
  }

  /**
   * 添加空间化元素到场景
   */
  async add(element: SpatializedElement): Promise<void> {
    this.elements.set(element.getId(), element)

    // 在测试环境中执行添加元素的操作
    await this.runner.evaluate(
      (elementId: string, selector: string) => {
        // 在浏览器环境中执行添加元素的操作
        console.log(`Adding element ${elementId} to scene at ${selector}`)
        // 这里可以添加更多的DOM操作来模拟元素添加
      },
      element.getId(),
      this.selector,
    )
  }

  /**
   * 从场景中移除空间化元素
   */
  async removeSpatializedElement(element: SpatializedElement): Promise<void> {
    this.elements.delete(element.getId())

    await this.runner.evaluate((elementId: string) => {
      console.log(`Removing element ${elementId} from scene`)
      // 这里可以添加更多的DOM操作来模拟元素移除
    }, element.getId())
  }

  /**
   * 获取场景中的所有元素
   */
  getElements(): SpatializedElement[] {
    return Array.from(this.elements.values())
  }

  /**
   * 更新场景属性
   */
  async updateSpatialProperties(properties: any): Promise<void> {
    await this.runner.evaluate((props: any) => {
      console.log('Updating spatial scene properties:', props)
      // 这里可以添加更多的DOM操作来模拟属性更新
    }, properties)
  }

  /**
   * 检查场景状态
   */
  async inspect(): Promise<any> {
    return await this.runner.evaluate(() => {
      return {
        elements: document.querySelectorAll('*').length,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
      }
    })
  }
}
