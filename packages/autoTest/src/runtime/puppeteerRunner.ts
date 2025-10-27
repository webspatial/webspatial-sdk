// src/runtime/puppeteerRunner.ts

import puppeteer, { Browser, Page, Viewport } from 'puppeteer'
import { JSBManager, PuppeteerPlatform } from './PuppeteerPlatform'
import { WebSpatial } from '../WebSpatial'
import { WindowStyle } from '../types/types'

export interface PuppeteerRunnerOptions {
  width?: number
  height?: number
  headless?: boolean
  timeout?: number
  enableXR?: boolean // Whether to enable XR support
}

export interface PageContentOptions {
  waitUntil?: 'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2'
  timeout?: number
}

export class PuppeteerRunner {
  private browser: Browser | null = null
  private page: Page | null = null
  private jsHandlers: Map<string, (...args: any[]) => any> = new Map()
  private isInitialized: boolean = false
  private initOptions: PuppeteerRunnerOptions = {}
  private jsbManager: JSBManager | null = null
  private puppeteerPlatform: PuppeteerPlatform | null = null
  private webSpatial: WebSpatial | null = null

  /**
   * Initialize Puppeteer configuration
   * Used to set initial parameters and configuration, does not involve browser instance creation
   */
  constructor() {}

  init(options: PuppeteerRunnerOptions = {}): void {
    console.log('Initializing Puppeteer runner with options:', options)

    // Store initialization options
    this.initOptions = {
      width: options.width || 1280,
      height: options.height || 800,
      headless: options.headless !== undefined ? options.headless : true,
      timeout: options.timeout || 60000,
      enableXR: options.enableXR || false,
      ...options,
    }

    // If XR support is enabled, initialize JSBManager
    if (this.initOptions.enableXR) {
      this.jsbManager = new JSBManager()
      this.puppeteerPlatform = new PuppeteerPlatform(this.jsbManager)
      this.setupDefaultJSBHandlers()
      // 初始化WebSpatial实例
      this.webSpatial = WebSpatial.getInstance()
      // 创建默认场景
      this.webSpatial.createScene('http://localhost:5173', WindowStyle.window)
    }

    this.isInitialized = true
    console.log('Puppeteer runner initialized successfully')
  }

  /**
   * Start Puppeteer runtime
   * @param options Configuration options
   */
  async start(options: PuppeteerRunnerOptions = {}): Promise<void> {
    // If not initialized via init method, use the provided options for initialization
    if (!this.isInitialized) {
      this.init(options)
    }

    // Merge initialization options with provided options, with provided options having higher priority
    const mergedOptions = { ...this.initOptions, ...options }
    const width = mergedOptions.width || 1280
    const height = mergedOptions.height || 800
    const headless = mergedOptions.headless ?? true
    const timeout = mergedOptions.timeout || 60000

    console.log('Starting Puppeteer with options:', {
      width,
      height,
      headless,
      timeout,
    })

    this.browser = await puppeteer.launch({
      headless,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-gpu',
        '--disable-dev-shm-usage',
        `--window-size=${width},${height}`,
      ],
      defaultViewport: { width, height },
    })

    this.page = await this.browser.newPage()

    // Set viewport size
    const viewport: Viewport = {
      width,
      height,
      deviceScaleFactor: 1,
    }
    await this.page.setViewport(viewport)

    // Set default timeout
    await this.page.setDefaultNavigationTimeout(timeout)
    await this.page.setDefaultTimeout(timeout / 2)

    console.log('Puppeteer runner started successfully')

