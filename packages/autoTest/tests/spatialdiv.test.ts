import { expect } from 'chai'
import { PuppeteerRunner } from '../src/runtime/puppeteerRunner'
import { spawn, ChildProcess } from 'child_process'
import { before, after } from 'mocha'
import 'source-map-support/register'

let runner: PuppeteerRunner | null = null
let server: ChildProcess | null = null

describe('Enables spatial capabilities in HTML elements with nesting support tests', function (this: Mocha.Suite) {
  this.timeout(150000 * 360000)

  before(async () => {
    console.log('Starting Vite server...')

    // Ensure using the correct npm command path
    const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm'

    // Start Vite server and capture output for debugging
    server = spawn(npmCmd, ['run', 'devAVP'], {
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: true,
    })

    // Output server logs for debugging
    server.stdout?.on('data', (data: Buffer) => {
      console.log(`Server stdout: ${data}`)
    })

    server.stderr?.on('data', (data: Buffer) => {
      console.error(`Server stderr: ${data}`)
    })

    server.on('error', (error: Error) => {
      console.error(`Server error: ${error.message}`)
    })

    // Wait for server to start using a more reliable approach
    console.log('Waiting for server to start...')
    await new Promise(resolve => setTimeout(resolve, 5000))

    // init  puppeteer Runtime
    runner = new PuppeteerRunner()

    runner.init({
      width: 1280,
      height: 800,
      headless: true,
      timeout: 30000,
      enableXR: true, // Enable XR support for testing JSBCommand and spatial features
      devtools: true, // Enable devtools for debugging
    })

    // start runner
    await runner.start()
  })

  after(async () => {
    console.log('Cleaning up...')
    if (runner && runner.close) {
      await runner.close()
    }
    if (server) {
      if (server.pid) {
        try {
          process.kill(-server.pid)
        } catch {
          server.kill('SIGTERM')
        }
      } else {
        server.kill('SIGTERM')
      }
    }
  })

  it('should become a spatial div when enable-xr is present in html', async () => {
    if (!runner) throw new Error('Puppeteer runner not initialized')
    await runner.navigate('http://localhost:5173/', {
      waitUntil: 'networkidle0',
      timeout: 30000,
    })

    // inject Log
    await runner.evaluate(() => {
      ;(window as any).__capturedLogs = []
      const curConsoleLog = console.log
      console.log = (...args: any[]) => {
        // Use a safer approach to handle objects with potential circular references
        const logMsg = args
          .map(arg => {
            if (typeof arg === 'object' && arg !== null) {
              try {
                // Try to stringify simple objects
                return JSON.stringify(arg)
              } catch (e) {
                // For circular objects, use a safer representation
                return (
                  '[Circular Object: ' +
                  (arg.constructor?.name || 'Object') +
                  ']'
                )
              }
            }
            return String(arg)
          })
          .join(' ')
        ;(window as any).__capturedLogs.push(logMsg)
        curConsoleLog(...args)
      }
    })

    const spatilized2DElementId = await runner.evaluate(() => {
      const spatialdiv = document.querySelector(
        '[data-testid="spatial-div"]',
      ) as HTMLDivElement
      if (spatialdiv) {
        const spatializedElement = window.getSpatialized2DElement(spatialdiv)
        console.log('spatializedElement: ', spatializedElement)
        return spatializedElement.id
      } else {
        console.log('spatialdiv not found')
        return null
      }
    })
    console.log('spatilized2DElementId: ', spatilized2DElementId)
    expect(spatilized2DElementId).to.be.not.null
    const spatialSceneFoundElement = runner
      .getCurrentScene()
      ?.findSpatialObject(spatilized2DElementId)
    expect(spatialSceneFoundElement).to.be.not.null
  })

  it('shoud becoma a spatializedElement when enableXr is presented in style', async () => {
    if (!runner) throw new Error('Puppeteer runner not initialized')
    await runner.navigate('http://localhost:5173/', {
      waitUntil: 'networkidle0',
      timeout: 30000,
    })

    // 1. 找到data-testid为"spatial-div-2"的元素
    // 2. 检查它的style中enableXr是否为true
    // 3. 如果是true，检查它是否在SpatialScene中

    // 注入日志捕获以辅助调试
    await runner.evaluate(() => {
      ;(window as any).__capturedLogs = []
      const curConsoleLog = console.log
      console.log = (...args: any[]) => {
        const logMsg = args
          .map(arg => {
            if (typeof arg === 'object' && arg !== null) {
              try {
                return JSON.stringify(arg)
              } catch (e) {
                return (
                  '[Circular Object: ' +
                  (arg.constructor?.name || 'Object') +
                  ']'
                )
              }
            }
            return String(arg)
          })
          .join(' ')
        ;(window as any).__capturedLogs.push(logMsg)
        curConsoleLog(...args)
      }
    })

    // 检查元素是否存在并获取其spatializedElement ID
    const spatilized2DElementId = await runner.evaluate(() => {
      const spatialdiv = document.querySelector(
        '[data-testid="spatial-div-2"]',
      ) as HTMLDivElement
      if (spatialdiv) {
        console.log('Found spatial-div-2 element')

        // 检查style中的enableXr值
        const style = spatialdiv.style
        const computedStyle = window.getComputedStyle(spatialdiv)
        console.log('Element style:', style.cssText)
        console.log('Computed style:', computedStyle.cssText)

        // 获取spatializedElement
        const spatializedElement = window.getSpatialized2DElement(spatialdiv)
        console.log('spatializedElement:', spatializedElement)
        return spatializedElement ? spatializedElement.id : null
      } else {
        console.log('spatial-div-2 not found')
        return null
      }
    })

    console.log('spatialized2DElementId:', spatilized2DElementId)

    // 验证元素已成为spatializedElement（有ID）
    expect(spatilized2DElementId).to.be.not.null

    // expect the spatializedElement to be in SpatialScene
    const spatialSceneFoundElement = runner
      .getCurrentScene()
      ?.findSpatialObject(spatilized2DElementId)
    console.log('spatialSceneFoundElement:', spatialSceneFoundElement)
    expect(spatialSceneFoundElement).to.be.not.null

    // obtain and print captured logs
    const logs = await runner.evaluate(
      () => (window as any).__capturedLogs || [],
    )
    console.log('Captured logs:', logs)
  })

  it('should become a spatializedElememnt when enableXr is presented in className', async () => {
    if (!runner) throw new Error('Puppeteer runner not initialized')
    await runner.navigate('http://localhost:5173/', {
      waitUntil: 'networkidle0',
      timeout: 30000,
    })

    // 1. find the element with data-testid为"spatial-div-3"
    // 2. check if className has __enableXr__
    // 3. if has, check if it is in SpatialScene

    // inject log capture to help debug
    await runner.evaluate(() => {
      ;(window as any).__capturedLogs = []
      const curConsoleLog = console.log
      console.log = (...args: any[]) => {
        const logMsg = args
          .map(arg => {
            if (typeof arg === 'object' && arg !== null) {
              try {
                return JSON.stringify(arg)
              } catch (e) {
                return (
                  '[Circular Object: ' +
                  (arg.constructor?.name || 'Object') +
                  ']'
                )
              }
            }
            return String(arg)
          })
          .join(' ')
        ;(window as any).__capturedLogs.push(logMsg)
        curConsoleLog(...args)
      }
    })

    // check if className has xr-spatial-default(__enableXr__ will become xr-spatial-default after react SDK translation)
    const classNameTestResult = await runner.evaluate(() => {
      const spatialdiv = document.querySelector(
        '[data-testid="spatial-div-3"]',
      ) as HTMLDivElement
      if (spatialdiv) {
        console.log('Found spatial-div-3 element')
        console.log('Element className:', spatialdiv.className)

        // check if className has xr-spatial-default
        const hasEnableXrClass =
          spatialdiv.classList.contains('xr-spatial-default')
        console.log('Has xr-spatial-default class:', hasEnableXrClass)

        // if has xr-spatial-default class, get spatializedElement id
        if (hasEnableXrClass) {
          const spatializedElement = window.getSpatialized2DElement(spatialdiv)
          console.log('spatializedElement:', spatializedElement)
          return {
            hasClass: true,
            elementId: spatializedElement ? spatializedElement.id : null,
          }
        }
        return {
          hasClass: false,
          elementId: null,
        }
      } else {
        console.log('spatial-div-3 not found')
        return {
          hasClass: false,
          elementId: null,
        }
      }
    })

    console.log('classNameTestResult:', classNameTestResult)

    // expect className has xr-spatial-default
    expect(classNameTestResult.hasClass).to.be.true

    // expect the test element has a spatializedElement id
    expect(classNameTestResult.elementId).to.be.not.null

    // expect the test element exists in SpatialScene
    const spatialSceneFoundElement = runner
      .getCurrentScene()
      ?.findSpatialObject(classNameTestResult.elementId)
    console.log('spatialSceneFoundElement:', spatialSceneFoundElement)
    expect(spatialSceneFoundElement).to.be.not.null

    const logs = await runner.evaluate(
      () => (window as any).__capturedLogs || [],
    )
    console.log('Captured logs:', logs)
  })
})
