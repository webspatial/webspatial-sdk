import { PlatformAbility, CommandResult } from '../interface'
import {
  CommandResultFailure,
  CommandResultSuccess,
} from '../CommandResultUtils'

// 添加window扩展接口
declare global {
  interface Window {
    __handleJSBMessage: (message: string) => any
    SpatialId?: string
  }

  interface HTMLIFrameElement {
    spatialId?: string
    webSpatialId?: string
  }
}

type JSBError = {
  message: string
}

console.log('PuppeteerPlatform')

export class PuppeteerPlatform implements PlatformAbility {
  // 存储iframe实例
  private iframeRegistry: Map<string, HTMLIFrameElement> = new Map()

  constructor() {}

  callJSB(cmd: string, msg: string): Promise<CommandResult> {
    return new Promise(resolve => {
      try {
        // 检查__handleJSBMessage是否存在
        if (window.__handleJSBMessage) {
          try {
            console.log(` core-sdk Puppeteer Platform: callJSB: ${cmd}::${msg}`)
            const result = window.__handleJSBMessage(`${cmd}::${msg}`)
            console.log(
              ` core-sdk Puppeteer Platform callJSB result: ${result}`,
            )
            resolve(CommandResultSuccess(result))
          } catch (err) {
            resolve(CommandResultFailure('500', 'JSB execution error'))
          }
        } else {
          // 如果不存在，返回默认结果
          resolve(CommandResultSuccess('ok'))
        }
      } catch (error: unknown) {
        console.error(
          `PuppeteerPlatform cmd Error: ${cmd}, msg: ${msg} error: ${error}`,
        )
        resolve(CommandResultFailure('500', 'Internal error'))
      }
    })
  }

  /**
   * 同步创建Spatialized2DElement到Puppeteer Runner
   */
  private createSpatializedElementSync(
    spatialId: string,
    webspatialUrl: string,
  ): void {
    try {
      console.log(
        `[Puppeteer Platform] Creating spatialized element sync with id: ${spatialId}, url: ${webspatialUrl}`,
      )
      // 直接调用Puppeteer Runner的方法来创建元素
      const win = window as any
      if (win.__handleJSBMessage) {
        // 使用更简洁的格式，确保JSBManager能正确使用我们传递的spatialId
        const createCommand = {
          id: spatialId,
          url: webspatialUrl,
        }
        win.__handleJSBMessage(
          `CreateSpatialized2DElement::${JSON.stringify(createCommand)}`,
        )
      }
    } catch (error) {
      console.error('Error creating spatialized element sync:', error)
    }
  }

  callWebSpatialProtocol(
    command: string,
    query?: string,
    target?: string,
    features?: string,
  ): Promise<CommandResult> {
    console.log(
      `PuppeteerPlatform: Calling webspatial protocol: webspatial://${command}${query ? `?${query}` : ''}`,
    )
    return new Promise(resolve => {
      try {
        // 创建完整的webspatial URL
        const webspatialUrl = `webspatial://${command}${query ? `?${query}` : ''}`
        // 使用iframe创建新窗口
        const { spatialId, iframe, windowProxy } = this.createIframeWindow(
          webspatialUrl,
          target,
          features,
        )

        // 对于createSpatialized2DElement命令，同步创建元素
        if (command === 'createSpatialized2DElement') {
          this.createSpatializedElementSync(spatialId, webspatialUrl)
        }
        console.log(
          `[Puppeteer Platform] iframe created with spatialId: ${spatialId}`,
        )
        // 注册iframe
        this.iframeRegistry.set(spatialId, iframe)
        resolve(CommandResultSuccess({ windowProxy, id: spatialId }))
      } catch (error) {
        console.error('Error calling webspatial protocol:', error)
        resolve(
          CommandResultFailure('500', 'Failed to call webspatial protocol'),
        )
      }
    })
  }

