import { expect } from 'chai'
import { spawn } from 'child_process'
import { existsSync } from 'fs'
import * as path from 'path'
import { PuppeteerRunner } from '../src/runtime/puppeteerRunner'

let runner: PuppeteerRunner | null = null
let server: any = null

describe('React App E2E Test', function () {
  this.timeout(30000) // Increase timeout duration

  before(async () => {
    console.log('Starting Vite server...')

    // Ensure using the correct npm command path
    const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm'

    // Start Vite server and capture output for debugging
    server = spawn(npmCmd, ['run', 'dev'], {
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
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

    // 初始化Puppeteer运行时
    runner = new PuppeteerRunner()

    // 先进行配置初始化，启用XR支持
    runner.init({
      width: 1280,
      height: 800,
      headless: true,
      timeout: 30000,
      enableXR: true, // Enable XR support for testing JSBCommand and spatial features
    })

    // 然后启动浏览器实例
    await runner.start()
  })

  after(async () => {
    console.log('Cleaning up...')
    if (runner && runner.close) {
      await runner.close()
    }
    if (server) {
      server.kill('SIGTERM')
    }
  })

  it('renders and increments count', async function () {
    if (!runner) throw new Error('Puppeteer runner not initialized')

    console.log('Navigating to app...')
    try {
      // 导航到应用页面
      await runner.navigate('http://localhost:5173', {
        waitUntil: 'networkidle0',
        timeout: 15000,
      })

      // 等待计数器元素可见（使用evaluate和自定义等待逻辑）
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

      // 获取初始计数值
      const initialText = await runner.evaluate(() => {
        const el = document.querySelector('[data-testid="counter"]')
        return el ? el.textContent : null
      })
      console.log(`Initial counter text: ${initialText}`)
      expect(initialText).to.include('0')

      // 点击增加按钮
      console.log('Clicking increment button...')
      await runner.evaluate(() => {
        const btn = document.querySelector('[data-testid="btn"]')
        if (btn) {
          ;(btn as HTMLElement).click()
        }
      })

      // 等待UI更新，计数器变为1
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

      // 获取更新后的计数值
      const updatedText = await runner.evaluate(() => {
        const el = document.querySelector('[data-testid="counter"]')
        return el ? el.textContent : null
      })
      console.log(`Updated counter text: ${updatedText}`)
      expect(updatedText).to.include('1')

      console.log('Test passed!')
    } catch (error) {
      console.error('Test failed with error:', error)
      // 捕获页面截图用于调试
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
      // 导航到应用页面
      await runner.navigate('http://localhost:5173', {
        waitUntil: 'networkidle0',
        timeout: 15000,
      })

      // 等待XR元素加载
      console.log('Waiting for spatial elements...')
      // 使用evaluate等待元素出现
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

      // 检查元素是否有--xr-back属性
      const hasXrBack = await runner.evaluate(() => {
        const el = document.querySelector('.spatial-div')
        if (!el) return false
        const computedStyle = window.getComputedStyle(el)
        return computedStyle.getPropertyValue('--xr-back') !== ''
      })
      console.log(`Element has --xr-back property: ${hasXrBack}`)
      expect(hasXrBack).to.be.true

      // 获取--xr-back属性的值
      const xrBackValue = await runner.evaluate(() => {
        const el = document.querySelector('.spatial-div')
        if (!el) return ''
        const computedStyle = window.getComputedStyle(el)
        return computedStyle.getPropertyValue('--xr-back').trim()
      })
      console.log(`--xr-back property value: ${xrBackValue}`)
      // 验证属性值不为空
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
      // 注册自定义JSB命令处理器来测试SpatialScene交互
      runner.registerJSBHandler('TestSpatialSceneJSB', (data, callback) => {
        console.log('Custom JSB handler called with data:', data)
        callback({
          success: true,
          message: 'SpatialScene JSB test successful',
          timestamp: Date.now(),
        })
      })

      // 在页面中执行JSB命令测试
      const res = await runner.evaluate(async () => {
        // 模拟调用JSB命令
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

    // 注册自定义命令处理器来模拟空间场景创建
    runner.registerJSBHandler('CreateSpatialScene', (data, callback) => {
      console.log('Creating spatial scene with:', data)
      const sceneId = `scene-${Date.now()}`
      callback({ id: sceneId, success: true })
    })

    try {
      // 在页面中模拟创建空间场景
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

      // 测试Spatialized2DElement属性更新
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

  it('test spatial scene creation', () => {
    if (!runner) throw new Error('Puppeteer runner not initialized')

    console.log('Testing spatial scene creation...')
  })

  it('should capture console.log output after button click', async function () {
    if (!runner) throw new Error('Puppeteer runner not initialized')

    console.log('Testing console.log capture after button click...')

    try {
      // 导航到应用页面
      await runner.navigate('http://localhost:5173', {
        waitUntil: 'networkidle0',
        timeout: 15000,
      })

      // 在页面中注入日志捕获代码，注意puppeteerRunner.ts中已对console.log做了自定义
      await runner.evaluate(() => {
        // 创建一个数组来存储控制台日志
        ;(window as any).__capturedLogs = []

        // 获取当前的console.log函数（可能已经被puppeteerRunner自定义过）
        const currentConsoleLog = console.log

        // 重写console.log方法，但保留原有的自定义功能
        console.log = (...args) => {
          // 将日志参数转换为字符串并存储
          const logString = args
            .map(arg =>
              typeof arg === 'object' ? JSON.stringify(arg) : String(arg),
            )
            .join(' ')
          ;(window as any).__capturedLogs.push(logString)

          // 调用当前的console.log（保留puppeteerRunner中的自定义功能）
          currentConsoleLog(...args)
        }
      })

      // 点击增加按钮触发onClick事件
      console.log('Clicking increment button...')
      await runner.evaluate(() => {
        const btn = document.querySelector('[data-testid="btn"]')
        if (btn) {
          ;(btn as HTMLElement).click()
        }
      })

      // 等待一段时间让控制台日志产生
      await runner.evaluate(() => {
        return new Promise(resolve => setTimeout(resolve, 500))
      })

      // 获取捕获的日志
      const consoleLogs: string[] = await runner.evaluate(() => {
        return (window as any).__capturedLogs || []
      })

      // 查找包含'session: '和'supported: '的日志
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
      // 断言getNativeVersion日志不为null
      expect(getNativeVersionLog).to.not.be.null

      // 断言session日志不为null
      expect(sessionLog).to.not.be.null
      // 断言session值不为null（即日志中不包含'session: null'）
      expect(sessionLog).to.not.include('null')

      // 断言supported日志不为null
      expect(supportedLog).to.not.be.null
      // supported应该是一个布尔值，断言它要么包含'true'要么包含'false'
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

  it('should create a spatial element when div has enable-xr attribute with xr-back style', async function () {
    if (!runner) throw new Error('Puppeteer runner not initialized')

    console.log('Testing spatial element creation with enable-xr attribute...')
    try {
      // 导航到应用页面
      await runner.navigate('http://localhost:5173', {
        waitUntil: 'networkidle0',
        timeout: 15000,
      })

      // 在页面中创建一个带有enable-xr属性和--xr-back样式的div元素
      console.log('Injecting test spatial div element...')
      await runner.evaluate(() => {
        return new Promise((resolve, reject) => {
          try {
            // 创建一个测试div元素
            const testDiv = document.createElement('div')
            testDiv.setAttribute('enable-xr', '')
            testDiv.style.setProperty('--xr-back', '100')
            testDiv.className = 'test-spatial-div'
            testDiv.textContent = 'Test spatial div'

            // 添加到body
            document.body.appendChild(testDiv)

            // 设置一个标志，以便我们可以在evaluate中检查元素是否被正确处理
            const win = window as any
            win.__testSpatialElementCreated = true
            resolve(true)
          } catch (error) {
            reject(error)
          }
        })
      })

      // 等待一小段时间让运行时处理XR元素
      console.log('Waiting for spatial element processing...')
      await runner.evaluate(() => {
        return new Promise(resolve => setTimeout(resolve, 500))
      })

      // 检查空间场景信息
      console.log('Checking spatial scene info...')

      const spatialSceneInfo = await runner.evaluate(async () => {
        const win = window
        console.log('calling inspectCurrentSpatialScene...')
        if (win.inspectCurrentSpatialScene) {
          return await win.inspectCurrentSpatialScene()
        }
        throw new Error('inspectCurrentSpatialScene is not available')
      })

      console.log('Spatial scene info:', spatialSceneInfo)

      // 验证场景中包含子元素
      expect(spatialSceneInfo).to.have.property('children')
      const children = Object.values(spatialSceneInfo.children)
      console.log(`Found ${children.length} spatial elements`)

      // 验证有至少一个元素（因为页面可能已有其他空间元素）
      expect(children.length).to.be.greaterThan(0)

      // 查找z轴位置为100的元素（我们注入的测试元素）
      const testElement = children.find(
        (child: any) =>
          child.transform &&
          child.transform.translation &&
          child.transform.translation[2] === 100,
      )

      console.log('Test element found:', testElement)
      expect(testElement).to.exist

      console.log('Spatial element test passed!')
    } catch (error) {
      console.error('Spatial element test failed with error:', error)
      if (runner && runner.screenshot) {
        await runner.screenshot('spatial-element-test-failure.png')
      }
      throw error
    }
  })
})
