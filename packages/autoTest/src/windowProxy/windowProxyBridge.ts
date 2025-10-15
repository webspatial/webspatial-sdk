// src/windowProxy/windowProxyBridge.ts

import { PuppeteerRunner } from '../runtime/puppeteerRunner.js'

/**
 * 注入windowProxy桥接代码到Puppeteer环境
 * 这使得测试环境可以模拟WebSpatial SDK中的windowProxy功能
 */
export async function injectWindowProxyBridge(
  runner: PuppeteerRunner,
): Promise<void> {
  await runner.evaluateOnNewDocument(() => {
    // 保存原始的window.open方法
    const originalWindowOpen = window.open

    // 重写window.open方法以跟踪创建的windowProxy
    ;(window as any).open = function (...args: any[]): WindowProxy | null {
      console.log('Window.open called with args:', args)

      // 创建一个iframe作为windowProxy
      const iframe = document.createElement('iframe')
      iframe.style.width = '100%'
      iframe.style.height = '100%'
      iframe.style.border = 'none'
      iframe.style.position = 'absolute'
      iframe.style.top = '0'
      iframe.style.left = '0'
      iframe.style.zIndex = '-1' // 隐藏在背景中

      // 如果提供了URL，则设置src
      if (args[0]) {
        iframe.src = args[0]
      }

      // 将iframe添加到文档中
      document.body.appendChild(iframe)

      // 获取contentWindow作为windowProxy
      const windowProxy = iframe.contentWindow

      if (windowProxy) {
        // 添加关闭方法
        ;(windowProxy as any).close = () => {
          document.body.removeChild(iframe)
          console.log('WindowProxy closed')
        }

        // 记录创建的windowProxy
        if (!(window as any).__TEST_WINDOW_PROXIES__) {
          ;(window as any).__TEST_WINDOW_PROXIES__ = []
        }
        ;(window as any).__TEST_WINDOW_PROXIES__.push(windowProxy)

        // 为测试目的添加ID
        ;(windowProxy as any).__TEST_ID__ =
          `window_proxy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }

      return windowProxy
    }

    console.log('WindowProxy bridge injected')
  })
}

/**
 * 创建一个新的windowProxy
 */
export async function createWindowProxy(
  runner: PuppeteerRunner,
  url?: string,
): Promise<string> {
  return await runner.evaluate((url?: string) => {
    const windowProxy = window.open(url)
    return (windowProxy as any).__TEST_ID__
  }, url)
}

/**
 * 获取所有创建的windowProxy IDs
 */
export async function getWindowProxyIds(
  runner: PuppeteerRunner,
): Promise<string[]> {
  return await runner.evaluate(() => {
    const proxies = (window as any).__TEST_WINDOW_PROXIES__ || []
    return proxies.map((proxy: any) => proxy.__TEST_ID__)
  })
}

/**
 * 在指定的windowProxy中执行代码
 */
export async function evaluateInWindowProxy<T>(
  runner: PuppeteerRunner,
  windowProxyId: string,
  fn: () => T,
): Promise<T> {
  return await runner.evaluate(
    (id: string, fnStr: string) => {
      const proxies = (window as any).__TEST_WINDOW_PROXIES__ || []
      const proxy = proxies.find((p: any) => p.__TEST_ID__ === id)

      if (!proxy) {
        throw new Error(`WindowProxy with ID ${id} not found`)
      }

      // 在windowProxy的上下文中执行函数
      return proxy.eval(`(${fnStr})()`)
    },
    windowProxyId,
    fn.toString(),
  )
}