  callWebSpatialProtocolSync(
    command: string,
    query?: string,
    target?: string,
    features?: string,
  ): CommandResult {
    try {
      // 创建完整的webspatial URL
      const webspatialUrl = `webspatial://${command}${query ? `?${query}` : ''}`
      console.log(`Calling webspatial protocol sync: ${webspatialUrl}`)

      // 使用iframe创建新窗口
      const { spatialId, iframe, windowProxy } = this.createIframeWindow(
        webspatialUrl,
        target,
        features,
      )

      // 对于createSpatialized2DElement命令，同步创建元素
      if (command === 'createSpatialized2DElement') {
        this.createSpatializedElementSync(spatialId, webspatialUrl)
      }

      // 注册iframe
      this.iframeRegistry.set(spatialId, iframe)

      return CommandResultSuccess({ windowProxy, id: spatialId })
    } catch (error) {
      console.error('Error calling webspatial protocol sync:', error)
      return CommandResultFailure(
        '500',
        'Failed to call webspatial protocol sync',
      )
    }
  }

  /**
   * 创建基于iframe的窗口
   */
  private createIframeWindow(url: string, target?: string, features?: string) {
    // 创建iframe元素
    const iframe = document.createElement('iframe')

    // 设置iframe属性
    iframe.style.border = 'none'
    iframe.style.display = 'none' // 初始隐藏
    iframe.style.width = '100%'
    iframe.style.height = '100%'

    // 生成唯一的spatialId
    const spatialId = this.generateUUID()
    iframe.spatialId = spatialId
    iframe.id = `spatial-iframe-${spatialId}`

    // 解析features参数
    const featuresObj = this.parseFeatures(features || '')

    // 根据features设置iframe样式
    if (featuresObj.width) {
      iframe.style.width = featuresObj.width
    }
    if (featuresObj.height) {
      iframe.style.height = featuresObj.height
    }
    if (featuresObj.left) {
      iframe.style.left = featuresObj.left
      iframe.style.position = 'absolute'
    }
    if (featuresObj.top) {
      iframe.style.top = featuresObj.top
      iframe.style.position = 'absolute'
    }

    // 添加iframe到DOM
    document.body.appendChild(iframe)

    // 创建增强的windowProxy模拟对象
    const windowProxy = this.createEnhancedWindowProxy(iframe, url, spatialId)

    // 设置iframe的src
    iframe.src = 'about:blank'

    console.log(
      `PuppeteerPlatform created iframe window with spatialId: ${spatialId}, URL: ${url}`,
    )

    // 初始化iframe内容
    this.initializeIframeContent(iframe, url, spatialId)

    return { spatialId, iframe, windowProxy }
  }

  /**
   * 创建增强的windowProxy对象
   */
  private createEnhancedWindowProxy(
    iframe: HTMLIFrameElement,
    url: string,
    spatialId: string,
  ) {
    // 创建增强的windowProxy模拟对象
    return {
      // 基本属性
      location: {
        href: url,
        toString: () => url,
        reload: () => {
          if (iframe.contentWindow) {
            iframe.contentWindow.location.reload()
          }
        },
      },
      navigator: {
        userAgent: `Mozilla/5.0 (WebKit) SpatialId/${spatialId}`,
      },

      // 方法
      close: () => {
        console.log(`Closing iframe with spatialId: ${spatialId}`)
        iframe.remove()
        this.iframeRegistry.delete(spatialId)
      },

      // 文档访问
      document: iframe.contentDocument || ({} as Document),
      contentWindow: iframe.contentWindow || ({} as Window),

      // 添加消息通信方法
      postMessage: (message: any, targetOrigin?: string) => {
        if (iframe.contentWindow) {
          iframe.contentWindow.postMessage(message, targetOrigin || '*')
        }
      },

      // 添加事件监听方法
      addEventListener: (
        type: string,
        listener: EventListenerOrEventListenerObject,
      ) => {
        if (iframe.contentWindow) {
          iframe.contentWindow.addEventListener(type, listener)
        }
      },

      removeEventListener: (
        type: string,
        listener: EventListenerOrEventListenerObject,
      ) => {
        if (iframe.contentWindow) {
          iframe.contentWindow.removeEventListener(type, listener)
        }
      },

      // 执行JavaScript
      executeScript: (code: string): any => {
        if (iframe.contentWindow) {
          try {
            // 使用类型断言和更安全的方式执行脚本
            const win = iframe.contentWindow as any
            return win.eval(code)
          } catch (error) {
            console.error(
              `Error executing script in iframe ${spatialId}:`,
              error,
            )
            return null
          }
        }
        return null
      },

      // 获取iframe引用
      getIframe: () => iframe,

      // 获取spatialId
      getSpatialId: () => spatialId,
    }
  }

