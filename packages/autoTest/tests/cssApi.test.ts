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

  type StyleMode = 'In-line style' | 'Css module' | 'Styled Component'

  const defineCssApiStyleSuite = (suiteName: string, styleMode: StyleMode) => {
    describe(suiteName, () => {
      const ensureStyleMode = async () => {
        if (!runner) throw new Error('Puppeteer runner not initialized')
        await runner.waitForFunction(
          () =>
            !!document.querySelector('[data-testid="css-style-mode-select"]'),
        )
        await runner.evaluate((mode: StyleMode) => {
          const select = document.querySelector(
            '[data-testid="css-style-mode-select"]',
          ) as HTMLSelectElement | null
          if (!select) throw new Error('style mode select not found')
          const win = select.ownerDocument?.defaultView
          const setter = Object.getOwnPropertyDescriptor(
            win?.HTMLSelectElement?.prototype ?? HTMLSelectElement.prototype,
            'value',
          )?.set
          if (setter) {
            setter.call(select, mode)
          } else {
            select.value = mode
          }
          select.dispatchEvent(new Event('change', { bubbles: true }))
        }, styleMode)
        await runner.waitForFunction(
          `(() => {
            const select = document.querySelector('[data-testid="css-style-mode-select"]')
            return !!select && select.value === ${JSON.stringify(styleMode)}
          })()`,
        )
      }

      describe(`support ${styleMode} opacity`, () => {
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
            const spatializedElement = (
              window as any
            ).getSpatialized2DElement?.(el)
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

          await ensureStyleMode()

          await runner.waitForFunction(
            () =>
              !!document.querySelector(
                '[data-testid="css-inline-style-target"]',
              ),
          )

          await waitForSpatialized()
          const spatialId = await getSpatialId()
          expect(spatialId).to.be.not.null

          await setOpacityAndApply(sliderValue)

          await runner.waitForFunction(
            `(() => {
            const el = document.querySelector('[data-testid="css-inline-style-target"]')
            if (!el) return false
            const computedOpacity = parseFloat(getComputedStyle(el).opacity || 'NaN')
            if (!Number.isFinite(computedOpacity)) return false
            return Math.abs(computedOpacity - ${expectedDomOpacity}) < 0.01
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
          expect(parseFloat((domOpacity as any).computedOpacity)).to.be.closeTo(
            expectedDomOpacity,
            0.01,
          )
          if (styleMode === 'In-line style') {
            expect(parseFloat((domOpacity as any).styleOpacity)).to.be.closeTo(
              expectedDomOpacity,
              0.01,
            )
          } else {
            expect((domOpacity as any).styleOpacity).to.equal('')
          }

          await expectSpatialOpacity(
            spatialId as string,
            expectedSpatialOpacity,
          )
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

      describe(`support ${styleMode} Display Property`, () => {
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
            const spatializedElement = (
              window as any
            ).getSpatialized2DElement?.(el)
            return spatializedElement ? spatializedElement.id : null
          })
        }

        const setDisplayBySelect = async (value: string) => {
          if (!runner) throw new Error('Puppeteer runner not initialized')
          await runner.evaluate(v => {
            const optionBlock = document.querySelector(
              'select option[value="block"]',
            ) as HTMLOptionElement | null
            const select =
              optionBlock?.parentElement as HTMLSelectElement | null
            if (!select) throw new Error('display select not found')

            select.value = v
            select.dispatchEvent(new Event('input', { bubbles: true }))
            select.dispatchEvent(new Event('change', { bubbles: true }))
          }, value)
        }

        const expectSpatialVisible = async (
          spatialId: string,
          expected: boolean,
        ) => {
          if (!runner) throw new Error('Puppeteer runner not initialized')
          let spatialObj: any = null
          for (let i = 0; i < 50; i++) {
            spatialObj = runner
              .getCurrentScene()
              ?.findSpatialObject(spatialId) as any
            const visible = spatialObj?.visible
            if (typeof visible === 'boolean' && visible === expected) break
            await new Promise(resolve => setTimeout(resolve, 100))
          }
          expect(spatialObj).to.be.not.null
          expect(spatialObj.visible).to.equal(expected)
        }

        const applyAndAssertDisplay = async (
          selectedValue: string,
          expectedInlineDisplay: string,
          expectedComputedDisplay: string,
        ) => {
          if (!runner) throw new Error('Puppeteer runner not initialized')
          await runner.navigate('http://localhost:5173/cssApiTest', {
            waitUntil: 'networkidle0',
            timeout: 30000,
          })

          await ensureStyleMode()

          await runner.waitForFunction(
            () =>
              !!document.querySelector(
                '[data-testid="css-inline-style-target"]',
              ),
          )

          await waitForSpatialized()
          const spatialId = await getSpatialId()
          expect(spatialId).to.be.not.null

          await setDisplayBySelect(selectedValue)

          if (styleMode === 'In-line style') {
            await runner.waitForFunction(
              `(() => {
              const el = document.querySelector('[data-testid="css-inline-style-target"]')
              if (!el) return false
              return el.style.display === ${JSON.stringify(expectedInlineDisplay)}
            })()`,
            )
          }

          await runner.waitForFunction(
            `(() => {
            const el = document.querySelector('[data-testid="css-inline-style-target"]')
            if (!el) return false
            return getComputedStyle(el).display === ${JSON.stringify(expectedComputedDisplay)}
          })()`,
          )

          const displayInfo = await runner.evaluate(() => {
            const el = document.querySelector(
              '[data-testid="css-inline-style-target"]',
            ) as HTMLDivElement | null
            if (!el) return null
            return {
              inlineDisplay: el.style.display,
              computedDisplay: getComputedStyle(el).display,
            }
          })

          expect(displayInfo).to.be.not.null
          expect((displayInfo as any).inlineDisplay).to.equal(
            styleMode === 'In-line style' ? expectedInlineDisplay : '',
          )
          expect((displayInfo as any).computedDisplay).to.equal(
            expectedComputedDisplay,
          )

          return spatialId as string
        }

        it('should set display to none when set display to none using inline style', async () => {
          const spatialId = await applyAndAssertDisplay('none', 'none', 'none')
          await expectSpatialVisible(spatialId, false)
        })

        it('should set display to block when set display to block using inline style', async () => {
          const spatialId = await applyAndAssertDisplay(
            'block',
            'block',
            'block',
          )
          await expectSpatialVisible(spatialId, true)
        })

        it('should set display to empty string when set display to flex using inline style', async () => {
          const spatialId = await applyAndAssertDisplay('', '', 'flex')
          await expectSpatialVisible(spatialId, true)
        })
      })

      describe(`support ${styleMode} visibility property`, () => {
        const waitForSpatialized = async () => {
          if (!runner) throw new Error('Puppeteer runner not initialized')
          await runner.waitForFunction(
            `(() => {
            const find = (doc) => {
              const el = doc.querySelector('[data-testid="css-inline-style-target"]')
              if (el) return el
              const iframes = Array.from(doc.querySelectorAll('iframe'))
              for (const iframe of iframes) {
                try {
                  const childDoc = iframe.contentDocument
                  if (!childDoc) continue
                  const found = find(childDoc)
                  if (found) return found
                } catch {}
              }
              return null
            }
            const el = find(document)
            if (!el) return false
            const w = el.ownerDocument && el.ownerDocument.defaultView
            const fn = w && w.getSpatialized2DElement
            return typeof fn === 'function' && !!fn(el)
          })()`,
          )
        }

        const getSpatialId = async () => {
          if (!runner) throw new Error('Puppeteer runner not initialized')
          return runner.evaluate(() => {
            const find = (doc: Document): HTMLDivElement | null => {
              const el = doc.querySelector(
                '[data-testid="css-inline-style-target"]',
              ) as HTMLDivElement | null
              if (el) return el
              const iframes = Array.from(doc.querySelectorAll('iframe'))
              for (const iframe of iframes) {
                try {
                  const childDoc = (iframe as HTMLIFrameElement).contentDocument
                  if (!childDoc) continue
                  const found = find(childDoc)
                  if (found) return found
                } catch {}
              }
              return null
            }
            const el = find(document)
            if (!el) return null
            const w = el.ownerDocument?.defaultView as any
            const spatializedElement = w?.getSpatialized2DElement?.(el)
            return spatializedElement ? spatializedElement.id : null
          })
        }

        const setVisibilityBySelect = async (value: string) => {
          if (!runner) throw new Error('Puppeteer runner not initialized')
          await runner.evaluate(v => {
            const locate = (
              doc: Document,
            ): { doc: Document; el: HTMLDivElement } | null => {
              const el = doc.querySelector(
                '[data-testid="css-inline-style-target"]',
              ) as HTMLDivElement | null
              if (el) return { doc, el }
              const iframes = Array.from(
                doc.querySelectorAll('iframe'),
              ) as HTMLIFrameElement[]
              for (const iframe of iframes) {
                try {
                  const childDoc = iframe.contentDocument
                  if (!childDoc) continue
                  const found = locate(childDoc)
                  if (found) return found
                } catch {}
              }
              return null
            }

            const located = locate(document)
            if (!located) throw new Error('target element not found')

            const select =
              (
                Array.from(
                  located.doc.querySelectorAll('select'),
                ) as HTMLSelectElement[]
              ).find(s => {
                const headerText =
                  s.parentElement?.previousElementSibling?.textContent ?? ''
                return headerText.trim() === 'Visibility'
              }) ?? null
            if (!select) throw new Error('visibility select not found')
            const win = select.ownerDocument?.defaultView
            const setter = Object.getOwnPropertyDescriptor(
              win?.HTMLSelectElement?.prototype ?? HTMLSelectElement.prototype,
              'value',
            )?.set
            if (setter) {
              setter.call(select, v)
            } else {
              select.value = v
            }
            select.dispatchEvent(new Event('change', { bubbles: true }))
          }, value)
        }

        const expectSpatialVisible = async (
          spatialId: string,
          expected: boolean,
        ) => {
          if (!runner) throw new Error('Puppeteer runner not initialized')
          let spatialObj: any = null
          for (let i = 0; i < 50; i++) {
            spatialObj = runner
              .getCurrentScene()
              ?.findSpatialObject(spatialId) as any
            const visible = spatialObj?.visible
            if (typeof visible === 'boolean' && visible === expected) break
            await new Promise(resolve => setTimeout(resolve, 100))
          }
          expect(spatialObj).to.be.not.null
          expect(spatialObj.visible).to.equal(expected)
        }

        const applyAndAssertVisibility = async (selectedValue: string) => {
          if (!runner) throw new Error('Puppeteer runner not initialized')
          await runner.navigate('http://localhost:5173/cssApiTest', {
            waitUntil: 'networkidle0',
            timeout: 30000,
          })

          await ensureStyleMode()

          await runner.waitForFunction(
            `(() => {
            const find = (doc) => {
              const el = doc.querySelector('[data-testid="css-inline-style-target"]')
              if (el) return el
              const iframes = Array.from(doc.querySelectorAll('iframe'))
              for (const iframe of iframes) {
                try {
                  const childDoc = iframe.contentDocument
                  if (!childDoc) continue
                  const found = find(childDoc)
                  if (found) return found
                } catch {}
              }
              return null
            }
            return !!find(document)
          })()`,
          )

          await waitForSpatialized()
          const spatialId = await getSpatialId()
          expect(spatialId).to.be.not.null

          const waitForVisibilitySelectValue = async (v: string) => {
            if (!runner) throw new Error('Puppeteer runner not initialized')
            await runner.waitForFunction(
              `(() => {
              const locate = (doc) => {
                const el = doc.querySelector('[data-testid="css-inline-style-target"]')
                if (el) return doc
                const iframes = Array.from(doc.querySelectorAll('iframe'))
                for (const iframe of iframes) {
                  try {
                    const childDoc = iframe.contentDocument
                    if (!childDoc) continue
                    const found = locate(childDoc)
                    if (found) return found
                  } catch {}
                }
                return null
              }
              const doc = locate(document)
              if (!doc) return false
              const allSelects = Array.from(doc.querySelectorAll('select'))
              const select = allSelects.find(s => {
                const headerText = (s.parentElement?.previousElementSibling?.textContent ?? '')
                return headerText.trim() === 'Visibility'
              })
              return !!select && select.value === ${JSON.stringify(v)}
            })()`,
            )
          }

          await setVisibilityBySelect(selectedValue)
          await waitForVisibilitySelectValue(selectedValue)

          return spatialId as string
        }

        it('should set visibility to visible when set visibility to visible using inline style', async () => {
          const spatialId = await applyAndAssertVisibility('visible')
          await expectSpatialVisible(spatialId, true)
        })

        it('should set visibility to hidden when set visibility to hidden using inline style', async () => {
          const spatialId = await applyAndAssertVisibility('hidden')
          await expectSpatialVisible(spatialId, false)
        })

        it('should set visibility to empty string when set visibility to empty string using inline style', async () => {
          const spatialId = await applyAndAssertVisibility('')
          await expectSpatialVisible(spatialId, true)
        })
      })

      describe(`support ${styleMode} content-visibility property`, () => {
        const waitForSpatialized = async () => {
          if (!runner) throw new Error('Puppeteer runner not initialized')
          await runner.waitForFunction(
            `(() => {
            const find = (doc) => {
              const el = doc.querySelector('[data-testid="css-inline-style-target"]')
              if (el) return el
              const iframes = Array.from(doc.querySelectorAll('iframe'))
              for (const iframe of iframes) {
                try {
                  const childDoc = iframe.contentDocument
                  if (!childDoc) continue
                  const found = find(childDoc)
                  if (found) return found
                } catch {}
              }
              return null
            }
            const el = find(document)
            if (!el) return false
            const w = el.ownerDocument && el.ownerDocument.defaultView
            const fn = w && w.getSpatialized2DElement
            return typeof fn === 'function' && !!fn(el)
          })()`,
          )
        }

        const getSpatialId = async () => {
          if (!runner) throw new Error('Puppeteer runner not initialized')
          return runner.evaluate(() => {
            const find = (doc: Document): HTMLDivElement | null => {
              const el = doc.querySelector(
                '[data-testid="css-inline-style-target"]',
              ) as HTMLDivElement | null
              if (el) return el
              const iframes = Array.from(doc.querySelectorAll('iframe'))
              for (const iframe of iframes) {
                try {
                  const childDoc = (iframe as HTMLIFrameElement).contentDocument
                  if (!childDoc) continue
                  const found = find(childDoc)
                  if (found) return found
                } catch {}
              }
              return null
            }
            const el = find(document)
            if (!el) return null
            const w = el.ownerDocument?.defaultView as any
            const spatializedElement = w?.getSpatialized2DElement?.(el)
            return spatializedElement ? spatializedElement.id : null
          })
        }

        const setContentVisibilityBySelect = async (value: string) => {
          if (!runner) throw new Error('Puppeteer runner not initialized')
          await runner.evaluate(v => {
            const locate = (
              doc: Document,
            ): { doc: Document; el: HTMLDivElement } | null => {
              const el = doc.querySelector(
                '[data-testid="css-inline-style-target"]',
              ) as HTMLDivElement | null
              if (el) return { doc, el }
              const iframes = Array.from(
                doc.querySelectorAll('iframe'),
              ) as HTMLIFrameElement[]
              for (const iframe of iframes) {
                try {
                  const childDoc = iframe.contentDocument
                  if (!childDoc) continue
                  const found = locate(childDoc)
                  if (found) return found
                } catch {}
              }
              return null
            }

            const located = locate(document)
            if (!located) throw new Error('target element not found')

            const select =
              (
                Array.from(
                  located.doc.querySelectorAll('select'),
                ) as HTMLSelectElement[]
              ).find(s => {
                const headerText =
                  s.parentElement?.previousElementSibling?.textContent ?? ''
                return headerText.trim() === 'ContentVisibility'
              }) ?? null
            if (!select) throw new Error('content-visibility select not found')
            const win = select.ownerDocument?.defaultView
            const setter = Object.getOwnPropertyDescriptor(
              win?.HTMLSelectElement?.prototype ?? HTMLSelectElement.prototype,
              'value',
            )?.set
            if (setter) {
              setter.call(select, v)
            } else {
              select.value = v
            }
            select.dispatchEvent(new Event('change', { bubbles: true }))
          }, value)
        }

        const expectSpatialVisible = async (
          spatialId: string,
          expected: boolean,
        ) => {
          if (!runner) throw new Error('Puppeteer runner not initialized')
          let spatialObj: any = null
          for (let i = 0; i < 50; i++) {
            spatialObj = runner
              .getCurrentScene()
              ?.findSpatialObject(spatialId) as any
            const visible = spatialObj?.visible
            if (typeof visible === 'boolean' && visible === expected) break
            await new Promise(resolve => setTimeout(resolve, 100))
          }
          expect(spatialObj).to.be.not.null
          expect(spatialObj.visible).to.equal(expected)
        }

        const applyAndAssertContentVisibility = async (
          selectedValue: string,
          expectedInline: string,
          expectedComputed: string,
        ) => {
          if (!runner) throw new Error('Puppeteer runner not initialized')
          await runner.navigate('http://localhost:5173/cssApiTest', {
            waitUntil: 'networkidle0',
            timeout: 30000,
          })

          await ensureStyleMode()

          await runner.waitForFunction(
            `(() => {
            const find = (doc) => {
              const el = doc.querySelector('[data-testid="css-inline-style-target"]')
              if (el) return el
              const iframes = Array.from(doc.querySelectorAll('iframe'))
              for (const iframe of iframes) {
                try {
                  const childDoc = iframe.contentDocument
                  if (!childDoc) continue
                  const found = find(childDoc)
                  if (found) return found
                } catch {}
              }
              return null
            }
            return !!find(document)
          })()`,
          )

          await waitForSpatialized()
          const spatialId = await getSpatialId()
          expect(spatialId).to.be.not.null

          const waitForSelectValue = async (v: string) => {
            if (!runner) throw new Error('Puppeteer runner not initialized')
            await runner.waitForFunction(
              `(() => {
              const locate = (doc) => {
                const el = doc.querySelector('[data-testid="css-inline-style-target"]')
                if (el) return doc
                const iframes = Array.from(doc.querySelectorAll('iframe'))
                for (const iframe of iframes) {
                  try {
                    const childDoc = iframe.contentDocument
                    if (!childDoc) continue
                    const found = locate(childDoc)
                    if (found) return found
                  } catch {}
                }
                return null
              }
              const doc = locate(document)
              if (!doc) return false
              const allSelects = Array.from(doc.querySelectorAll('select'))
              const select = allSelects.find(s => {
                const headerText = (s.parentElement?.previousElementSibling?.textContent ?? '')
                return headerText.trim() === 'ContentVisibility'
              })
              return !!select && select.value === ${JSON.stringify(v)}
            })()`,
            )
          }

          await setContentVisibilityBySelect(selectedValue)
          await waitForSelectValue(selectedValue)

          const styleInfo = await runner.evaluate(() => {
            const locate = (doc: Document): Document | null => {
              const el = doc.querySelector(
                '[data-testid="css-inline-style-target"]',
              )
              if (el) return doc
              const iframes = Array.from(
                doc.querySelectorAll('iframe'),
              ) as HTMLIFrameElement[]
              for (const iframe of iframes) {
                try {
                  const childDoc = iframe.contentDocument
                  if (!childDoc) continue
                  const found = locate(childDoc)
                  if (found) return found
                } catch {}
              }
              return null
            }
            const doc = locate(document)
            if (!doc) return null
            const el = doc.querySelector(
              '[data-testid="css-inline-style-target"]',
            ) as HTMLDivElement | null
            if (!el) return null
            return {
              inline: el.style.getPropertyValue('content-visibility'),
              computed: getComputedStyle(el)
                .getPropertyValue('content-visibility')
                .trim(),
            }
          })

          expect(styleInfo).to.be.not.null
          expect((styleInfo as any).inline).to.equal(
            styleMode === 'In-line style' ? expectedInline : '',
          )
          expect((styleInfo as any).computed).to.equal(expectedComputed)

          return spatialId as string
        }

        it('should set content-visibility to visible when set content-visibility to visible using inline style', async () => {
          const spatialId = await applyAndAssertContentVisibility(
            'visible',
            'visible',
            'visible',
          )
          await expectSpatialVisible(spatialId, true)
        })

        it('should set content-visibility to hidden when set content-visibility to hidden using inline style', async () => {
          const spatialId = await applyAndAssertContentVisibility(
            'hidden',
            'hidden',
            'hidden',
          )
          await expectSpatialVisible(spatialId, true)
        })

        it('should set content-visibility to empty string when set content-visibility to empty string using inline style', async () => {
          const spatialId = await applyAndAssertContentVisibility(
            '',
            '',
            'visible',
          )
          await expectSpatialVisible(spatialId, true)
        })
      })

      describe(`Support ${styleMode} Material`, () => {
        const waitForSpatialized = async () => {
          if (!runner) throw new Error('Puppeteer runner not initialized')
          await runner.waitForFunction(
            `(() => {
            const find = (doc) => {
              const el = doc.querySelector('[data-testid="css-inline-style-target"]')
              if (el) return el
              const iframes = Array.from(doc.querySelectorAll('iframe'))
              for (const iframe of iframes) {
                try {
                  const childDoc = iframe.contentDocument
                  if (!childDoc) continue
                  const found = find(childDoc)
                  if (found) return found
                } catch {}
              }
              return null
            }
            const el = find(document)
            if (!el) return false
            const w = el.ownerDocument && el.ownerDocument.defaultView
            const fn = w && w.getSpatialized2DElement
            return typeof fn === 'function' && !!fn(el)
          })()`,
          )
        }

        const getSpatialId = async () => {
          if (!runner) throw new Error('Puppeteer runner not initialized')
          return runner.evaluate(() => {
            const find = (doc: Document): HTMLDivElement | null => {
              const el = doc.querySelector(
                '[data-testid="css-inline-style-target"]',
              ) as HTMLDivElement | null
              if (el) return el
              const iframes = Array.from(doc.querySelectorAll('iframe'))
              for (const iframe of iframes) {
                try {
                  const childDoc = (iframe as HTMLIFrameElement).contentDocument
                  if (!childDoc) continue
                  const found = find(childDoc)
                  if (found) return found
                } catch {}
              }
              return null
            }
            const el = find(document)
            if (!el) return null
            const w = el.ownerDocument?.defaultView as any
            const spatializedElement = w?.getSpatialized2DElement?.(el)
            return spatializedElement ? spatializedElement.id : null
          })
        }

        const setMaterialBySelect = async (value: string) => {
          if (!runner) throw new Error('Puppeteer runner not initialized')
          await runner.evaluate(v => {
            const locate = (doc: Document): Document | null => {
              const el = doc.querySelector(
                '[data-testid="css-inline-style-target"]',
              )
              if (el) return doc
              const iframes = Array.from(
                doc.querySelectorAll('iframe'),
              ) as HTMLIFrameElement[]
              for (const iframe of iframes) {
                try {
                  const childDoc = iframe.contentDocument
                  if (!childDoc) continue
                  const found = locate(childDoc)
                  if (found) return found
                } catch {}
              }
              return null
            }
            const doc = locate(document)
            if (!doc) throw new Error('target document not found')

            const select = doc.querySelector(
              '#backgroundMaterialSelect',
            ) as HTMLSelectElement | null
            if (!select) throw new Error('backgroundMaterialSelect not found')

            const win = select.ownerDocument?.defaultView
            const setter = Object.getOwnPropertyDescriptor(
              win?.HTMLSelectElement?.prototype ?? HTMLSelectElement.prototype,
              'value',
            )?.set
            if (setter) {
              setter.call(select, v)
            } else {
              select.value = v
            }
            select.dispatchEvent(new Event('change', { bubbles: true }))
          }, value)
        }

        const clickApplyMaterial = async () => {
          if (!runner) throw new Error('Puppeteer runner not initialized')
          await runner.evaluate(() => {
            const locate = (doc: Document): Document | null => {
              const el = doc.querySelector(
                '[data-testid="css-inline-style-target"]',
              )
              if (el) return doc
              const iframes = Array.from(
                doc.querySelectorAll('iframe'),
              ) as HTMLIFrameElement[]
              for (const iframe of iframes) {
                try {
                  const childDoc = iframe.contentDocument
                  if (!childDoc) continue
                  const found = locate(childDoc)
                  if (found) return found
                } catch {}
              }
              return null
            }
            const doc = locate(document)
            if (!doc) throw new Error('target document not found')

            const buttons = Array.from(
              doc.querySelectorAll('button'),
            ) as HTMLButtonElement[]
            const btn =
              buttons.find(b => (b.textContent ?? '').trim() === 'Material') ??
              null
            if (!btn) throw new Error('Material apply button not found')
            btn.click()
          })
        }

        const expectMaterialCSSVar = async (expected: string) => {
          if (!runner) throw new Error('Puppeteer runner not initialized')
          let cssVar: string | null = null
          for (let i = 0; i < 50; i++) {
            cssVar = await runner.evaluate(() => {
              const locate = (doc: Document): Document | null => {
                const el = doc.querySelector(
                  '[data-testid="css-inline-style-target"]',
                )
                if (el) return doc
                const iframes = Array.from(
                  doc.querySelectorAll('iframe'),
                ) as HTMLIFrameElement[]
                for (const iframe of iframes) {
                  try {
                    const childDoc = iframe.contentDocument
                    if (!childDoc) continue
                    const found = locate(childDoc)
                    if (found) return found
                  } catch {}
                }
                return null
              }
              const doc = locate(document)
              if (!doc) return null
              const el = doc.querySelector(
                '[data-testid="css-inline-style-target"]',
              ) as HTMLDivElement | null
              if (!el) return null
              return getComputedStyle(el)
                .getPropertyValue('--xr-background-material')
                .trim()
            })
            if (cssVar === expected) break
            await new Promise(resolve => setTimeout(resolve, 100))
          }
          expect(cssVar).to.equal(expected)
        }

        const expectSpatialBackgroundMaterial = async (
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

        const applyAndAssertMaterial = async (selectedValue: string) => {
          if (!runner) throw new Error('Puppeteer runner not initialized')
          await runner.navigate('http://localhost:5173/cssApiTest', {
            waitUntil: 'networkidle0',
            timeout: 30000,
          })

          await ensureStyleMode()

          await runner.waitForFunction(
            `(() => {
            const find = (doc) => {
              const el = doc.querySelector('[data-testid="css-inline-style-target"]')
              if (el) return el
              const iframes = Array.from(doc.querySelectorAll('iframe'))
              for (const iframe of iframes) {
                try {
                  const childDoc = iframe.contentDocument
                  if (!childDoc) continue
                  const found = find(childDoc)
                  if (found) return found
                } catch {}
              }
              return null
            }
            return !!find(document)
          })()`,
          )

          await waitForSpatialized()
          const spatialId = await getSpatialId()
          expect(spatialId).to.be.not.null

          await setMaterialBySelect(selectedValue)
          await clickApplyMaterial()

          await expectMaterialCSSVar(selectedValue)
          await expectSpatialBackgroundMaterial(
            spatialId as string,
            selectedValue,
          )

          return spatialId as string
        }

        it('should set material to empty string when set material to none string using inline style', async () => {
          await applyAndAssertMaterial('none')
        })

        it('should set material to thin when set material to thin using inline style', async () => {
          await applyAndAssertMaterial('thin')
        })

        it('should set material to thick when set material to thick using inline style', async () => {
          await applyAndAssertMaterial('thick')
        })

        it(`should set material to regular when set material to regular using ${styleMode}`, async () => {
          await applyAndAssertMaterial('regular')
        })

        it(`should set material to translucent when set material to translucent using ${styleMode}`, async () => {
          await applyAndAssertMaterial('translucent')
        })
      })

      describe(`Support ${styleMode} transform`, () => {
        it(`should set transform to valid value (40px, 30deg) using ${styleMode}`, async () => {
          if (!runner) throw new Error('Puppeteer runner not initialized')
          await runner.navigate('http://localhost:5173/cssApiTest', {
            waitUntil: 'networkidle0',
            timeout: 30000,
          })

          await ensureStyleMode()

          await runner.waitForFunction(
            () =>
              !!document.querySelector(
                '[data-testid="css-inline-style-target"]',
              ),
          )

          await runner.waitForFunction(
            `(() => {
            const el = document.querySelector('[data-testid="css-inline-style-target"]')
            const fn = window.getSpatialized2DElement
            return !!el && typeof fn === 'function' && !!fn(el)
          })()`,
          )

          await runner.evaluate(() => {
            const ranges = Array.from(
              document.querySelectorAll('input[type="range"]'),
            ) as HTMLInputElement[]
            const translateX = ranges.find(
              r => r.min === '-50' && r.max === '50',
            )
            const rotateZ = ranges.find(
              r => r.min === '-100' && r.max === '100',
            )

            if (!translateX) throw new Error('translateX range not found')
            if (!rotateZ) throw new Error('rotateZ range not found')

            const setter = Object.getOwnPropertyDescriptor(
              HTMLInputElement.prototype,
              'value',
            )?.set
            if (!setter) throw new Error('input value setter not found')

            setter.call(translateX, '40')
            translateX.dispatchEvent(new Event('input', { bubbles: true }))
            translateX.dispatchEvent(new Event('change', { bubbles: true }))

            setter.call(rotateZ, '30')
            rotateZ.dispatchEvent(new Event('input', { bubbles: true }))
            rotateZ.dispatchEvent(new Event('change', { bubbles: true }))
          })

          await runner.waitForFunction(() => {
            const ranges = Array.from(
              document.querySelectorAll('input[type="range"]'),
            ) as HTMLInputElement[]
            const translateX = ranges.find(
              r => r.min === '-50' && r.max === '50',
            )
            const rotateZ = ranges.find(
              r => r.min === '-100' && r.max === '100',
            )
            return translateX?.value === '40' && rotateZ?.value === '30'
          })

          await runner.evaluate(() => {
            const btn = Array.from(document.querySelectorAll('button')).find(
              b => (b.textContent || '').trim() === 'Transform Test',
            ) as HTMLButtonElement | undefined
            if (!btn) throw new Error('Transform Test button not found')
            btn.click()
          })

          const spatialId = await runner.evaluate(() => {
            const el = document.querySelector(
              '[data-testid="css-inline-style-target"]',
            ) as HTMLDivElement | null
            if (!el) return null
            const spatializedElement = (
              window as any
            ).getSpatialized2DElement?.(el)
            return spatializedElement ? spatializedElement.id : null
          })
          expect(spatialId).to.be.not.null

          const cos30 = Math.cos(Math.PI / 6)

          let spatialObj: any = null
          let matrix: number[] | null = null
          for (let i = 0; i < 50; i++) {
            spatialObj = runner
              .getCurrentScene()
              ?.findSpatialObject(spatialId as string) as any
            matrix = (spatialObj?.transform?.matrix as number[]) ?? null
            if (
              Array.isArray(matrix) &&
              matrix.length === 16 &&
              Math.abs(matrix[12] - 40) < 1e-3 &&
              Math.abs(Math.abs(matrix[0]) - cos30) < 1e-3 &&
              Math.abs(Math.abs(matrix[5]) - cos30) < 1e-3
            ) {
              break
            }
            await new Promise(resolve => setTimeout(resolve, 100))
          }
          expect(spatialObj).to.be.not.null
          expect(matrix).to.be.an('array').with.lengthOf(16)
          expect((matrix as number[])[12]).to.be.closeTo(40, 1e-3)
          expect(Math.abs((matrix as number[])[0])).to.be.closeTo(cos30, 1e-3)
          expect(Math.abs((matrix as number[])[5])).to.be.closeTo(cos30, 1e-3)
        })

        it(`should set transform to different value (50px, 60deg) and transformOrigin to left top using ${styleMode}`, async () => {
          if (!runner) throw new Error('Puppeteer runner not initialized')
          await runner.navigate('http://localhost:5173/cssApiTest', {
            waitUntil: 'networkidle0',
            timeout: 30000,
          })

          await ensureStyleMode()

          await runner.waitForFunction(
            () =>
              !!document.querySelector(
                '[data-testid="css-inline-style-target"]',
              ),
          )

          await runner.waitForFunction(
            `(() => {
            const el = document.querySelector('[data-testid="css-inline-style-target"]')
            const fn = window.getSpatialized2DElement
            return !!el && typeof fn === 'function' && !!fn(el)
          })()`,
          )

          await runner.evaluate(() => {
            const ranges = Array.from(
              document.querySelectorAll('input[type="range"]'),
            ) as HTMLInputElement[]
            const translateX = ranges.find(
              r => r.min === '-50' && r.max === '50',
            )
            const rotateZ = ranges.find(
              r => r.min === '-100' && r.max === '100',
            )
            if (!translateX) throw new Error('translateX range not found')
            if (!rotateZ) throw new Error('rotateZ range not found')

            const setter = Object.getOwnPropertyDescriptor(
              HTMLInputElement.prototype,
              'value',
            )?.set
            if (!setter) throw new Error('input value setter not found')

            setter.call(translateX, '50')
            translateX.dispatchEvent(new Event('input', { bubbles: true }))
            translateX.dispatchEvent(new Event('change', { bubbles: true }))

            setter.call(rotateZ, '60')
            rotateZ.dispatchEvent(new Event('input', { bubbles: true }))
            rotateZ.dispatchEvent(new Event('change', { bubbles: true }))

            const option = document.querySelector(
              'select option[value="left top"]',
            ) as HTMLOptionElement | null
            const select = option?.parentElement as HTMLSelectElement | null
            if (!select) throw new Error('transformOrigin select not found')

            const selectSetter = Object.getOwnPropertyDescriptor(
              HTMLSelectElement.prototype,
              'value',
            )?.set
            if (selectSetter) {
              selectSetter.call(select, 'left top')
            } else {
              select.value = 'left top'
            }
            select.dispatchEvent(new Event('change', { bubbles: true }))

            const btn = Array.from(document.querySelectorAll('button')).find(
              b => (b.textContent || '').trim() === 'Transform Test',
            ) as HTMLButtonElement | undefined
            if (!btn) throw new Error('Transform Test button not found')
            btn.click()
          })

          await runner.waitForFunction(() => {
            const ranges = Array.from(
              document.querySelectorAll('input[type="range"]'),
            ) as HTMLInputElement[]
            const translateX = ranges.find(
              r => r.min === '-50' && r.max === '50',
            )
            const rotateZ = ranges.find(
              r => r.min === '-100' && r.max === '100',
            )
            return translateX?.value === '50' && rotateZ?.value === '60'
          })

          const spatialId = await runner.evaluate(() => {
            const el = document.querySelector(
              '[data-testid="css-inline-style-target"]',
            ) as HTMLDivElement | null
            if (!el) return null
            const spatializedElement = (
              window as any
            ).getSpatialized2DElement?.(el)
            return spatializedElement ? spatializedElement.id : null
          })
          expect(spatialId).to.be.not.null

          const originInfo = await runner.evaluate(() => {
            const el = document.querySelector(
              '[data-testid="css-inline-style-target"]',
            ) as HTMLDivElement | null
            if (!el) return null
            return getComputedStyle(el)
              .getPropertyValue('transform-origin')
              .trim()
          })
          expect(originInfo).to.be.a('string')
          expect(originInfo as string).to.match(/^0px\s+0px/)

          const cos60 = Math.cos(Math.PI / 3)
          let spatialObj: any = null
          let matrix: number[] | null = null
          let rotationAnchor: any = null
          for (let i = 0; i < 50; i++) {
            spatialObj = runner
              .getCurrentScene()
              ?.findSpatialObject(spatialId as string) as any
            matrix = (spatialObj?.transform?.matrix as number[]) ?? null
            rotationAnchor = spatialObj?.rotationAnchor
            const okMatrix =
              Array.isArray(matrix) &&
              matrix.length === 16 &&
              Math.abs(matrix[12] - 50) < 1e-3 &&
              Math.abs(Math.abs(matrix[0]) - cos60) < 1e-3 &&
              Math.abs(Math.abs(matrix[5]) - cos60) < 1e-3
            const okAnchor =
              rotationAnchor &&
              typeof rotationAnchor.x === 'number' &&
              typeof rotationAnchor.y === 'number' &&
              rotationAnchor.x < 0.1 &&
              rotationAnchor.y < 0.1
            if (okMatrix && okAnchor) break
            await new Promise(resolve => setTimeout(resolve, 100))
          }

          expect(spatialObj).to.be.not.null
          expect(matrix).to.be.an('array').with.lengthOf(16)
          expect((matrix as number[])[12]).to.be.closeTo(50, 1e-3)
          expect(Math.abs((matrix as number[])[0])).to.be.closeTo(cos60, 1e-3)
          expect(Math.abs((matrix as number[])[5])).to.be.closeTo(cos60, 1e-3)
          expect(rotationAnchor).to.be.not.null
          expect(rotationAnchor.x).to.be.below(0.1)
          expect(rotationAnchor.y).to.be.below(0.1)
        })

        it(`should remove transformOrigin when set transformOrigin to empty string using ${styleMode}`, async () => {
          if (!runner) throw new Error('Puppeteer runner not initialized')
          await runner.navigate('http://localhost:5173/cssApiTest', {
            waitUntil: 'networkidle0',
            timeout: 30000,
          })

          await ensureStyleMode()

          await runner.waitForFunction(
            () =>
              !!document.querySelector(
                '[data-testid="css-inline-style-target"]',
              ),
          )

          await runner.waitForFunction(
            `(() => {
            const el = document.querySelector('[data-testid="css-inline-style-target"]')
            const fn = window.getSpatialized2DElement
            return !!el && typeof fn === 'function' && !!fn(el)
          })()`,
          )

          const spatialId = await runner.evaluate(() => {
            const el = document.querySelector(
              '[data-testid="css-inline-style-target"]',
            ) as HTMLDivElement | null
            if (!el) return null
            const spatializedElement = (
              window as any
            ).getSpatialized2DElement?.(el)
            return spatializedElement ? spatializedElement.id : null
          })
          expect(spatialId).to.be.not.null

          await runner.evaluate(() => {
            const option = document.querySelector(
              'select option[value="left top"]',
            ) as HTMLOptionElement | null
            const select = option?.parentElement as HTMLSelectElement | null
            if (!select) throw new Error('transformOrigin select not found')

            const setter = Object.getOwnPropertyDescriptor(
              HTMLSelectElement.prototype,
              'value',
            )?.set
            if (setter) {
              setter.call(select, 'left top')
            } else {
              select.value = 'left top'
            }
            select.dispatchEvent(new Event('change', { bubbles: true }))
          })

          let spatialObj: any = null
          let rotationAnchor: any = null
          for (let i = 0; i < 50; i++) {
            spatialObj = runner
              .getCurrentScene()
              ?.findSpatialObject(spatialId as string) as any
            rotationAnchor = spatialObj?.rotationAnchor
            if (
              rotationAnchor &&
              typeof rotationAnchor.x === 'number' &&
              typeof rotationAnchor.y === 'number' &&
              rotationAnchor.x < 0.1 &&
              rotationAnchor.y < 0.1
            ) {
              break
            }
            await new Promise(resolve => setTimeout(resolve, 100))
          }
          expect(spatialObj).to.be.not.null
          expect(rotationAnchor).to.be.not.null
          expect(rotationAnchor.x).to.be.below(0.1)
          expect(rotationAnchor.y).to.be.below(0.1)

          await runner.evaluate(() => {
            const option = document.querySelector(
              'select option[value="left top"]',
            ) as HTMLOptionElement | null
            const select = option?.parentElement as HTMLSelectElement | null
            if (!select) throw new Error('transformOrigin select not found')
            const container = select.parentElement as HTMLElement | null
            const removeBtn = Array.from(
              container?.querySelectorAll('button') || [],
            ).find(b => (b.textContent || '').trim() === 'remove') as
              | HTMLButtonElement
              | undefined
            if (!removeBtn)
              throw new Error('transformOrigin remove button not found')
            removeBtn.click()
          })

          await runner.waitForFunction(() => {
            const el = document.querySelector(
              '[data-testid="css-inline-style-target"]',
            ) as HTMLDivElement | null
            if (!el) return false
            const v = getComputedStyle(el)
              .getPropertyValue('transform-origin')
              .trim()
            return !/^0px\s+0px/.test(v)
          })

          for (let i = 0; i < 50; i++) {
            spatialObj = runner
              .getCurrentScene()
              ?.findSpatialObject(spatialId as string) as any
            rotationAnchor = spatialObj?.rotationAnchor
            if (
              rotationAnchor &&
              typeof rotationAnchor.x === 'number' &&
              typeof rotationAnchor.y === 'number' &&
              Math.abs(rotationAnchor.x - 0.5) < 0.05 &&
              Math.abs(rotationAnchor.y - 0.5) < 0.05
            ) {
              break
            }
            await new Promise(resolve => setTimeout(resolve, 100))
          }
          expect(rotationAnchor).to.be.not.null
          expect(rotationAnchor.x).to.be.closeTo(0.5, 0.05)
          expect(rotationAnchor.y).to.be.closeTo(0.5, 0.05)
        })

        it(`should set transform to 0(-10px, 45deg), transformOrigin to right bottom using ${styleMode}`, async () => {
          if (!runner) throw new Error('Puppeteer runner not initialized')
          await runner.navigate('http://localhost:5173/cssApiTest', {
            waitUntil: 'networkidle0',
            timeout: 30000,
          })

          await ensureStyleMode()

          await runner.waitForFunction(
            () =>
              !!document.querySelector(
                '[data-testid="css-inline-style-target"]',
              ),
          )

          await runner.waitForFunction(
            `(() => {
            const el = document.querySelector('[data-testid="css-inline-style-target"]')
            const fn = window.getSpatialized2DElement
            return !!el && typeof fn === 'function' && !!fn(el)
          })()`,
          )

          await runner.evaluate(() => {
            const ranges = Array.from(
              document.querySelectorAll('input[type="range"]'),
            ) as HTMLInputElement[]
            const translateX = ranges.find(
              r => r.min === '-50' && r.max === '50',
            )
            const rotateZ = ranges.find(
              r => r.min === '-100' && r.max === '100',
            )
            if (!translateX) throw new Error('translateX range not found')
            if (!rotateZ) throw new Error('rotateZ range not found')

            const setter = Object.getOwnPropertyDescriptor(
              HTMLInputElement.prototype,
              'value',
            )?.set
            if (!setter) throw new Error('input value setter not found')

            setter.call(translateX, '-10')
            translateX.dispatchEvent(new Event('input', { bubbles: true }))
            translateX.dispatchEvent(new Event('change', { bubbles: true }))

            setter.call(rotateZ, '45')
            rotateZ.dispatchEvent(new Event('input', { bubbles: true }))
            rotateZ.dispatchEvent(new Event('change', { bubbles: true }))

            const option = document.querySelector(
              'select option[value="right bottom"]',
            ) as HTMLOptionElement | null
            const select = option?.parentElement as HTMLSelectElement | null
            if (!select) throw new Error('transformOrigin select not found')

            const selectSetter = Object.getOwnPropertyDescriptor(
              HTMLSelectElement.prototype,
              'value',
            )?.set
            if (selectSetter) {
              selectSetter.call(select, 'right bottom')
            } else {
              select.value = 'right bottom'
            }
            select.dispatchEvent(new Event('change', { bubbles: true }))

            const btn = Array.from(document.querySelectorAll('button')).find(
              b => (b.textContent || '').trim() === 'Transform Test',
            ) as HTMLButtonElement | undefined
            if (!btn) throw new Error('Transform Test button not found')
            btn.click()
          })

          await runner.waitForFunction(() => {
            const ranges = Array.from(
              document.querySelectorAll('input[type="range"]'),
            ) as HTMLInputElement[]
            const translateX = ranges.find(
              r => r.min === '-50' && r.max === '50',
            )
            const rotateZ = ranges.find(
              r => r.min === '-100' && r.max === '100',
            )
            return translateX?.value === '-10' && rotateZ?.value === '45'
          })

          const originInfo = await runner.evaluate(() => {
            const el = document.querySelector(
              '[data-testid="css-inline-style-target"]',
            ) as HTMLDivElement | null
            if (!el) return null
            return getComputedStyle(el)
              .getPropertyValue('transform-origin')
              .trim()
          })
          expect(originInfo).to.be.a('string')

          const spatialId = await runner.evaluate(() => {
            const el = document.querySelector(
              '[data-testid="css-inline-style-target"]',
            ) as HTMLDivElement | null
            if (!el) return null
            const spatializedElement = (
              window as any
            ).getSpatialized2DElement?.(el)
            return spatializedElement ? spatializedElement.id : null
          })
          expect(spatialId).to.be.not.null

          const cos45 = Math.SQRT1_2
          let spatialObj: any = null
          let matrix: number[] | null = null
          let rotationAnchor: any = null
          for (let i = 0; i < 50; i++) {
            spatialObj = runner
              .getCurrentScene()
              ?.findSpatialObject(spatialId as string) as any
            matrix = (spatialObj?.transform?.matrix as number[]) ?? null
            rotationAnchor = spatialObj?.rotationAnchor
            const okMatrix =
              Array.isArray(matrix) &&
              matrix.length === 16 &&
              Math.abs(matrix[12] - -10) < 1e-3 &&
              Math.abs(Math.abs(matrix[0]) - cos45) < 1e-3 &&
              Math.abs(Math.abs(matrix[5]) - cos45) < 1e-3
            const okAnchor =
              rotationAnchor &&
              typeof rotationAnchor.x === 'number' &&
              typeof rotationAnchor.y === 'number' &&
              rotationAnchor.x > 0.9 &&
              rotationAnchor.y > 0.9
            if (okMatrix && okAnchor) break
            await new Promise(resolve => setTimeout(resolve, 100))
          }

          expect(spatialObj).to.be.not.null
          expect(matrix).to.be.an('array').with.lengthOf(16)
          expect((matrix as number[])[12]).to.be.closeTo(-10, 1e-3)
          expect(Math.abs((matrix as number[])[0])).to.be.closeTo(cos45, 1e-3)
          expect(Math.abs((matrix as number[])[5])).to.be.closeTo(cos45, 1e-3)
          expect(rotationAnchor).to.be.not.null
          expect(rotationAnchor.x).to.be.above(0.9)
          expect(rotationAnchor.y).to.be.above(0.9)
        })
      })
    })
  }

  defineCssApiStyleSuite('Support JSX In-line style', 'In-line style')
  defineCssApiStyleSuite('Support CSS Module', 'Css module')
  defineCssApiStyleSuite('Support Styled Component', 'Styled Component')
})
