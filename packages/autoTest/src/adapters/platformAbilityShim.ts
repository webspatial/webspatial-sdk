// src/adapters/platformAbilityShim.ts

import { PuppeteerRunner } from '../runtime/puppeteerRunner.js'
import { CommandResult, WebSpatialProtocolResult } from './types.js'

/**
 * 注入PlatformAbility模拟实现到Puppeteer环境中
 * 这个适配器模拟了CoreSDK中的PlatformAbility接口
 */
export async function injectPlatformAbilityShim(
  runner: PuppeteerRunner,
): Promise<void> {
  await runner.evaluateOnNewDocument(() => {
    // 定义全局变量以跟踪JSB调用
    ;(window as any).__TEST_JSB_CALLS__ = []

    // 模拟webkit消息处理程序
    ;(window as any).webkit = {
      messageHandlers: {
        bridge: {
          postMessage: (message: string) => {
            // 记录调用
            ;(window as any).__TEST_JSB_CALLS__.push(message)

            // 解析命令和消息
            const [cmd, msg] = message.split('::')

            // 调用测试环境中的处理函数
            return (window as any).test_callNative(cmd, msg)
          },
        },
      },
    }

    console.log('PlatformAbility shim injected')
  })
}

/**
 * 获取记录的JSB调用
 */
export async function getRecordedJSBCalls(
  runner: PuppeteerRunner,
): Promise<string[]> {
  return await runner.evaluate(() => {
    return (window as any).__TEST_JSB_CALLS__ || []
  })
}

/**
 * 清除记录的JSB调用
 */
export async function clearRecordedJSBCalls(
  runner: PuppeteerRunner,
): Promise<void> {
  await runner.evaluate(() => {
    ;(window as any).__TEST_JSB_CALLS__ = []
  })
}
