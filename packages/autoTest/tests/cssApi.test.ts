import { expect } from 'chai'
import { PuppeteerRunner } from '../src/runtime/puppeteerRunner'
import { spawn, ChildProcess } from 'child_process'
import { before, after } from 'mocha'
import 'source-map-support/register'
import { stderr } from 'process'

let runner: PuppeteerRunner | null = null
let server: ChildProcess | null = null

describe('CSS API Includes Spatial Support', function (this: Mocha.Suite) {
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

  describe('Support JSX In-line style', () => {
    describe('support opacity', () => {
      const waitForSpatialized = async () => {
        if (!runner) throw new Error('Puppeteer runner not initialized')
        await runner.waitForFunction(
          `(() => {
            const el = document.querySelector('[data-testid="css-inline-style-target"]')
            const fn = window.getSpatialized2DElement
            return !!el && typeof fn === 'function' && !!fn(el)
          })()`,
        )
      }

      const getSpatialId = async () => {
        if (!runner) throw new Error('Puppeteer runner not initialized')
        return runner.evaluate(() => {
          const el = document.querySelector(
            '[data-testid="css-inline-style-target"]',
          ) as HTMLDivElement | null
          if (!el) return null
          const spatializedElement = (window as any).getSpatialized2DElement?.(
            el,
          )
          return spatializedElement ? spatializedElement.id : null
        })
      }

      const expectSpatialOpacity = async (
        spatialId: string,
        expected: number,
      ) => {
        if (!runner) throw new Error('Puppeteer runner not initialized')
        let spatialObj: any = null
        for (let i = 0; i < 50; i++) {
          spatialObj = runner
            .getCurrentScene()
            ?.findSpatialObject(spatialId) as any
          const opacity = spatialObj?.opacity
          if (
            typeof opacity === 'number' &&
            Math.abs(opacity - expected) < 0.01
          )
            break
          await new Promise(resolve => setTimeout(resolve, 100))
        }
        expect(spatialObj).to.be.not.null
        expect(spatialObj.opacity).to.be.closeTo(expected, 0.01)
      }

      const setOpacityAndApply = async (value: string) => {
        if (!runner) throw new Error('Puppeteer runner not initialized')
        await runner.evaluate(async v => {
          const input = document.querySelector(
            '[data-testid="css-opacity-range"]',
          ) as HTMLInputElement | null
          if (!input) throw new Error('opacity range not found')
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

          await new Promise(resolve => setTimeout(resolve, 50))

          const btn = document.querySelector(
            '[data-testid="css-opacity-apply"]',
          ) as HTMLButtonElement | null
          if (!btn) throw new Error('opacity apply button not found')
          btn.click()
        }, value)
      }

      const applyAndAssertOpacity = async (
        sliderValue: string,
        expectedDomOpacity: number,
        expectedSpatialOpacity: number,
      ) => {
        if (!runner) throw new Error('Puppeteer runner not initialized')
        await runner.navigate('http://localhost:5173/cssApiTest', {
          waitUntil: 'networkidle0',
          timeout: 30000,
        })

        await runner.waitForFunction(
          () =>
            !!document.querySelector('[data-testid="css-inline-style-target"]'),
        )

        await waitForSpatialized()
        const spatialId = await getSpatialId()
        expect(spatialId).to.be.not.null

        await setOpacityAndApply(sliderValue)

        await runner.waitForFunction(
          `(() => {
            const el = document.querySelector('[data-testid="css-inline-style-target"]')
            if (!el) return false
            const styleOpacity = parseFloat(el.style.opacity || 'NaN')
            if (!Number.isFinite(styleOpacity)) return false
            return Math.abs(styleOpacity - ${expectedDomOpacity}) < 0.01
          })()`,
        )

        const domOpacity = await runner.evaluate(() => {
          const el = document.querySelector(
            '[data-testid="css-inline-style-target"]',
          ) as HTMLDivElement | null
          if (!el) return null
          return {
            styleOpacity: el.style.opacity,
            computedOpacity: getComputedStyle(el).opacity,
          }
        })
        expect(domOpacity).to.be.not.null
        expect(parseFloat((domOpacity as any).styleOpacity)).to.be.closeTo(
          expectedDomOpacity,
          0.01,
        )

        await expectSpatialOpacity(spatialId as string, expectedSpatialOpacity)
      }

      it('should set and get opacity using inline style', async () => {
        await applyAndAssertOpacity('0.5', 0.5, 0.5)
      })

      it('should set opacity to 0 when set opacity to -0.3 using inline style', async () => {
        await applyAndAssertOpacity('-0.3', 0, 0)
      })

      it('should set opacity to 1 when set opacity to 1.3 using inline style', async () => {
        await applyAndAssertOpacity('1.3', 1, 1)
      })
    })
  })
})
