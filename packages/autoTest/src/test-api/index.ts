// src/test-api/index.ts

import { PuppeteerRunner } from '../runtime/puppeteerRunner.js'
import {
  injectPlatformAbilityShim,
  getRecordedJSBCalls,
  clearRecordedJSBCalls,
} from '../adapters/platformAbilityShim.js'
import {
  injectWindowProxyBridge,
  createWindowProxy,
  getWindowProxyIds,
  evaluateInWindowProxy,
} from '../windowProxy/windowProxyBridge.js'
import { SpatialScene } from '../models/SpatialScene.js'
import { Spatialized2DElement } from '../models/Spatialized2DElement.js'
import { SpatializedElement } from '../models/SpatializedElement.js'
import { Transform, Vec2, Vec3 } from '../models/types.js'

export interface NativeCall {
  cmd: string
  payload: any
}

export interface TestRunnerOptions {
  width?: number
  height?: number
  headless?: boolean
}

/**
 * WebSpatial自动化测试运行器
 * 提供在Linux环境下无图形界面测试WebSpatial应用的能力
 */
export class TestRunner {
  runner: PuppeteerRunner
  private nativeCalls: NativeCall[] = []
  private spatialElements: Map<string, Spatialized2DElement> = new Map()
  private scene: SpatialScene | null = null

  constructor(options?: TestRunnerOptions) {
    this.runner = new PuppeteerRunner()
  }

  /**
   * 初始化测试环境
   */
  async init(options?: TestRunnerOptions): Promise<void> {
    await this.runner.start({
      width: options?.width || 1280,
      height: options?.height || 800,
    })

    // 注册测试回调函数
    await this.runner.expose(
      'test_callNative',
      async (cmd: string, payload: any) => {
        this.nativeCalls.push({ cmd, payload })
        // 默认返回成功
        return { success: true, data: {} }
      },
    )

    // 注入平台能力模拟和窗口代理桥接
    await injectPlatformAbilityShim(this.runner)
    await injectWindowProxyBridge(this.runner)

    // 创建默认场景
    this.scene = new SpatialScene(this.runner)
  }

  /**
   * 加载HTML内容
   */
  async loadHtml(
    html: string,
    options?: {
      waitUntil?: 'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2'
    },
  ): Promise<void> {
    await this.runner.setContent(html, options)
  }

  /**
   * 获取或创建场景
   */
  getScene(sceneSelector?: string): SpatialScene {
    if (sceneSelector && this.scene) {
      return new SpatialScene(this.runner, sceneSelector)
    }
    if (!this.scene) {
      this.scene = new SpatialScene(this.runner)
    }
    return this.scene
  }

  /**
   * 创建2D空间化元素
   */
  async createSpatialized2DElement(): Promise<Spatialized2DElement> {
    // 创建windowProxy
    const windowProxyId = await createWindowProxy(this.runner)

    // 获取windowProxy对象
    const elementId = `spatialized_2d_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // 在主页面中获取windowProxy引用
    const windowProxy = (await this.runner.evaluate((id: string) => {
      const proxies = (window as any).__TEST_WINDOW_PROXIES__ || []
      return proxies.find((p: any) => p.__TEST_ID__ === id)
    }, windowProxyId)) as WindowProxy

    // 创建Spatialized2DElement实例
    const element = new Spatialized2DElement(
      this.runner,
      elementId,
      windowProxy,
    )
    this.spatialElements.set(elementId, element)

    return element
  }

  /**
   * 获取记录的原生调用
   */
  getNativeCalls(): NativeCall[] {
    return [...this.nativeCalls]
  }

  /**
   * 清除记录的原生调用
   */
  async clearNativeCalls(): Promise<void> {
    this.nativeCalls = []
    await clearRecordedJSBCalls(this.runner)
  }

  /**
   * 获取记录的JSB调用
   */
  async getJSBCalls(): Promise<string[]> {
    return await getRecordedJSBCalls(this.runner)
  }

  /**
   * 关闭测试环境
   */
  async close(): Promise<void> {
    await this.runner.close()
  }
}

// 导出所有类型和模型
export { SpatialScene, Spatialized2DElement, SpatializedElement }
export type { Transform, Vec2, Vec3 }
