import { expect } from 'chai'
import { PuppeteerRunner } from '../src/runtime/puppeteerRunner'
import { spawn, ChildProcess } from 'child_process'
import { before, after } from 'mocha'
import 'source-map-support/register'

let runner: PuppeteerRunner | null = null
let server: ChildProcess | null = null

describe('Support SpatialDiv/HTML Material', function (this: Mocha.Suite) {
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

  describe('should change material using classname', () => {
    const applyAndAssertClassMaterial = async (
      value: string,
      expectedClassName: string,
      expectedBackgroundMaterial: string,
    ) => {
      if (!runner) throw new Error('Puppeteer runner not initialized')
      await runner.navigate('http://localhost:5173/materialApiTest', {
        waitUntil: 'networkidle0',
        timeout: 30000,
      })
      await runner.waitForFunction(
        () => !!document.querySelector('[data-testid="material-test-child"]'),
      )

      await runner.evaluate(v => {
        const select = document.querySelector(
          '[data-testid="class-material-select"]',
        ) as HTMLSelectElement | null
        if (!select) throw new Error('class material select not found')
        select.value = v
        select.dispatchEvent(new Event('change', { bubbles: true }))
      }, value)

      await runner.evaluate(() => {
        const btn = document.querySelector(
          '[data-testid="class-material-apply"]',
        ) as HTMLButtonElement | null
        if (!btn) throw new Error('class material apply button not found')
        btn.click()
      })

      await runner.waitForFunction(
        `!!document.querySelector('[data-testid="material-test-child"]') && document.querySelector('[data-testid="material-test-child"]').className.includes(${JSON.stringify(
          expectedClassName,
        )})`,
      )

      const className = await runner.evaluate(() => {
        const el = document.querySelector(
          '[data-testid="material-test-child"]',
        ) as HTMLElement | null
        return el?.className || ''
      })
      expect(className).to.include(expectedClassName)

      const spatializedElementId = await runner.evaluate(() => {
        const el = document.querySelector(
          '[data-testid="material-test-child"]',
        ) as HTMLDivElement | null
        if (!el) return null
        const spatializedElement = (window as any).getSpatialized2DElement?.(el)
        return spatializedElement ? spatializedElement.id : null
      })
      expect(spatializedElementId).to.be.not.null

      let spatialObj: any = null
      for (let i = 0; i < 50; i++) {
        spatialObj = runner
          .getCurrentScene()
          ?.findSpatialObject(spatializedElementId as string) as any
        if (spatialObj?.backgroundMaterial === expectedBackgroundMaterial) break
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      expect(spatialObj).to.be.not.null
      expect(spatialObj.backgroundMaterial).to.equal(expectedBackgroundMaterial)
    }

    it('change material to thin when add class .thinMat', async () => {
      await applyAndAssertClassMaterial('thin', 'thinMat', 'thin')
    })

    it('change material to regular when add class .regularMat', async () => {
      await applyAndAssertClassMaterial('regular', 'regularMat', 'regular')
    })

    it('change material to translucent when add class .defaultMat', async () => {
      await applyAndAssertClassMaterial('default', 'defaultMat', 'translucent')
    })

    it('change material to transparent when add class .transparentMat', async () => {
      await applyAndAssertClassMaterial(
        'transparent',
        'transparentMat',
        'transparent',
      )
    })

    it('change material to thick when add class .thickMat', async () => {
      await applyAndAssertClassMaterial('thick', 'thickMat', 'thick')
    })

    it('change material to thick when add class .thickMat', async () => {
      await applyAndAssertClassMaterial('thick', 'thickMat', 'thick')
    })

    it('change material to none when add class .noMat', async () => {
      await applyAndAssertClassMaterial('none', 'noMat', 'none')
    })
  })

  describe('should change material using in-line style', () => {
    const applyAndAssertInlineMaterial = async (
      value: string,
      expectedCssMaterial: string,
      expectedBackgroundMaterial: string,
    ) => {
      if (!runner) throw new Error('Puppeteer runner not initialized')
      await runner.navigate('http://localhost:5173/materialApiTest', {
        waitUntil: 'networkidle0',
        timeout: 30000,
      })

      await runner.waitForFunction(
        () => !!document.querySelector('[data-testid="material-test-parent"]'),
      )

      await runner.evaluate(v => {
        const select = document.querySelector(
          '[data-testid="inline-material-select-parent"]',
        ) as HTMLSelectElement | null
        if (!select) throw new Error('inline material parent select not found')
        select.value = v
        select.dispatchEvent(new Event('change', { bubbles: true }))
      }, value)

      await runner.evaluate(() => {
        const btn = document.querySelector(
          '[data-testid="inline-material-apply-parent"]',
        ) as HTMLButtonElement | null
        if (!btn)
          throw new Error('inline material parent apply button not found')
        btn.click()
      })

      await runner.waitForFunction(
        `(() => {
          const el = document.querySelector('[data-testid="material-test-parent"]')
          if (!el) return false
          return el.style.getPropertyValue('--xr-background-material').trim() === ${JSON.stringify(
            expectedCssMaterial,
          )}
        })()`,
      )

      const spatializedElementId = await runner.evaluate(() => {
        const el = document.querySelector(
          '[data-testid="material-test-parent"]',
        ) as HTMLDivElement | null
        if (!el) return null
        const spatializedElement = (window as any).getSpatialized2DElement?.(el)
        return spatializedElement ? spatializedElement.id : null
      })
      expect(spatializedElementId).to.be.not.null

      let spatialObj: any = null
      for (let i = 0; i < 50; i++) {
        spatialObj = runner
          .getCurrentScene()
          ?.findSpatialObject(spatializedElementId as string) as any
        if (spatialObj?.backgroundMaterial === expectedBackgroundMaterial) break
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      expect(spatialObj).to.be.not.null
      expect(spatialObj.backgroundMaterial).to.equal(expectedBackgroundMaterial)
    }

    it('change material to thin when set style backgroundMaterial to thin', async () => {
      await applyAndAssertInlineMaterial('thin', 'thin', 'thin')
    })

    it('change material to regular when set style backgroundMaterial to regular', async () => {
      await applyAndAssertInlineMaterial('regular', 'regular', 'regular')
    })

    it('change material to translucent when set style backgroundMaterial to translucent', async () => {
      await applyAndAssertInlineMaterial(
        'translucent',
        'translucent',
        'translucent',
      )
    })

    it('change material to transparent when set style backgroundMaterial to transparent', async () => {
      await applyAndAssertInlineMaterial(
        'transparent',
        'transparent',
        'transparent',
      )
    })

    it('change material to thick when set style backgroundMaterial to thick', async () => {
      await applyAndAssertInlineMaterial('thick', 'thick', 'thick')
    })

    it('change material to none when set style backgroundMaterial to none', async () => {
      await applyAndAssertInlineMaterial('none', 'none', 'none')
    })
  })

  describe('should change material using ref style', () => {
    const applyAndAssertRefMaterial = async (
      value: string,
      expectedCssMaterial: string,
      expectedBackgroundMaterial: string,
    ) => {
      if (!runner) throw new Error('Puppeteer runner not initialized')
      await runner.navigate('http://localhost:5173/materialApiTest', {
        waitUntil: 'networkidle0',
        timeout: 30000,
      })

      await runner.waitForFunction(
        () => !!document.querySelector('[data-testid="material-test-child"]'),
      )

      await runner.waitForFunction(() => {
        const el = document.querySelector(
          '[data-testid="material-test-child"]',
        ) as HTMLElement | null
        const fn = (window as any).getSpatialized2DElement
        return !!el && typeof fn === 'function' && !!fn(el)
      })

      await runner.evaluate(v => {
        const select = document.querySelector(
          '[data-testid="ref-material-select"]',
        ) as HTMLSelectElement | null
        if (!select) throw new Error('ref material select not found')
        select.value = v
        select.dispatchEvent(new Event('change', { bubbles: true }))
      }, value)

      await runner.evaluate(() => {
        const btn = document.querySelector(
          '[data-testid="ref-material-apply"]',
        ) as HTMLButtonElement | null
        if (!btn) throw new Error('ref material apply button not found')
        btn.click()
      })

      await runner.waitForFunction(
        `(() => {
          const el = document.querySelector('[data-testid="material-test-child"]')
          if (!el) return false
          return el.style.getPropertyValue('--xr-background-material').trim() === ${JSON.stringify(
            expectedCssMaterial,
          )}
        })()`,
      )

      const spatializedElementId = await runner.evaluate(() => {
        const el = document.querySelector(
          '[data-testid="material-test-child"]',
        ) as HTMLDivElement | null
        if (!el) return null
        const spatializedElement = (window as any).getSpatialized2DElement?.(el)
        return spatializedElement ? spatializedElement.id : null
      })
      expect(spatializedElementId).to.be.not.null

      let spatialObj: any = null
      for (let i = 0; i < 50; i++) {
        spatialObj = runner
          .getCurrentScene()
          ?.findSpatialObject(spatializedElementId as string) as any
        if (spatialObj?.backgroundMaterial === expectedBackgroundMaterial) break
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      expect(spatialObj).to.be.not.null
      expect(spatialObj.backgroundMaterial).to.equal(expectedBackgroundMaterial)
    }

    it('change material to thin when set ref style backgroundMaterial to thin', async () => {
      await applyAndAssertRefMaterial('thin', 'thin', 'thin')
    })

    it('change material to regular when set ref style backgroundMaterial to regular', async () => {
      await applyAndAssertRefMaterial('regular', 'regular', 'regular')
    })

    it('change material to translucent when set ref style backgroundMaterial to translucent', async () => {
      await applyAndAssertRefMaterial(
        'translucent',
        'translucent',
        'translucent',
      )
    })

    it('change material to transparent when set ref style backgroundMaterial to transparent', async () => {
      await applyAndAssertRefMaterial(
        'transparent',
        'transparent',
        'transparent',
      )
    })

    it('change material to thick when set ref style backgroundMaterial to thick', async () => {
      await applyAndAssertRefMaterial('thick', 'thick', 'thick')
    })

    it('change material to none when set ref style backgroundMaterial to none', async () => {
      await applyAndAssertRefMaterial('none', 'none', 'none')
    })
  })

  describe('the Material of child div and parent div should be independent of each other', () => {
    const waitForSpatialized = async (testId: string) => {
      if (!runner) throw new Error('Puppeteer runner not initialized')
      await runner.waitForFunction(
        `(() => {
          const el = document.querySelector('[data-testid=${JSON.stringify(
            testId,
          )}]')
          const fn = window.getSpatialized2DElement
          return !!el && typeof fn === 'function' && !!fn(el)
        })()`,
      )
    }

    const getSpatialId = async (testId: string) => {
      if (!runner) throw new Error('Puppeteer runner not initialized')
      return runner.evaluate(id => {
        const el = document.querySelector(
          `[data-testid="${id}"]`,
        ) as HTMLDivElement | null
        if (!el) return null
        const spatializedElement = (window as any).getSpatialized2DElement?.(el)
        return spatializedElement ? spatializedElement.id : null
      }, testId)
    }

    const expectSpatialMaterial = async (
      spatialId: string,
      expected: string,
    ) => {
      if (!runner) throw new Error('Puppeteer runner not initialized')
      let spatialObj: any = null
      for (let i = 0; i < 50; i++) {
        spatialObj = runner
          .getCurrentScene()
          ?.findSpatialObject(spatialId) as any
        if (spatialObj?.backgroundMaterial === expected) break
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      expect(spatialObj).to.be.not.null
      expect(spatialObj.backgroundMaterial).to.equal(expected)
    }

    const selectAndApply = async (
      selectTestId: string,
      applyTestId: string,
      value: string,
    ) => {
      if (!runner) throw new Error('Puppeteer runner not initialized')
      await runner.evaluate(
        ({ selectId, applyId, v }) => {
          const select = document.querySelector(
            `[data-testid="${selectId}"]`,
          ) as HTMLSelectElement | null
          if (!select) throw new Error(`select not found: ${selectId}`)
          select.value = v
          select.dispatchEvent(new Event('change', { bubbles: true }))

          const btn = document.querySelector(
            `[data-testid="${applyId}"]`,
          ) as HTMLButtonElement | null
          if (!btn) throw new Error(`button not found: ${applyId}`)
          btn.click()
        },
        { selectId: selectTestId, applyId: applyTestId, v: value },
      )
    }

    it('child and parent backgroundMaterial should not affect each other', async () => {
      if (!runner) throw new Error('Puppeteer runner not initialized')
      await runner.navigate('http://localhost:5173/materialApiTest', {
        waitUntil: 'networkidle0',
        timeout: 30000,
      })

      await waitForSpatialized('material-test-child')
      await waitForSpatialized('material-test-parent')

      const childSpatialId = await getSpatialId('material-test-child')
      const parentSpatialId = await getSpatialId('material-test-parent')
      expect(childSpatialId).to.be.not.null
      expect(parentSpatialId).to.be.not.null

      await selectAndApply(
        'ref-material-select-parent',
        'ref-material-apply-parent',
        'thin',
      )
      await runner.waitForFunction(
        `document.querySelector('[data-testid="material-test-parent"]').style.getPropertyValue('--xr-background-material').trim() === 'thin'`,
      )
      await expectSpatialMaterial(parentSpatialId as string, 'thin')

      await selectAndApply(
        'class-material-select',
        'class-material-apply',
        'thick',
      )
      await runner.waitForFunction(
        `document.querySelector('[data-testid="material-test-child"]').className.includes('thickMat')`,
      )
      await expectSpatialMaterial(childSpatialId as string, 'thick')
      await expectSpatialMaterial(parentSpatialId as string, 'thin')

      await selectAndApply(
        'class-material-select-parent',
        'class-material-apply-parent',
        'regular',
      )
      await runner.waitForFunction(
        `document.querySelector('[data-testid="material-test-parent"]').className.includes('regularMat')`,
      )
      await expectSpatialMaterial(childSpatialId as string, 'thick')

      await selectAndApply(
        'inline-material-select-parent',
        'inline-material-apply-parent',
        'transparent',
      )
      await runner.waitForFunction(
        `document.querySelector('[data-testid="material-test-parent"]').style.getPropertyValue('--xr-background-material').trim() === 'transparent'`,
      )
      await expectSpatialMaterial(parentSpatialId as string, 'transparent')
      await expectSpatialMaterial(childSpatialId as string, 'thick')

      await selectAndApply(
        'inline-material-select-child',
        'inline-material-apply-child',
        'regular',
      )
      await runner.waitForFunction(
        `document.querySelector('[data-testid="material-test-child"]').style.getPropertyValue('--xr-background-material').trim() === 'regular'`,
      )
      await expectSpatialMaterial(childSpatialId as string, 'regular')
      await expectSpatialMaterial(parentSpatialId as string, 'transparent')

      await selectAndApply('ref-material-select', 'ref-material-apply', 'thin')
      await runner.waitForFunction(
        `document.querySelector('[data-testid="material-test-child"]').style.getPropertyValue('--xr-background-material').trim() === 'thin'`,
      )
      await expectSpatialMaterial(childSpatialId as string, 'thin')
      await expectSpatialMaterial(parentSpatialId as string, 'transparent')
    })
  })

  describe('The material of html should change after applying material to document.documentElement.style["--xr-background-material"]', () => {
    const applyAndAssertHtmlMaterial = async (
      value: string,
      expectedCssMaterial: string,
    ) => {
      if (!runner) throw new Error('Puppeteer runner not initialized')
      await runner.navigate('http://localhost:5173/materialApiTest', {
        waitUntil: 'networkidle0',
        timeout: 30000,
      })

      await runner.waitForFunction(() => {
        const nodes = Array.from(document.querySelectorAll('center'))
        return nodes.some(
          n => n.textContent?.trim() === 'html In-line Style Test',
        )
      })

      await runner.evaluate(v => {
        const marker = Array.from(document.querySelectorAll('center')).find(
          n => n.textContent?.trim() === 'html In-line Style Test',
        )
        if (!marker) throw new Error('html In-line Style Test marker not found')
        const markerContainer = marker.closest('div')
        const section = markerContainer?.parentElement
        if (!section) throw new Error('html inline style section not found')

        const select = section.querySelector(
          'select',
        ) as HTMLSelectElement | null
        if (!select) throw new Error('html inline style select not found')
        select.value = v
        select.dispatchEvent(new Event('change', { bubbles: true }))

        const btn = section.querySelector('button') as HTMLButtonElement | null
        if (!btn) throw new Error('html inline style apply button not found')
        btn.click()
      }, value)

      await runner.waitForFunction(
        `(() => {
          const style = document.documentElement.style
          const v1 = style.getPropertyValue('--xr-background-material').trim()
          const v2 = (style['--xr-background-material'] || '').trim()
          return (
            v1 === ${JSON.stringify(expectedCssMaterial)} &&
            v2 === ${JSON.stringify(expectedCssMaterial)}
          )
        })()`,
      )

      const htmlMaterial = await runner.evaluate(() => {
        const style = document.documentElement.style as any
        const byBracket = (style['--xr-background-material'] || '').trim()
        const byGetProp = document.documentElement.style
          .getPropertyValue('--xr-background-material')
          .trim()
        return { byBracket, byGetProp }
      })
      expect(htmlMaterial.byBracket).to.equal(expectedCssMaterial)
      expect(htmlMaterial.byGetProp).to.equal(expectedCssMaterial)
    }

    it('change the html background material to thin when set style backgroundMaterial to thin', async () => {
      await applyAndAssertHtmlMaterial('thin', 'thin')
    })

    it('change the html background material to regular when set style backgroundMaterial to regular', async () => {
      await applyAndAssertHtmlMaterial('regular', 'regular')
    })

    it('change the html background material to translucent when set style backgroundMaterial to translucent', async () => {
      await applyAndAssertHtmlMaterial('translucent', 'translucent')
    })

    it('change the html background material to transparent when set style backgroundMaterial to transparent', async () => {
      await applyAndAssertHtmlMaterial('transparent', 'transparent')
    })

    it('change the html background material to thick when set style backgroundMaterial to thick', async () => {
      await applyAndAssertHtmlMaterial('thick', 'thick')
    })

    it('change the html background material to none when set style backgroundMaterial to none', async () => {
      await applyAndAssertHtmlMaterial('none', 'none')
    })
  })
})