  /**
   * 初始化iframe内容
   */
  private initializeIframeContent(
    iframe: HTMLIFrameElement,
    url: string,
    spatialId: string,
  ): void {
    try {
      // 等待iframe加载完成
      iframe.onload = () => {
        try {
          // 设置iframe内容
          const iframeContent = `
            // 注入通信脚本
            window.webSpatialId = '${spatialId}';
            window.SpatialId = '${spatialId}';
            
            // 重写window.open以支持webspatial协议
            const originalOpen = window.open;
            window.open = function(url, target, features) {
              if (url && url.startsWith('webspatial://')) {
                // 通过windowProxy处理webspatial协议
                const windowProxy = new Proxy({}, {
                  get: function(target, prop) {
                    if (prop === 'toString') {
                      return function() { return url; };
                    }
                    return undefined;
                  }
                });
                return windowProxy;
              }
              return originalOpen.call(window, url, target, features);
            };
            
            // 设置navigator.userAgent以识别webspatial环境
            Object.defineProperty(navigator, 'userAgent', {
              value: 'WebSpatial/1.0 ' + navigator.userAgent,
              configurable: true
            });
            
            // 发送加载完成消息
            window.parent.postMessage({
              type: 'iframe_loaded',
              spatialId: '${spatialId}',
              url: '${url}'
            }, '${window.location.origin}');
            
            // 设置消息处理器
            window.addEventListener('message', (event) => {
              if (event.origin !== window.parent.location.origin) return;
              
              const data = event.data;
              if (data && data.type === 'webspatial_command') {
                // 处理来自父窗口的命令
                console.log('Received command in iframe from parent:', data.command);
                // 这里可以添加命令处理逻辑
              }
            });
          `

          // 使用document.write代替eval，更安全且符合类型定义
          const doc = iframe.contentDocument
          if (doc) {
            doc.open()
            doc.write(`
              <!DOCTYPE html>
              <html>
              <head>
                <title>Spatial Iframe - ${spatialId}</title>
                <meta charset="UTF-8">
                <style>
                  body {
                    margin: 0;
                    padding: 0;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  }
                </style>
              </head>
              <body>
                <script>${iframeContent}</script>
              </body>
              </html>
            `)
            doc.close()
          }
        } catch (error) {
          console.error('Error initializing iframe content:', error)
        }
      }
    } catch (error) {
      console.error('Error setting up iframe:', error)
    }
  }

  /**
   * 解析features字符串为对象
   */
  private parseFeatures(features: string): Record<string, string> {
    const result: Record<string, string> = {}
    const pairs = features.split(',')

    pairs.forEach(pair => {
      const [key, value] = pair.split('=').map(s => s.trim())
      if (key && value) {
        result[key] = value
      }
    })

    return result
  }

  /**
   * 发送消息到指定spatialId的iframe
   */
  public sendMessageToIframe(spatialId: string, message: any): boolean {
    const iframe = this.iframeRegistry.get(spatialId)
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage(message, window.location.origin)
      return true
    }
    return false
  }

  /**
   * 获取所有活跃的iframe
   */
  public getAllActiveIframes(): Array<{
    spatialId: string
    iframe: HTMLIFrameElement
  }> {
    const result: Array<{ spatialId: string; iframe: HTMLIFrameElement }> = []

    this.iframeRegistry.forEach((iframe, spatialId) => {
      result.push({ spatialId, iframe })
    })

    return result
  }

  /**
   * 清理资源
   */
  public dispose(): void {
    // 关闭所有iframe
    this.iframeRegistry.forEach((iframe, spatialId) => {
      console.log(`Disposing iframe with spatialId: ${spatialId}`)
      iframe.remove()
    })
    this.iframeRegistry.clear()
  }

  // 生成UUID函数
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0
        const v = c === 'x' ? r : (r & 0x3) | 0x8
        return v.toString(16).toUpperCase()
      },
    )
  }
}
