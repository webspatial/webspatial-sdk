import { PlatformAbility, CommandResult } from '../interface'
import {
  CommandResultFailure,
  CommandResultSuccess,
} from '../CommandResultUtils'

// add window interface for JSB call
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
  // store iframe instance
  private iframeRegistry: Map<string, HTMLIFrameElement> = new Map()

  constructor() {}

  callJSB(cmd: string, msg: string): Promise<CommandResult> {
    return new Promise(resolve => {
      try {
        // check __handleJSBMessage exist
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
          // if not exist, return default result
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
   * Synchronously create Spatialized2DElement to Puppeteer Runner
   */
  private createSpatializedElementSync(
    spatialId: string,
    webspatialUrl: string,
  ): void {
    try {
      console.log(
        `[Puppeteer Platform] Creating spatialized element sync with id: ${spatialId}, url: ${webspatialUrl}`,
      )
      // directly call Puppeteer Runner method to create element
      const win = window as any
      if (win.__handleJSBMessage) {
        // use simpler format to ensure JSBManager can correctly use our passed spatialId
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
        // create complete webspatial URL
        const webspatialUrl = `webspatial://${command}${query ? `?${query}` : ''}`
        // use iframe to create new window
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
        // store iframe instance
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
      // create complete webspatial URL
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

      // store iframe instance
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
   * Synchronously create iframe-based window
   */
  private createIframeWindow(url: string, target?: string, features?: string) {
    // create iframe element
    const iframe = document.createElement('iframe')

    // set iframe attributes
    iframe.style.border = 'none'
    iframe.style.display = 'none'
    iframe.style.width = '100%'
    iframe.style.height = '100%'

    // set iframe id
    const spatialId = this.generateUUID()
    iframe.spatialId = spatialId
    iframe.id = `spatial-iframe-${spatialId}`

    // parse features parameter
    const featuresObj = this.parseFeatures(features || '')

    // set iframe styles based on features
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

    // add iframe to DOM
    document.body.appendChild(iframe)

    // create enhanced windowProxy object
    const windowProxy = this.createEnhancedWindowProxy(iframe, url, spatialId)

    // set iframe src
    iframe.src = 'about:blank'

    console.log(
      `PuppeteerPlatform created iframe window with spatialId: ${spatialId}, URL: ${url}`,
    )

    // initialize iframe content
    this.initializeIframeContent(iframe, url, spatialId)

    return { spatialId, iframe, windowProxy }
  }

  /**
   * create enhanced windowProxy object
   */
  private createEnhancedWindowProxy(
    iframe: HTMLIFrameElement,
    url: string,
    spatialId: string,
  ) {
    // create enhanced windowProxy object
    return {
      // basic properties
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

      // methods
      close: () => {
        console.log(`Closing iframe with spatialId: ${spatialId}`)
        iframe.remove()
        this.iframeRegistry.delete(spatialId)
      },

      // document access
      document: iframe.contentDocument || ({} as Document),
      contentWindow: iframe.contentWindow || ({} as Window),

      // add message communication method
      postMessage: (message: any, targetOrigin?: string) => {
        if (iframe.contentWindow) {
          iframe.contentWindow.postMessage(message, targetOrigin || '*')
        }
      },

      // add event listener method
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

      // execute JavaScript
      executeScript: (code: string): any => {
        if (iframe.contentWindow) {
          try {
            // use type assertion and safer way to execute script
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

      // get iframe reference
      getIframe: () => iframe,

      // get spatialId
      getSpatialId: () => spatialId,
    }
  }

  /**
   * initialize iframe content
   */
  private initializeIframeContent(
    iframe: HTMLIFrameElement,
    url: string,
    spatialId: string,
  ): void {
    try {
      // wait for iframe to load
      iframe.onload = () => {
        try {
          // set iframe content
          const iframeContent = `
            // inject communication script
            window.webSpatialId = '${spatialId}';
            window.SpatialId = '${spatialId}';
            
            // override window.open to support webspatial protocol
            const originalOpen = window.open;
            window.open = function(url, target, features) {
              if (url && url.startsWith('webspatial://')) {
                // handle webspatial protocol through windowProxy
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
            
            // set navigator.userAgent to identify webspatial environment
            Object.defineProperty(navigator, 'userAgent', {
              value: 'WebSpatial/1.0 ' + navigator.userAgent,
              configurable: true
            });
            
            // send loaded message
            window.parent.postMessage({
              type: 'iframe_loaded',
              spatialId: '${spatialId}',
              url: '${url}'
            }, '${window.location.origin}');
            
            // set message handler
            window.addEventListener('message', (event) => {
              if (event.origin !== window.parent.location.origin) return;
              
              const data = event.data;
              if (data && data.type === 'webspatial_command') {
                // handle command from parent window
                console.log('Received command in iframe from parent:', data.command);
                // add command handling logic here
              }
            });
          `

          // use document.write instead of eval for security and type compliance
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
   * parse features string to object
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
   * send message to iframe with specified spatialId
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
   * get all active iframes
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
   * dispose all active iframes
   */
  public dispose(): void {
    // close all iframes
    this.iframeRegistry.forEach((iframe, spatialId) => {
      console.log(`Disposing iframe with spatialId: ${spatialId}`)
      iframe.remove()
    })
    this.iframeRegistry.clear()
  }

  // generate UUID function
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
