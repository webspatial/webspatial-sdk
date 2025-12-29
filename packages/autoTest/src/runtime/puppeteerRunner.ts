// src/runtime/puppeteerRunner.ts

import puppeteer, { Browser, Page, Viewport } from 'puppeteer'
import { WebSpatial } from '../WebSpatial'
import { BackgroundMaterial, WindowStyle, SpatialScene } from '../types/types'
import {
  UpdateSpatialSceneProperties,
  CreateSpatialScene,
  AddSpatializedElementToSpatialScene,
  InspectSpatialScene,
  CreateSpatialized2DElement,
  UpdateSpatialized2DElementProperties,
  UpdateSpatializedElementTransform,
  Inspect,
  DestroyCommand,
} from '../types/JSBCommand'
import JSBManager from '../manager/JSBManager'
import { SpatializedElement } from '../model/SpatializedElement'

interface CustomReplyData {
  type: string
  name: string
}

const baseReplyData: CustomReplyData = {
  type: 'BasicData',
  name: 'jsb call back',
}

export interface PuppeteerRunnerOptions {
  width?: number
  height?: number
  headless?: boolean
  timeout?: number
  enableXR?: boolean // Whether to enable XR support
  devtools?: boolean // Whether to enable devtools
}

export interface PageContentOptions {
  waitUntil?: 'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2'
  timeout?: number
}
let firstLoad = true