    // If XR support is enabled, set up platform adapter and JSB bridge
    if (this.initOptions.enableXR && this.page) {
      await this.setupXREnvironment()
    }
  }

  /**
   * Navigate to specified URL
   * @param url Target URL
   * @param options Navigation options
   */
  async navigate(url: string, options?: PageContentOptions): Promise<void> {
    if (!this.page) throw new Error('Puppeteer runner not started')

    console.log(
      `Navigating to ${url} with waitUntil: ${options?.waitUntil || 'networkidle0'}`,
    )
    await this.page.goto(url, {
      waitUntil: options?.waitUntil || 'networkidle0',
      timeout: options?.timeout,
    })
    console.log('Navigation completed')
  }

  /**
   * Set page content
   * @param html HTML content
   * @param options Content loading options
   */
  async setContent(html: string, options?: PageContentOptions): Promise<void> {
    if (!this.page) throw new Error('Puppeteer runner not started')

    console.log('Setting page content')
    await this.page.setContent(html, {
      waitUntil: options?.waitUntil || 'networkidle0',
      timeout: options?.timeout,
    })
  }

  /**
   * Expose function to page
   * @param name Function name
   * @param fn Function implementation
   */
  async expose(name: string, fn: (...args: any[]) => any): Promise<void> {
    if (!this.page) throw new Error('Puppeteer runner not started')

    this.jsHandlers.set(name, fn)
    await this.page.exposeFunction(name, fn)
    console.log(`Function ${name} exposed to page`)
  }

  /**
   * Execute JavaScript in page
   * @param fn Function to execute
   * @param args Function arguments
   * @returns Execution result
   */
  async evaluate<T>(
    fn: (...args: any[]) => T | Promise<T>,
    ...args: any[]
  ): Promise<T> {
    if (!this.page) throw new Error('Puppeteer runner not started')

    // 特殊处理：如果是检查空间场景的操作，使用WebSpatial提供真实数据
    const fnStr = typeof fn === 'function' ? fn.toString() : String(fn)
    if (fnStr.includes('inspectCurrentSpatialScene')) {
      console.log(
        'Intercepting inspectCurrentSpatialScene call, using WebSpatial data',
      )

      // 使用WebSpatial实例获取场景数据
      if (this.initOptions.enableXR) {
        const sceneData = this.webSpatial?.inspectCurrentSpatialScene()
        console.log('Returning spatial scene data:', sceneData)
        return sceneData as unknown as T
      } else {
        return this.page.evaluate(fn, ...args)
      }
    }

    return this.page.evaluate(fn, ...args)
  }

  /**
   * Execute JavaScript when new document is created
   * @param fn Function to execute
   */
  async evaluateOnNewDocument(fn: () => void | Promise<void>): Promise<void> {
    if (!this.page) throw new Error('Puppeteer runner not started')

    await this.page.evaluateOnNewDocument(fn)
  }

  /**
   * Set up XR environment, replacing platform-adapter in core package
   * Mimicking visionOS WKWebViewManager initialization logic
   */
  private async setupXREnvironment(): Promise<void> {
    if (!this.page || !this.puppeteerPlatform) return

    console.log('Setting up XR environment...')

    // Inject JavaScript variables similar to WKWebViewManager.swift
    await this.page.evaluateOnNewDocument(() => {
      // Ensure window object exists
      if (typeof window !== 'undefined') {
        // Use type assertion to access custom property
        const win = window as any

        // Inject critical spatial environment variables
        win.WebSpatialEnabled = true
        win.WebSpatailNativeVersion = 'PACKAGE_VERSION'
        console.log('WebSpatialEnabled:', win.WebSpatialEnabled)
        console.log('WebSpatailNativeVersion:', win.WebSpatailNativeVersion)

        // Mock custom JSB bridge
        win.customJSBBridge = {
          messageHandlers: {
            bridge: {
              postMessage: (message: string) => {
                // This method will be overridden by our implementation in evaluate
                console.log('Mock bridge postMessage:', message)
                return Promise.resolve({})
              },
            },
          },
        }
      }

      // Save original console.log for debugging
      const originalConsoleLog = console.log
      console.log = (...args: any[]) => {
        originalConsoleLog('PAGE LOG:', ...args)
      }
    })

    // Modify User-Agent similar to WKWebViewManager.swift
    const originalUA = await this.page.evaluate(() => navigator.userAgent)
    const spatialId = 'test-spatial-id'
    const modifiedUA = `${originalUA} WebSpatial/PACKAGE_VERSION SpatialID/${spatialId}`
    await this.page.setUserAgent(modifiedUA)
    console.log('Modified User-Agent:', modifiedUA)

    // Expose inspectCurrentSpatialScene function that uses WebSpatial instance
    const webSpatial = this.webSpatial // Capture WebSpatial instance for exposeFunction
    await this.page.exposeFunction('inspectCurrentSpatialScene', async () => {
      console.log('inspectCurrentSpatialScene called directly')
      const sceneData = webSpatial?.inspectCurrentSpatialScene()
      console.log('Returning spatial scene data from WebSpatial:', sceneData)
      return sceneData
    })

    // Inject JSB message handling
    await this.expose('__handleJSBMessage', async (message: string) => {
      if (!this.jsbManager) {
        console.error('JSBManager is not initialized')
        return {}
      }

      try {
        return await this.jsbManager.handleMessage(message)
      } catch (error) {
        console.error('JSB message error:', error)
        throw error
      }
    })

    // Override platform-adapter in the page
    await this.page.evaluate(() => {
      // Mock Platform Adaptor replacement
      const mockPlatform = {
        callJSB: async (cmd: string, msg: string) => {
          try {
            // Use type assertion to avoid TypeScript errors
            const win = window as any
            const result = await win.__handleJSBMessage(`${cmd}::${msg}`)
            return {
              success: true,
              data: result,
              errorCode: undefined,
              errorMessage: undefined,
            }
          } catch (error: any) {
            return {
              success: false,
              data: null,
              errorCode: 'CommandError',
              errorMessage: error.message,
            }
          }
        },
        callWebSpatialProtocol: async (command: string, query?: string) => {
          return {
            success: true,
            data: {
              windowProxy: window,
              id: `mock-${command}-${Date.now()}`,
            },
            errorCode: undefined,
            errorMessage: undefined,
          }
        },
        callWebSpatialProtocolSync: (command: string) => {
          return {
            success: true,
            data: {
              windowProxy: window,
              id: `mock-${command}-${Date.now()}`,
            },
            errorCode: undefined,
            errorMessage: undefined,
          }
        },
      }

      // Try to replace platform in core package
      const win = window as any
      if (win.__platform_adapter_hook) {
        win.__platform_adapter_hook(mockPlatform)
      }
    })
  }

  /**
   * Set up default JSB handlers
   */
  private setupDefaultJSBHandlers(): void {
    if (!this.jsbManager) return

    console.log('Setting up default JSB handlers...')

    // Register UpdateSpatialSceneProperties command handler
    this.jsbManager.registerWithData(
      class UpdateSpatialSceneProperties {
        commandType = 'UpdateSpatialSceneProperties'
        id?: string
        name?: string
        properties?: Record<string, any>
      },
      (data, callback) => {
        console.log('Handling UpdateSpatialSceneProperties:', data)

        // Get scene ID or use default
        const sceneId = data.id || 'default-scene'

        // Check if scene exists, create if not
        let scene = this.jsbManager?.getSpatialScene(sceneId)
        if (!scene) {
          scene = {
            id: sceneId,
            name: data.name || 'Default Scene',
            version: '1.0.0',
            children: {},
            properties: {},
          }
          this.jsbManager?.addSpatialScene(sceneId, scene)
          console.log('Created new spatial scene:', sceneId)
        }

        // Update scene properties
        if (data.properties) {
          scene.properties = { ...scene.properties, ...data.properties }
        }

        // Update scene in storage
        this.jsbManager?.addSpatialScene(sceneId, scene)

        callback({ success: true })
      },
    )

    // Register CreateSpatialScene command handler
    this.jsbManager.registerWithData(
      class CreateSpatialScene {
        commandType = 'CreateSpatialScene'
        id?: string
        name?: string
        version?: string
        properties?: Record<string, any>
      },
      (data, callback) => {
        console.log('Handling CreateSpatialScene:', data)

        const sceneId = data.id || `scene-${Date.now()}`
        const scene = {
          id: sceneId,
          name: data.name || 'New Scene',
          version: data.version || '1.0.0',
          children: {},
          properties: data.properties || {},
        }

        this.jsbManager?.addSpatialScene(sceneId, scene)
        callback({ id: sceneId })
      },
    )

    // Register AddSpatializedElementToSpatialScene command handler
    this.jsbManager.registerWithData(
      class AddSpatializedElementToSpatialScene {
        commandType = 'AddSpatializedElementToSpatialScene'
        sceneId?: string
        elementId: string = ''
      },
      (data, callback) => {
        console.log('Handling AddSpatializedElementToSpatialScene:', data)

        const sceneId = data.sceneId || 'default-scene'
        const elementId = data.elementId

        // Get scene
        let scene = this.jsbManager?.getSpatialScene(sceneId)
        if (!scene) {
          // Create default scene if not exists
          scene = {
            id: sceneId,
            name: 'Default Scene',
            version: '1.0.0',
            children: {},
            properties: {},
          }
          this.jsbManager?.addSpatialScene(sceneId, scene)
        }

        // Get element
        const element = this.jsbManager?.getSpatialObject(elementId)
        if (element) {
          // Add element to scene children
          scene.children[elementId] = {
            id: elementId,
            type: element.type || 'Spatialized2DElement',
            transform: element.properties?.transform || {
              translation: [0, 0, 0],
            },
            properties: element.properties,
          }

          // Update scene
          this.jsbManager?.addSpatialScene(sceneId, scene)
          callback({ success: true })
        } else {
          callback({ success: false, error: 'Element not found' })
        }
      },
    )

    // Register InspectSpatialScene command handler
    this.jsbManager.registerWithData(
      class InspectSpatialScene {
        commandType = 'InspectSpatialScene'
        id?: string
      },
      (data, callback) => {
        console.log('Handling InspectSpatialScene:', data)

        // Get scene ID or use default
        const sceneId = data.id || 'default-scene'

        // Get scene
        let scene = this.jsbManager?.getSpatialScene(sceneId)

        // If scene doesn't exist, create a default one
        if (!scene) {
          scene = {
            id: sceneId,
            name: 'Default Scene',
            version: '1.0.0',
            children: {},
            properties: {},
          }
          this.jsbManager?.addSpatialScene(sceneId, scene)
          console.log('Created default scene for inspection')
        }

        // Return scene information
        callback(scene)
      },
    )

    // Register CreateSpatialized2DElement command handler
    this.jsbManager.registerWithData(
      class CreateSpatialized2DElement {
        commandType = 'CreateSpatialized2DElement'
      },
      (data, callback) => {
        console.log('Handling CreateSpatialized2DElement:', data)
        const elementId = `element-${Date.now()}`
        // Store element
        this.jsbManager?.addSpatialObject(elementId, {
          id: elementId,
          type: 'Spatialized2DElement',
          properties: data,
        })
        callback({ id: elementId })
      },
    )

    // Register UpdateSpatialized2DElementProperties command handler
    this.jsbManager.registerWithData(
      class UpdateSpatialized2DElementProperties {
        commandType = 'UpdateSpatialized2DElementProperties'
        id: string = ''
      },
      (data, callback) => {
        console.log('Handling UpdateSpatialized2DElementProperties:', data)
        const element = this.jsbManager?.getSpatialObject(data.id)
        console.log('found element:', element)
        if (element) {
          element.properties = { ...element.properties, ...data }
          this.jsbManager?.addSpatialObject(data.id, element)
          callback({ success: true })
        } else {
          console.log('Element not found:', data.id)
          callback({ success: false, error: 'Element not found' })
        }
      },
    )

    // Register Inspect command handler
    this.jsbManager.registerWithData(
      class Inspect {
        commandType = 'Inspect'
        id: string = ''
      },
      (data, callback) => {
        console.log('Handling Inspect:', data)
        if (data.id) {
          const object = this.jsbManager?.getSpatialObject(data.id)
          callback(object || { id: data.id, exists: false })
        } else {
          // Return all objects
          const objects: any[] = []
          this.jsbManager?.spatialObjects.forEach(obj => objects.push(obj))
          callback({ objects })
        }
      },
    )
  }

  /**
   * Get spatial object
   * @param id Object ID
   */
  getSpatialObject(id: string): any | undefined {
    return this.jsbManager?.getSpatialObject(id)
  }

  /**
   * Register custom JSB command handler
   */
  registerJSBHandler(
    commandType: string,
    handler: (data: any, callback: (result: any) => void) => void,
  ): void {
    if (!this.jsbManager) {
      throw new Error('JSBManager not initialized. Enable XR support first.')
    }

    this.jsbManager.registerWithData(
      class CustomCommand {
        commandType = commandType
      },
      handler,
    )
  }

  /**
   * Wait for element to be visible
   * @param selector CSS selector
   * @param timeout Timeout duration
   */
  async waitForSelector(selector: string, timeout?: number): Promise<void> {
    if (!this.page) throw new Error('Puppeteer runner not started')

    console.log(`Waiting for selector: ${selector}`)
    await this.page.waitForSelector(selector, { timeout })
    console.log(`Selector ${selector} found`)
  }

  /**
   * Click element
   * @param selector CSS selector
   */
  async click(selector: string): Promise<void> {
    if (!this.page) throw new Error('Puppeteer runner not started')

    console.log(`Clicking element: ${selector}`)
    await this.page.click(selector)
  }

  /**
   * Get element text content
   * @param selector CSS selector
   * @returns Text content
   */
  async getElementText(selector: string): Promise<string | null | undefined> {
    if (!this.page) throw new Error('Puppeteer runner not started')

    return this.page.$eval(selector, (el: Element) => el.textContent)
  }

  /**
   * Check if element has --xr-back property
   * @param selector CSS selector
   */
  async hasXrBackProperty(selector: string): Promise<boolean> {
    if (!this.page) throw new Error('Puppeteer runner not started')

    return this.page.$eval(selector, el => {
      const computedStyle = window.getComputedStyle(el)
      return computedStyle.getPropertyValue('--xr-back') !== ''
    })
  }

  /**
   * Get element's --xr-back property value
   * @param selector CSS selector
   */
  async getXrBackPropertyValue(selector: string): Promise<string> {
    if (!this.page) throw new Error('Puppeteer runner not started')

    return this.page.$eval(selector, el => {
      const computedStyle = window.getComputedStyle(el)
      return computedStyle.getPropertyValue('--xr-back').trim()
    })
  }

  /**
   * Wait for function condition to be met
   * @param fn Wait condition function
   * @param options Waiting options
   */
  async waitForFunction(
    fn: string | ((...args: any[]) => boolean | Promise<boolean> | null),
    options?: {
      polling?: number | 'raf' | 'mutation'
      timeout?: number
    },
  ): Promise<void> {
    if (!this.page) throw new Error('Puppeteer runner not started')

    await this.page.waitForFunction(fn, options)
  }

  /**
   * Take screenshot
   * @param path Save path
   * @param options Screenshot options
   */
  async screenshot(path?: string, options?: any): Promise<void> {
    if (!this.page) throw new Error('Puppeteer runner not started')

    console.log(`Taking screenshot${path ? ` to ${path}` : ''}`)
    await this.page.screenshot({ path, ...options })
  }

  /**
   * Close Puppeteer runtime
   */
  async close(): Promise<void> {
    console.log('Closing Puppeteer runner')
    if (this.browser) {
      await this.browser.close()
      this.browser = null
      this.page = null
      this.jsHandlers.clear()
      console.log('Puppeteer runner closed')
    }
  }
}
