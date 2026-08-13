import { expect } from 'chai'
import { PuppeteerRunner } from '../src/runtime/puppeteerRunner'
import { spawn, ChildProcess } from 'child_process'
import { before, after } from 'mocha'
import 'source-map-support/register'

let runner: PuppeteerRunner | null = null
let server: ChildProcess | null = null

describe('Add depth with transform  tests', function (this: Mocha.Suite) {
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
      // devtools: process.env.CI !== 'true',
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

  describe('CSS property supports Transform', () => {
    it('support matrix', async () => {
      if (!runner) throw new Error('Puppeteer runner not initialized')
      await runner.navigate('http://localhost:5173/transformTest', {
        waitUntil: 'networkidle0',
        timeout: 30000,
      })

      await runner.waitForFunction(
        () => !!document.querySelector('[data-testid="transform-target"]'),
      )

      await runner.waitForFunction(() => {
        const el = document.querySelector(
          '[data-testid="transform-target"]',
        ) as HTMLDivElement | null
        const fn = (window as any).getSpatialized2DElement
        return !!el && typeof fn === 'function' && !!fn(el)
      })

      const spatialId = await runner.evaluate(() => {
        const el = document.querySelector(
          '[data-testid="transform-target"]',
        ) as HTMLDivElement | null
        if (!el) return null
        const spatializedElement = (window as any).getSpatialized2DElement?.(el)
        return spatializedElement ? spatializedElement.id : null
      })
      expect(spatialId).to.be.not.null

      await runner.evaluate(v => {
        const input = document.querySelector(
          '[data-testid="transform-matrix"]',
        ) as HTMLInputElement | null
        if (!input) throw new Error('matrix input not found')
        const setter = Object.getOwnPropertyDescriptor(
          HTMLInputElement.prototype,
          'value',
        )?.set
        if (setter) {
          setter.call(input, v)
        } else {
          input.value = v
        }
        input.dispatchEvent(new Event('input', { bubbles: true }))
        input.dispatchEvent(new Event('change', { bubbles: true }))
      }, '1,0,0,1,-10,0')

      let spatialObj: any = null
      let matrix: number[] | null = null
      for (let i = 0; i < 50; i++) {
        spatialObj = runner
          .getCurrentScene()
          ?.findSpatialObject(spatialId as string) as any
        matrix = spatialObj?.transform?.matrix
        if (
          Array.isArray(matrix) &&
          matrix.length === 16 &&
          Math.abs(matrix[0] - 1) < 1e-3 &&
          Math.abs(matrix[5] - 1) < 1e-3 &&
          Math.abs(matrix[12] - -10) < 1e-2 &&
          Math.abs(matrix[13] - 0) < 1e-2
        ) {
          break
        }
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      expect(spatialObj).to.be.not.null
      expect(matrix).to.be.an('array').with.lengthOf(16)
      expect((matrix as number[])[0]).to.be.closeTo(1, 1e-3)
      expect((matrix as number[])[5]).to.be.closeTo(1, 1e-3)
      expect((matrix as number[])[12]).to.be.closeTo(-10, 1e-2)
      expect((matrix as number[])[13]).to.be.closeTo(0, 1e-2)
    })

    it('support matrix3d', async () => {
      if (!runner) throw new Error('Puppeteer runner not initialized')
      await runner.navigate('http://localhost:5173/transformTest', {
        waitUntil: 'networkidle0',
        timeout: 30000,
      })

      await runner.waitForFunction(
        () => !!document.querySelector('[data-testid="transform-target"]'),
      )

      await runner.waitForFunction(() => {
        const el = document.querySelector(
          '[data-testid="transform-target"]',
        ) as HTMLDivElement | null
        const fn = (window as any).getSpatialized2DElement
        return !!el && typeof fn === 'function' && !!fn(el)
      })

      const spatialId = await runner.evaluate(() => {
        const el = document.querySelector(
          '[data-testid="transform-target"]',
        ) as HTMLDivElement | null
        if (!el) return null
        const spatializedElement = (window as any).getSpatialized2DElement?.(el)
        return spatializedElement ? spatializedElement.id : null
      })
      expect(spatialId).to.be.not.null

      const m3d = '1,0,0,0,0,1,0,0,0,0,1,0,-10,0,0,1'
      await runner.evaluate(v => {
        const input = document.querySelector(
          '[data-testid="transform-matrix3d"]',
        ) as HTMLInputElement | null
        if (!input) throw new Error('matrix3d input not found')
        const setter = Object.getOwnPropertyDescriptor(
          HTMLInputElement.prototype,
          'value',
        )?.set
        if (setter) {
          setter.call(input, v)
        } else {
          input.value = v
        }
        input.dispatchEvent(new Event('input', { bubbles: true }))
        input.dispatchEvent(new Event('change', { bubbles: true }))
      }, m3d)

      let spatialObj: any = null
      let matrix: number[] | null = null
      for (let i = 0; i < 50; i++) {
        spatialObj = runner
          .getCurrentScene()
          ?.findSpatialObject(spatialId as string) as any
        matrix = spatialObj?.transform?.matrix
        if (
          Array.isArray(matrix) &&
          matrix.length === 16 &&
          Math.abs(matrix[12] - -10) < 1e-2
        ) {
          break
        }
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      expect(spatialObj).to.be.not.null
      expect(matrix).to.be.an('array').with.lengthOf(16)
      expect((matrix as number[])[12]).to.be.closeTo(-10, 1e-2)
    })

    it('support rotateZ', async () => {
      if (!runner) throw new Error('Puppeteer runner not initialized')
      await runner.navigate('http://localhost:5173/transformTest', {
        waitUntil: 'networkidle0',
        timeout: 30000,
      })

      await runner.waitForFunction(
        () => !!document.querySelector('[data-testid="transform-target"]'),
      )

      await runner.waitForFunction(() => {
        const el = document.querySelector(
          '[data-testid="transform-target"]',
        ) as HTMLDivElement | null
        const fn = (window as any).getSpatialized2DElement
        return !!el && typeof fn === 'function' && !!fn(el)
      })

      const spatialId = await runner.evaluate(() => {
        const el = document.querySelector(
          '[data-testid="transform-target"]',
        ) as HTMLDivElement | null
        if (!el) return null
        const spatializedElement = (window as any).getSpatialized2DElement?.(el)
        return spatializedElement ? spatializedElement.id : null
      })
      expect(spatialId).to.be.not.null

      await runner.evaluate(v => {
        const input = document.querySelector(
          '[data-testid="transform-rotate-z"]',
        ) as HTMLInputElement | null
        if (!input) throw new Error('rotateZ range not found')
        const setter = Object.getOwnPropertyDescriptor(
          HTMLInputElement.prototype,
          'value',
        )?.set
        if (setter) {
          setter.call(input, v)
        } else {
          input.value = v
        }
        input.dispatchEvent(new Event('input', { bubbles: true }))
        input.dispatchEvent(new Event('change', { bubbles: true }))
      }, '45')

      const cos45 = Math.cos(Math.PI / 4)
      let spatialObj: any = null
      let matrix: number[] | null = null
      for (let i = 0; i < 50; i++) {
        spatialObj = runner
          .getCurrentScene()
          ?.findSpatialObject(spatialId as string) as any
        matrix = spatialObj?.transform?.matrix
        const ok =
          Array.isArray(matrix) &&
          matrix.length === 16 &&
          Math.abs(Math.abs(matrix[0]) - cos45) < 1e-2 &&
          Math.abs(Math.abs(matrix[5]) - cos45) < 1e-2
        if (ok) break
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      expect(spatialObj).to.be.not.null
      expect(matrix).to.be.an('array').with.lengthOf(16)
      expect(Math.abs((matrix as number[])[0])).to.be.closeTo(cos45, 1e-2)
      expect(Math.abs((matrix as number[])[5])).to.be.closeTo(cos45, 1e-2)
    })

    it('nested element transform should update', async () => {
      if (!runner) throw new Error('Puppeteer runner not initialized')
      await runner.navigate('http://localhost:5173/transformTest', {
        waitUntil: 'networkidle0',
        timeout: 30000,
      })

      await runner.waitForFunction(
        () =>
          !!document.querySelector('[data-testid="transform-nested-target"]'),
      )

      await runner.waitForFunction(() => {
        const el = document.querySelector(
          '[data-testid="transform-nested-target"]',
        ) as HTMLDivElement | null
        const fn = (window as any).getSpatialized2DElement
        return !!el && typeof fn === 'function' && !!fn(el)
      })

      const spatialId = await runner.evaluate(() => {
        const el = document.querySelector(
          '[data-testid="transform-nested-target"]',
        ) as HTMLDivElement | null
        if (!el) return null
        const spatializedElement = (window as any).getSpatialized2DElement?.(el)
        return spatializedElement ? spatializedElement.id : null
      })
      expect(spatialId).to.be.not.null

      await runner.evaluate(v => {
        const input = document.querySelector(
          '[data-testid="nested-transform-matrix"]',
        ) as HTMLInputElement | null
        if (!input) throw new Error('nested matrix input not found')
        const setter = Object.getOwnPropertyDescriptor(
          HTMLInputElement.prototype,
          'value',
        )?.set
        if (setter) {
          setter.call(input, v)
        } else {
          input.value = v
        }
        input.dispatchEvent(new Event('input', { bubbles: true }))
        input.dispatchEvent(new Event('change', { bubbles: true }))
      }, '1,0,0,1,-5,0')

      let spatialObj: any = null
      let matrix: number[] | null = null
      for (let i = 0; i < 50; i++) {
        spatialObj = runner
          .getCurrentScene()
          ?.findSpatialObject(spatialId as string) as any
        matrix = spatialObj?.transform?.matrix
        if (
          Array.isArray(matrix) &&
          matrix.length === 16 &&
          Math.abs(matrix[12] - -5) < 1e-2
        ) {
          break
        }
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      expect(spatialObj).to.be.not.null
      expect(matrix).to.be.an('array').with.lengthOf(16)
      expect((matrix as number[])[12]).to.be.closeTo(-5, 1e-2)
    })
  })

  describe('CSS property supports Transform-origin', () => {})
})