export class PuppeteerRunner {
  private browser: Browser | null = null
  private page: Page | null = null
  private jsHandlers: Map<string, (...args: any[]) => any> = new Map()
  private isInitialized: boolean = false
  private initOptions: PuppeteerRunnerOptions = {}
  private jsbManager: JSBManager | null = null
  // private puppeteerPlatform: PuppeteerPlatform | null = null
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
      devtools: options.devtools || false,
      ...options,
    }

    // If XR support is enabled, initialize JSBManager
    if (this.initOptions.enableXR) {
      this.jsbManager = new JSBManager()
      this.setupDefaultJSBHandlers()
      // Initialize WebSpatial instance
      this.webSpatial = WebSpatial.getInstance()
      // Create default scene
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
    const devtools = mergedOptions.devtools ?? false
    // const isCI = process.env.CI === 'true'
    // const devtools = mergedOptions.devtools ?? !isCI

    console.log('Starting Puppeteer with options:', {
      width,
      height,
      headless,
      timeout,
    })

    this.browser = await puppeteer.launch({
      headless: headless,
      devtools: devtools,
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

    // Forward browser-side errors and logs to Node for CI visibility
    this.page.on('pageerror', error => {
      console.error('Puppeteer pageerror:', error)
    })
    this.page.on('requestfailed', req => {
      console.error('Puppeteer requestfailed:', req.url(), req.failure()?.errorText)
    })
    this.page.on('console', msg => {
      try {
        console.log(`[browser:${msg.type()}]`, msg.text())
      } catch (e) {
        console.log(`[browser:${msg.type()}]`, 'Console message parse error')
      }
    })

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
   * Get current spatial scene
   * @returns Current spatial scene instance
   */
  public getCurrentScene(): SpatialScene | null {
    return this.webSpatial?.getCurrentScene() || null
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
    if (this.initOptions.enableXR) {
      const scene = this.getCurrentScene()
      if (scene && typeof (scene as any).onPageStartLoad === 'function') {
        ;(scene as any).onPageStartLoad()
      }
    }
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
    if (this.initOptions.enableXR) {
      const scene = this.getCurrentScene()
      if (scene && typeof (scene as any).onPageStartLoad === 'function') {
        ;(scene as any).onPageStartLoad()
      }
    }
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

    // Special handling: when inspecting the spatial scene, use WebSpatial data
    const fnStr = typeof fn === 'function' ? fn.toString() : String(fn)
    if (fnStr.includes('inspectCurrentSpatialScene')) {
      console.log(
        'Intercepting inspectCurrentSpatialScene call, using WebSpatial data',
      )

      // Use WebSpatial instance to obtain scene data
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

  async on(event: string, handler: (...args: any[]) => void): Promise<void> {
    if (!this.page) throw new Error('Puppeteer runner not started')

    await this.page.on(event, handler)
  }

  /**
   * Set up XR environment, replacing platform-adapter in core package
   * Mimicking visionOS WKWebViewManager initialization logic
   */
  private async setupXREnvironment(): Promise<void> {
    if (!this.page) return

    console.log('Setting up XR environment...')

    // Expose log forwarding function to browser environment
    await this.page.exposeFunction(
      '__forwardLogsToNode',
      (level: string, args: any[]) => {
        const timestamp = new Date().toISOString()
        const formattedArgs = args.map(arg => {
          try {
            return typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
          } catch (e) {
            return '[Circular object]'
          }
        })

        // Add SDK identification logic
        let source = 'PAGE'
        const logContent = formattedArgs.join(' ')
        if (logContent.includes('core SDK')) {
          source = 'CORE-SDK'
        } else if (logContent.includes('react SDK')) {
          source = 'REACT-SDK'
        }

        // Print with source identification
        console[level === 'error' ? 'error' : 'log'](
          `[${timestamp}] [${source}]`,
          ...formattedArgs,
        )
      },
    )

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

        // Override all console methods to forward logs to Node.js
        // Use type assertion to handle console methods safely
        const consoleMethods: Array<
          'log' | 'error' | 'warn' | 'info' | 'debug'
        > = ['log', 'error', 'warn', 'info', 'debug']
        consoleMethods.forEach(method => {
          const originalMethod = (console as any)[method]
          ;(console as any)[method] = (...args: any[]) => {
            try {
              // Forward logs to Node.js environment
              if (win.__forwardLogsToNode) {
                win.__forwardLogsToNode(method, args)
              }
            } catch (e) {
              // Fallback to original method if forwarding fails
              originalMethod('LOG FORWARDING ERROR:', e)
              originalMethod(...args)
            }
            // Also keep original behavior for browser console
            originalMethod(...args)
          }
        })
      }
    })

    // Modify User-Agent similar to WKWebViewManager.swift
    const originalUA = await this.page.evaluate(() => navigator.userAgent)
    const spatialId = 'test-spatial-id'
    const modifiedUA = `${originalUA} WebSpatial/PACKAGE_VERSION SpatialID/${spatialId} Puppeteer`
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

    // Set up iframe message listener
    await this.page.exposeFunction('onIframeLoaded', (data: any) => {
      this.handleIframeLoaded(data)
    })

    await this.page.on('framenavigated', frame => {
      // Only listen to the main page
      if (frame !== this.page?.mainFrame()) return

      if (firstLoad) {
        firstLoad = false // First load; ignore
        return
      }

      console.log('Detected a refresh:', frame.url(), 'reset spatial Scene')
      this.webSpatial?.getCurrentScene()?.onPageStartLoad()
    })

    // Inject message listener script
    await this.page.evaluateOnNewDocument(() => {
      // Set up global message listener to catch iframe loaded events
      window.addEventListener('message', event => {
        console.log(
          'Puppeteer Runner Received iframe_loaded message:',
          event.data,
        )
        try {
          // Validate the message source (iframe)
          if (event.source && event.source !== window) {
            const data = event.data

            // Check if this is an iframe_loaded message
            if (data && data.type === 'iframe_loaded') {
              // Forward the message to puppeteer runner
              const win = window as any
              if (win.onIframeLoaded) {
                win.onIframeLoaded(data)
              }
            }
          }
        } catch (error) {
          console.error('Error handling message event:', error)
        }
      })

      // Override window.open to support webspatial protocol
      const originalOpen = window.open
      window.open = function (
        url?: string | URL,
        target?: string,
        features?: string,
      ): Window | null {
        // Handle the case where url may be undefined
        const urlStr = url?.toString() || ''
        if (urlStr.startsWith('webspatial://')) {
          console.log('Intercepted webspatial protocol URL:', urlStr)
          // Handle webspatial protocol URLs
          return null
        }
        return originalOpen.call(window, url, target, features)
      }
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
  }

  /**
   * Set up default JSB handlers
   */
  private setupDefaultJSBHandlers(): void {
    if (!this.jsbManager) return

    console.log('Setting up default JSB handlers...')

    // Register UpdateSpatialSceneProperties command handler
    this.jsbManager.registerWithData(
      UpdateSpatialSceneProperties,
      (data, callback) => {
        console.log('Handling UpdateSpatialSceneProperties:', data)

        let sceneId: string | undefined
        let foundScene: any = undefined

        // Get scene ID or use default
        if (this.webSpatial) {
          foundScene = this.webSpatial.getCurrentScene()
          if (foundScene) {
            sceneId = foundScene.id
            console.log('Found scene ID:', sceneId)
            // Use !== undefined to correctly handle 0 or empty string as valid values
            if (data.cornerRadius !== undefined) {
              foundScene.cornerRadius = data.cornerRadius
            }
            if (data.material !== undefined) {
              foundScene.backgroundMaterial =
                data.material as BackgroundMaterial
            }
            if (data.opacity !== undefined) {
              foundScene.opacity = data.opacity
            }
          }
        }
        console.log(
          'Updated scene properties:',
          'opacity:',
          foundScene.opacity,
          'material:',
          foundScene.backgroundMaterial,
          'cornerRadius:',
          foundScene.cornerRadius,
        )

        // If scene is not found, use a default ID
        if (!sceneId) {
          console.log(
            'No scene ID found, using default:',
            data.id || 'default-scene',
          )
          sceneId = data.id || 'default-scene'
        }

        callback({ success: true, data: baseReplyData })
      },
    )

    // Register CreateSpatialScene command handler
    this.jsbManager.registerWithData(CreateSpatialScene, (data, callback) => {
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
    })

    // Register AddSpatializedElementToSpatialScene command handler
    this.jsbManager.registerWithData(
      AddSpatializedElementToSpatialScene,
      (data, callback) => {
        console.log('Handling AddSpatializedElementToSpatialScene:', data)

        const elementId = data.spatializedElementId
        // Get scene
        if (this.webSpatial) {
          const foundScene = this.webSpatial.getCurrentScene()
          if (foundScene) {
            console.log(
              'AddSpatializedElementToSpatialScene Found scene id:',
              foundScene.id,
            )
            const spatializedElement: SpatializedElement | null =
              foundScene.findSpatialObject(elementId)

            if (!spatializedElement) {
              console.log(
                'AddSpatializedElementToSpatialScene spatializedElement not found:',
                elementId,
              )
              callback({
                success: false,
                error:
                  'invalid addSpatializedElementCommand spatial object id not exsit!',
              })
              return
            }
            console.log(
              'AddSpatializedElementToSpatialScene spatializedElement found:',
              spatializedElement.id,
            )
            spatializedElement.setParent(foundScene)
            foundScene.addChild(spatializedElement)
          }
        }
        callback({ success: true, data: baseReplyData })
      },
    )
    // Register InspectSpatialScene command handler
    this.jsbManager.registerWithData(InspectSpatialScene, (data, callback) => {
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
    })

    // Register CreateSpatialized2DElement command handler
    this.jsbManager.registerWithData(
      CreateSpatialized2DElement,
      (data, callback) => {
        console.log('Handling CreateSpatialized2DElement from platform:', data)
        const elementId = data.id
        const url = data.url
        // Store element
        const spatialScene = this.webSpatial?.getCurrentScene()
        if (!spatialScene) {
          console.log('CreateSpatialized2DElement spatialScene not found')
          callback({
            success: false,
            error:
              'invalid createSpatialized2DElementCommand, spatial scene not exsit!',
          })
          return
        }
        console.log(
          'CreateSpatialized2DElement spatialScene found:',
          spatialScene.id,
        )
        const spatializedElementWebViewModel =
          spatialScene.createSpatializedElement(url, elementId)
        if (!spatializedElementWebViewModel) {
          console.log(
            'CreateSpatialized2DElement spatializedElementWebViewModel not created:',
            elementId,
          )
          callback({
            success: false,
            error:
              'invalid createSpatialized2DElementCommand, spatialized element web view model not exsit!',
          })
          return
        }

        // add element to jsbManager spatialObjects
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
      UpdateSpatialized2DElementProperties,
      (data, callback) => {
        // console.log('Handling UpdateSpatialized2DElementProperties:', data)
        const elementId = data.id || (data as any).spatialObject?.id
        // console.log('Handling UpdateSpatialized2DElementProperties with ID:', elementId)
        // console.log('UpdateSpatialized2DElementProperties id:', data.id)

        // update jsbManager spatialObjects properties
        const element = this.jsbManager?.getSpatialObject(data.id)
        console.log('found element:', element)
        if (element) {
          element.properties = { ...element.properties, ...data }
          this.jsbManager?.addSpatialObject(data.id, element)
          // console.log('UpdateSpatialized2DElementProperties jsbManager updated element:', element)
        } else {
          console.log('Element not found:', data.id)
          callback({ success: false, error: 'Element not found' })
        }

        // update spatialScene spatializedElement properties
        this.webSpatial
          ?.getCurrentScene()
          ?.handleUpdateSpatialized2DElementProperties(data)
        const spatialized2DElement = this.webSpatial
          ?.getCurrentScene()
          ?.findSpatialObject(elementId)
        // console.log('UpdateSpatialized2DElementProperties spatialScene updated element:', spatialized2DElement)
        callback({ success: true })
      },
    )

    this.jsbManager.registerWithData(
      UpdateSpatializedElementTransform,
      (data, callback) => {
        // console.log('Handling UpdateSpatializedElementTransform:', data)

        // Check whether data.id exists
        if (!data.id) {
          console.log('Missing element id')
          callback({ success: false, error: 'Missing element id' })
          return
        }

        // update jsbManager spatialObjects transform
        const element = this.jsbManager?.getSpatialObject(data.id)
        console.log('found element:', element)
        if (element) {
          // Following VisionOS implementation: check and use the matrix array
          if (data.matrix) {
            // Validate that matrix array length equals 16
            if (data.matrix.length !== 16) {
              console.log('Received matrix array does not have 16 elements.')
              callback({
                success: false,
                error: 'Invalid matrix: should have 16 elements',
              })
              return
            }

            // Create transform object using the matrix array
            // Simulate the VisionOS matrix handling
            element.transform = {
              matrix: data.matrix,
              // Preserve existing transform properties
              ...element.transform,
            }
          } else {
            // If no matrix present, preserve existing behavior
            element.transform = { ...element.transform, ...data }
          }

          this.jsbManager?.addSpatialObject(data.id, element)
        } else {
          console.log('Element not found:', data.id)
          callback({
            success: false,
            error:
              'invalid UpdateSpatializedElementTransform spatial object id not exist!',
          })
          return
        }

        // update spatialScene spatializedElement transform
        this.webSpatial
          ?.getCurrentScene()
          ?.handleUpdateSpatializedElementTransform(data)
        const spatializedElement = this.webSpatial
          ?.getCurrentScene()
          ?.findSpatialObject(data.id)
        // console.log(
        //   'UpdateSpatializedElementTransform spatialScene updated element:',
        //   spatializedElement,
        // )
        callback({ success: true })
      },
    )

    // Register Inspect command handler
    this.jsbManager.registerWithData(Inspect, (data, callback) => {
      console.log('Handling Inspect:', data)

      if (data.id) {
        const object = this.jsbManager?.getSpatialObject(data.id)
        callback(object || { id: data.id, exists: false })
      } else {
        // Return current spatial Scene
        const sceneData = this.webSpatial?.inspectCurrentSpatialScene()
        callback({ sceneData })
      }
    })

    this.jsbManager.registerWithData(DestroyCommand, (data, callback) => {
      console.log('Handling DestroyCommand: ', data)

      if (data.id) {
        // remove SpatialObject in jsbManager
        const object = this.jsbManager?.getSpatialObject(data.id)
        if (object) {
          this.jsbManager?.removeSpatialObject(data.id)
        }
        // remove SpatialObject in spatialScene
        const spatialSceneObject =
          this.webSpatial?.getCurrentScene()?.spatialObjects[data.id]
        if (spatialSceneObject) {
          spatialSceneObject.destroy()
        }
        callback({ success: true })
      } else {
        callback({ success: false, error: 'Missing object id' })
      }
    })
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
      // Create a dynamic class for custom command
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

    return this.page.$eval(selector, (el: Element) => {
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

    return this.page.$eval(selector, (el: Element) => {
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
   * Handle iframe loaded event and trigger spatial_iframe_created event
   */
  private handleIframeLoaded(data: any): void {
    console.log('Puppeteer Runner Handling iframe loaded event:', data)
    // can trigger spatial_iframe_created event
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
