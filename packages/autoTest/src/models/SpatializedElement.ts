// src/models/SpatializedElement.ts

import { PuppeteerRunner } from '../runtime/puppeteerRunner.js'
import { SpatializedElementProperties, Transform } from './types.js'

/**
 * SpatializedElement基类
 * 模拟CoreSDK中的SpatializedElement
 */
export class SpatializedElement {
  protected id: string
  protected runner: PuppeteerRunner
  protected properties: SpatializedElementProperties = {}
  protected transform: Transform = {}

  constructor(runner: PuppeteerRunner, id: string) {
    this.runner = runner
    this.id = id
  }

  /**
   * 获取元素ID
   */
  getId(): string {
    return this.id
  }

  /**
   * 更新元素属性
   */
  async updateProperties(
    properties: Partial<SpatializedElementProperties>,
  ): Promise<void> {
    this.properties = { ...this.properties, ...properties }

    await this.runner.evaluate(
      (elementId: string, props: any) => {
        console.log(`Updating properties for element ${elementId}:`, props)
        // 这里可以添加更多的DOM操作来模拟属性更新
      },
      this.id,
      properties,
    )
  }

  /**
   * 更新元素变换
   */
  async updateTransform(transform: Partial<Transform>): Promise<void> {
    this.transform = { ...this.transform, ...transform }

    await this.runner.evaluate(
      (elementId: string, trans: any) => {
        console.log(`Updating transform for element ${elementId}:`, trans)
        // 这里可以添加更多的DOM操作来模拟变换更新
      },
      this.id,
      transform,
    )
  }

  /**
   * 获取当前属性
   */
  getProperties(): SpatializedElementProperties {
    return { ...this.properties }
  }

  /**
   * 获取当前变换
   */
  getTransform(): Transform {
    return { ...this.transform }
  }
}
