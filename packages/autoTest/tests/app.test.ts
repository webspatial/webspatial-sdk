import { expect } from 'chai'
import { spawn, ChildProcess } from 'child_process'
import { existsSync } from 'fs'
import * as path from 'path'
import { PuppeteerRunner } from '../src/runtime/puppeteerRunner'
import 'source-map-support/register'

let runner: PuppeteerRunner | null = null
let server: ChildProcess | null = null

describe('React App E2E Test', function () {
  this.timeout(30000) // Increase timeout duration

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

    // Initialize Puppeteer runtime
    runner = new PuppeteerRunner()

    // Initialize configuration first and enable XR support
    runner.init({
      width: 1280,
      height: 800,
      headless: true,
      timeout: 30000,
      enableXR: true, // Enable XR support for testing JSBCommand and spatial features
    })

    // Then start the browser instance
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

  it('renders and increments count', async function () {
    if (!runner) throw new Error('Puppeteer runner not initialized')

    console.log('Navigating to app...')
    try {
      // Navigate to the app page
      await runner.navigate('http://localhost:5173', {
        waitUntil: 'networkidle0',
        timeout: 15000,
      })

      // Wait for counter element to be visible (using evaluate and custom wait)
      console.log('Page loaded, checking for counter element...')
      await runner.evaluate(() => {
        return new Promise((resolve, reject) => {
          const startTime = Date.now()
          const checkInterval = setInterval(() => {
            const el = document.querySelector('[data-testid="counter"]')
            if (el) {
              clearInterval(checkInterval)
              resolve(el)
            } else if (Date.now() - startTime > 5000) {
              clearInterval(checkInterval)
              reject(new Error('Counter element not found within timeout'))
            }
          }, 100)
        })
      })

      // Get initial counter value
      const initialText = await runner.evaluate(() => {
        const el = document.querySelector('[data-testid="counter"]')
        return el ? el.textContent : null
      })
      console.log(`Initial counter text: ${initialText}`)
      expect(initialText).to.include('0')

      // Click increment button
      console.log('Clicking increment button...')
      await runner.evaluate(() => {
        const btn = document.querySelector('[data-testid="btn"]')
        if (btn) {
          ;(btn as HTMLElement).click()
        }
      })

      // Wait for UI to update and counter becomes 1
      await runner.evaluate(() => {
        return new Promise((resolve, reject) => {
          const startTime = Date.now()
          const checkInterval = setInterval(() => {
            const el = document.querySelector('[data-testid="counter"]')
            if (el && el.textContent?.includes('1')) {
              clearInterval(checkInterval)
              resolve(true)
            } else if (Date.now() - startTime > 5000) {
              clearInterval(checkInterval)
              reject(new Error('Counter did not update within timeout'))
            }
          }, 100)
        })
      })

      // Get updated counter value
      const updatedText = await runner.evaluate(() => {
        const el = document.querySelector('[data-testid="counter"]')
        return el ? el.textContent : null
      })
      console.log(`Updated counter text: ${updatedText}`)
      expect(updatedText).to.include('1')

      console.log('Test passed!')
    } catch (error) {
      console.error('Test failed with error:', error)
      // Capture page screenshot for debugging
      if (runner && runner.screenshot) {
        await runner.screenshot('test-failure.png')
        console.log('Screenshot saved for debugging')
      }
      throw error
    }
  })

  it('tests --xr-back property on spatial elements', async function () {
    if (!runner) throw new Error('Puppeteer runner not initialized')

    console.log('Testing --xr-back property...')
    try {
      // Navigate to the app page
      await runner.navigate('http://localhost:5173', {
        waitUntil: 'networkidle0',
        timeout: 15000,
      })

      // Wait for XR elements to load
      console.log('Waiting for spatial elements...')
      // Use evaluate to wait for element
      await runner.evaluate(() => {
        return new Promise((resolve, reject) => {
          const startTime = Date.now()
          const checkInterval = setInterval(() => {
            const el = document.querySelector('.spatial-div')
            if (el) {
              clearInterval(checkInterval)
              resolve(el)
            } else if (Date.now() - startTime > 5000) {
              clearInterval(checkInterval)
              reject(new Error('Spatial element not found within timeout'))
            }
          }, 100)
        })
      })

      // Check whether element has --xr-back property
      const hasXrBack = await runner.evaluate(() => {
        const el = document.querySelector('.spatial-div')
        if (!el) return false
        const computedStyle = window.getComputedStyle(el)
        return computedStyle.getPropertyValue('--xr-back') !== ''
      })
      console.log(`Element has --xr-back property: ${hasXrBack}`)
      expect(hasXrBack).to.be.true

      // Get value of --xr-back property
      const xrBackValue = await runner.evaluate(() => {
        const el = document.querySelector('.spatial-div')
        if (!el) return ''
        const computedStyle = window.getComputedStyle(el)
        return computedStyle.getPropertyValue('--xr-back').trim()
      })
      console.log(`--xr-back property value: ${xrBackValue}`)
      // Verify the property value is not empty
      expect(xrBackValue).to.not.be.empty

      console.log('--xr-back property test passed!')
    } catch (error) {
      console.error('--xr-back property test failed with error:', error)
      if (runner && runner.screenshot) {
        await runner.screenshot('xr-back-test-failure.png')
        console.log('Screenshot saved for debugging')
      }
      throw error
    }
  })

  it('tests JSB message handling with TestSpatialSceneJSB command', async function () {
    if (!runner) throw new Error('Puppeteer runner not initialized')

    console.log('Testing JSB message handling...')
    try {
      // Register a custom JSB command handler to test SpatialScene interactions
      runner.registerJSBHandler('TestSpatialSceneJSB', (data, callback) => {
        console.log('Custom JSB handler called with data:', data)
        callback({
          success: true,
          message: 'SpatialScene JSB test successful',
          timestamp: Date.now(),
        })
      })

      // Execute JSB command test in page
      const res = await runner.evaluate(async () => {
        // Simulate invoking JSB command
        const win = window as any
        const data = JSON.stringify({
          data: 'test-JSB',
        })
        if (win.__handleJSBMessage) {
          const result = await win.__handleJSBMessage(
            `TestSpatialSceneJSB::${data}`,
          )
          console.log('JSB test command result:', result)
          return result
        }
        return { error: 'JSB handler not available' }
      })
      console.log('JSB test command result:', res)
      expect(res).to.have.property('success', true)

      console.log('JSB message handling test passed!')
    } catch (error) {
      console.error('JSB message handling test failed with error:', error)
      if (runner && runner.screenshot) {
        await runner.screenshot('jsb-message-test-failure.png')
        console.log('Screenshot saved for debugging')
      }
      throw error
    }
  })

  it('tests spatial scene and element creation via JSB', async function () {
    if (!runner) throw new Error('Puppeteer runner not initialized')

    console.log('Testing spatial scene and element creation...')

    // Register custom command handler to simulate spatial scene creation
    runner.registerJSBHandler('CreateSpatialScene', (data, callback) => {
      console.log('Creating spatial scene with:', data)
      const sceneId = `scene-${Date.now()}`
      callback({ id: sceneId, success: true })
    })

    try {
      // Simulate creating spatial scene in page
      const sceneResult = await runner.evaluate(async () => {
        const win = window as any
        if (win.__handleJSBMessage) {
          const result = await win.__handleJSBMessage('CreateSpatialScene::{}')
          return result
        }
        throw new Error('JSB handler not available')
      })

      console.log('Spatial scene creation result:', sceneResult)
      expect(sceneResult).to.have.property('id')
      expect(sceneResult).to.have.property('success', true)

      // Test updating Spatialized2DElement properties
      const updateResult = await runner.evaluate(async () => {
        const win = window as any
        if (win.__handleJSBMessage) {
          const updateData = JSON.stringify({
            id: 'test-element',
            transform: { position: [0, 0, 100] },
            style: { backgroundColor: 'rgba(0, 255, 0, 0.5)' },
          })
          return await win.__handleJSBMessage(
            `UpdateSpatialized2DElementProperties::${updateData}`,
          )
        }
        throw new Error('JSB handler not available')
      })

      console.log('Element update result:', updateResult)
      expect(updateResult).to.have.property('success', false)

      console.log('Spatial scene and element test passed!')
    } catch (error) {
      console.error('Spatial scene test failed with error:', error)
      if (runner && runner.screenshot) {
        await runner.screenshot('spatial-scene-test-failure.png')
      }
      throw error
    }
  })

  it('should capture console.log output after button click', async function () {
    if (!runner) throw new Error('Puppeteer runner not initialized')

    console.log('Testing console.log capture after button click...')

    try {
      // Navigate to the app page
      await runner.navigate('http://localhost:5173', {
        waitUntil: 'networkidle0',
        timeout: 15000,
      })

      // Inject log capture code in page; note console.log is customized in puppeteerRunner.ts
      await runner.evaluate(() => {
        // Create an array to store console logs
        ;(window as any).__capturedLogs = []

        // Get current console.log function (may be customized by puppeteerRunner)
        const currentConsoleLog = console.log

        // Override console.log while preserving custom behavior
        console.log = (...args) => {
          // Convert log args to string and store
          const logString = args
            .map(arg =>
              typeof arg === 'object' ? JSON.stringify(arg) : String(arg),
            )
            .join(' ')
          ;(window as any).__capturedLogs.push(logString)

          // Call the current console.log (preserving puppeteerRunner custom behavior)
          currentConsoleLog(...args)
        }
      })

      // Click increment button to trigger onClick
      console.log('Clicking increment button...')
      await runner.evaluate(() => {
        const btn = document.querySelector('[data-testid="btn"]')
        if (btn) {
          ;(btn as HTMLElement).click()
        }
      })

      // wait for a moment to let the console log produced
      await runner.evaluate(() => {
        return new Promise(resolve => setTimeout(resolve, 500))
      })

      // Get captured logs
      const consoleLogs: string[] = await runner.evaluate(() => {
        return (window as any).__capturedLogs || []
      })

      // Find logs containing 'session: ' and 'supported: '
      const sessionLog = consoleLogs.find(log => log.includes('session: '))
      const supportedLog = consoleLogs.find(log => log.includes('supported: '))
      const getNativeVersionLog = consoleLogs.find(log =>
        log.includes('getNativeVersion: '),
      )
      const getClientVersionLog = consoleLogs.find(log =>
        log.includes('getClientVersion: '),
      )
      const getSpatialSceneLog = consoleLogs.find(log =>
        log.includes('getSpatialScene: '),
      )
      const runInSpatialWebLog = consoleLogs.find(log =>
        log.includes('runInSpatialWeb: '),
      )

      console.log('Found session log:', sessionLog)
      console.log('Found supported log:', supportedLog)
      console.log('Found getNativeVersion log:', getNativeVersionLog)
      console.log('Found getClientVersion log:', getClientVersionLog)
      console.log('Found getSpatialScene log:', getSpatialSceneLog)
      console.log('Found runInSpatialWeb log:', runInSpatialWebLog)
      // Assert getNativeVersion log is not null
      expect(getNativeVersionLog).to.not.be.null

      // Assert session log is not null
      expect(sessionLog).to.not.be.null
      // Assert session value not null (log does not contain 'session: null')
      expect(sessionLog).to.not.include('null')

      // Assert supported log is not null
      expect(supportedLog).to.not.be.null
      // supported should be boolean; assert it contains 'true' or 'false'
      expect(supportedLog).to.satisfy(
        (log: string) => log.includes('true') || log.includes('false'),
      )

      const res = runner.evaluate(() => {
        const win = window as any
        return win.__SpatialWebEvent({ id: 'test', data: 'test-JSB' })
      })
      console.log('__SpatialWebEvent', res)
      console.log('Console.log capture test passed!')
    } catch (error) {
      console.error('Console.log capture test failed with error:', error)
      if (
        runner &&
        'screenshot' in runner &&
        typeof runner.screenshot === 'function'
      ) {
        await runner.screenshot('console-log-test-failure.png')
      }
      throw error
    }
  })
})
