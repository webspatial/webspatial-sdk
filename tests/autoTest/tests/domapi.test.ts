import { expect } from 'chai'
import { PuppeteerRunner } from '../src/runtime/puppeteerRunner'
import { spawn, ChildProcess } from 'child_process'
import { before, after } from 'mocha'
import 'source-map-support/register'

let runner: PuppeteerRunner | null = null
let server: ChildProcess | null = null

describe('DOM API includes spatial support', function (this: Mocha.Suite) {
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
    const keepVite = false
    if (runner && runner.close) {
      await runner.close()
    }
    if (!keepVite && server) {
      if (server.pid) {
        try {
          process.kill(-server.pid)
        } catch {
          server.kill('SIGTERM')
        }
      } else {
        server.kill('SIGTERM')
      }
    } else if (keepVite) {
      console.log('KEEP_VITE=1: 保留 Vite 开发服务器以便调试')
    }
  })

  describe('Border Radius tests', async () => {
    it('should set and get the corret value (50) for border-radius property of a spatial div when enable-xr is present in html', async () => {
      if (!runner) throw new Error('Puppeteer runner not initialized')
      await runner.navigate('http://localhost:5173/domApiTest', {
        waitUntil: 'networkidle0',
        timeout: 30000,
      })

      await runner.waitForFunction(() => !!(window as any).ref?.current)
      const interactionResult = await runner.evaluate(() => {
        // find the section with border radius button
        const sections = Array.from(
          document.querySelectorAll('.grid.grid-cols-2'),
        )
        let borderBtn: HTMLButtonElement | undefined
        let sliderChanged = false
        const targetSection = sections.find(sec =>
          Array.from(sec.querySelectorAll('button')).some(
            b => (b.textContent || '').trim() === 'Border Radius',
          ),
        )
        if (targetSection) {
          // find the border radius button in the section
          borderBtn = Array.from(targetSection.querySelectorAll('button')).find(
            b => (b.textContent || '').trim() === 'Border Radius',
          ) as HTMLButtonElement | undefined
          const container = borderBtn?.nextElementSibling as HTMLElement | null

          // find the border radius slider in the section, set its value to 50
          const slider = container?.querySelector(
            'input[type="range"]',
          ) as HTMLInputElement | null
          if (slider) {
            const desc = Object.getOwnPropertyDescriptor(
              HTMLInputElement.prototype,
              'value',
            )
            desc?.set?.call(slider, '50')
            slider.dispatchEvent(new Event('input', { bubbles: true }))
            slider.dispatchEvent(new Event('change', { bubbles: true }))
            sliderChanged = true
          }
        }
        return { buttonFound: !!borderBtn, sliderChanged }
      })
      expect(interactionResult.buttonFound).to.be.true
      expect(interactionResult.sliderChanged).to.be.true

      // wait for the border radius value to be updated in the span element
      await runner.waitForFunction(() => {
        const sections = Array.from(
          document.querySelectorAll('.grid.grid-cols-2'),
        )
        const targetSection = sections.find(sec =>
          Array.from(sec.querySelectorAll('button')).some(
            b => (b.textContent || '').trim() === 'Border Radius',
          ),
        )
        if (!targetSection) return false
        const borderBtn = Array.from(
          targetSection.querySelectorAll('button'),
        ).find(b => (b.textContent || '').trim() === 'Border Radius') as
          | HTMLButtonElement
          | undefined
        const container = borderBtn?.nextElementSibling as HTMLElement | null
        const valueSpan = container?.querySelector(
          'span',
        ) as HTMLSpanElement | null
        return valueSpan?.textContent?.trim() === '50px'
      })

      // click the border radius button to apply the radius value
      await runner.evaluate(() => {
        const sections = Array.from(
          document.querySelectorAll('.grid.grid-cols-2'),
        )
        const targetSection = sections.find(sec =>
          Array.from(sec.querySelectorAll('button')).some(
            b => (b.textContent || '').trim() === 'Border Radius',
          ),
        )
        const borderBtn = Array.from(
          targetSection!.querySelectorAll('button'),
        ).find(
          b => (b.textContent || '').trim() === 'Border Radius',
        ) as HTMLButtonElement
        borderBtn.click()
      })

      // wait for the border radius value to be applied
      await runner.waitForFunction(() => {
        const el = (window as any).ref?.current as HTMLDivElement | null
        if (!el) return false
        return el.style.getPropertyValue('border-radius') === '50px'
      })

      const spatializedElementId = await runner.evaluate(() => {
        const el = (window as any).ref?.current as HTMLDivElement | null
        if (!el) return null
        const spatializedElement = (window as any).getSpatialized2DElement?.(el)
        return spatializedElement ? spatializedElement.id : null
      })
      expect(spatializedElementId).to.be.not.null

      const spatialObj = runner
        .getCurrentScene()
        ?.findSpatialObject(spatializedElementId as string) as any
      expect(spatialObj).to.be.not.null
      expect(spatialObj.cornerRadius?.topLeading).to.equal(50)
      expect(spatialObj.cornerRadius?.bottomLeading).to.equal(50)
      expect(spatialObj.cornerRadius?.topTrailing).to.equal(50)
      expect(spatialObj.cornerRadius?.bottomTrailing).to.equal(50)
    })

    it('should clamp invalid border-radius (999px) to element constraints (100px) in SpatialScene', async () => {
      if (!runner) throw new Error('Puppeteer runner not initialized')
      await runner.navigate('http://localhost:5173/domApiTest', {
        waitUntil: 'networkidle0',
        timeout: 30000,
      })

      // wait for the spatialized element to be ready
      await runner.waitForFunction(() => !!(window as any).ref?.current)

      const interactionResult = await runner.evaluate(() => {
        const sections = Array.from(
          document.querySelectorAll('.grid.grid-cols-2'),
        )

        // find the section with border radius button
        let borderBtn: HTMLButtonElement | undefined
        let sliderChanged = false
        const targetSection = sections.find(sec =>
          Array.from(sec.querySelectorAll('button')).some(
            b => (b.textContent || '').trim() === 'Border Radius',
          ),
        )
        if (targetSection) {
          borderBtn = Array.from(targetSection.querySelectorAll('button')).find(
            b => (b.textContent || '').trim() === 'Border Radius',
          ) as HTMLButtonElement | undefined
          const container = borderBtn?.nextElementSibling as HTMLElement | null
          const slider = container?.querySelector(
            'input[type="range"]',
          ) as HTMLInputElement | null

          // find the border radius slider in the section, set its value to 999
          if (slider) {
            const desc = Object.getOwnPropertyDescriptor(
              HTMLInputElement.prototype,
              'value',
            )
            desc?.set?.call(slider, '999')
            slider.dispatchEvent(new Event('input', { bubbles: true }))
            slider.dispatchEvent(new Event('change', { bubbles: true }))
            sliderChanged = true
          }
        }
        return { buttonFound: !!borderBtn, sliderChanged }
      })
      expect(interactionResult.buttonFound).to.be.true
      expect(interactionResult.sliderChanged).to.be.true

      // wait for the border radius value to be updated in the span element to be 100px
      await runner.waitForFunction(() => {
        const sections = Array.from(
          document.querySelectorAll('.grid.grid-cols-2'),
        )
        const targetSection = sections.find(sec =>
          Array.from(sec.querySelectorAll('button')).some(
            b => (b.textContent || '').trim() === 'Border Radius',
          ),
        )
        if (!targetSection) return false
        const borderBtn = Array.from(
          targetSection.querySelectorAll('button'),
        ).find(b => (b.textContent || '').trim() === 'Border Radius') as
          | HTMLButtonElement
          | undefined
        const container = borderBtn?.nextElementSibling as HTMLElement | null
        const valueSpan = container?.querySelector(
          'span',
        ) as HTMLSpanElement | null
        return valueSpan?.textContent?.trim() === '100px'
      })

      // click the border radius button to apply the radius value
      await runner.evaluate(() => {
        const sections = Array.from(
          document.querySelectorAll('.grid.grid-cols-2'),
        )
        const targetSection = sections.find(sec =>
          Array.from(sec.querySelectorAll('button')).some(
            b => (b.textContent || '').trim() === 'Border Radius',
          ),
        )
        const borderBtn = Array.from(
          targetSection!.querySelectorAll('button'),
        ).find(
          b => (b.textContent || '').trim() === 'Border Radius',
        ) as HTMLButtonElement
        borderBtn.click()
      })

      // wait for the border radius value to be applied
      await runner.waitForFunction(() => {
        const el = (window as any).ref?.current as HTMLDivElement | null
        if (!el) return false
        return el.style.getPropertyValue('border-radius') === '100px'
      })

      // get the spatialized element id
      const spatializedElementId = await runner.evaluate(() => {
        const el = (window as any).ref?.current as HTMLDivElement | null
        if (!el) return null
        const spatializedElement = (window as any).getSpatialized2DElement?.(el)
        return spatializedElement ? spatializedElement.id : null
      })
      expect(spatializedElementId).to.be.not.null

      const spatialObj = runner
        .getCurrentScene()
        ?.findSpatialObject(spatializedElementId as string) as any
      expect(spatialObj).to.be.not.null

      const clampExpected = 100
      expect(spatialObj.cornerRadius?.topLeading).to.equal(clampExpected)
      expect(spatialObj.cornerRadius?.bottomLeading).to.equal(clampExpected)
      expect(spatialObj.cornerRadius?.topTrailing).to.equal(clampExpected)
      expect(spatialObj.cornerRadius?.bottomTrailing).to.equal(clampExpected)
    })

    it('should successfully remove border-radius property of a spatial div when enable-xr is present in html', async () => {
      if (!runner) throw new Error('Puppeteer runner not initialized')
      // Navigate to the test page and ensure the target element ref is available
      await runner.navigate('http://localhost:5173/domApiTest', {
        waitUntil: 'networkidle0',
        timeout: 30000,
      })
      await runner.waitForFunction(() => !!(window as any).ref?.current)
      // Set the border radius slider to 50 and click the "Border Radius" button to apply inline style
      await runner.evaluate(() => {
        const sections = Array.from(
          document.querySelectorAll('.grid.grid-cols-2'),
        )
        const targetSection = sections.find(sec =>
          Array.from(sec.querySelectorAll('button')).some(
            b => (b.textContent || '').trim() === 'Border Radius',
          ),
        )
        const borderBtn = Array.from(
          targetSection!.querySelectorAll('button'),
        ).find(
          b => (b.textContent || '').trim() === 'Border Radius',
        ) as HTMLButtonElement
        const container = borderBtn.nextElementSibling as HTMLElement
        const slider = container.querySelector(
          'input[type="range"]',
        ) as HTMLInputElement
        const desc = Object.getOwnPropertyDescriptor(
          HTMLInputElement.prototype,
          'value',
        )
        desc?.set?.call(slider, '50')
        slider.dispatchEvent(new Event('input', { bubbles: true }))
        slider.dispatchEvent(new Event('change', { bubbles: true }))
        borderBtn.click()
      })
      // Verify inline style reflects the applied border radius value
      await runner.waitForFunction(() => {
        const el = (window as any).ref?.current as HTMLDivElement | null
        return !!el && el.style.getPropertyValue('border-radius') === '50px'
      })

      // Click the "Remove" button to clear inline border-radius property
      await runner.evaluate(() => {
        const sections = Array.from(
          document.querySelectorAll('.grid.grid-cols-2'),
        )
        const targetSection = sections.find(sec =>
          Array.from(sec.querySelectorAll('button')).some(
            b => (b.textContent || '').trim() === 'Border Radius',
          ),
        )
        const borderBtn = Array.from(
          targetSection!.querySelectorAll('button'),
        ).find(
          b => (b.textContent || '').trim() === 'Border Radius',
        ) as HTMLButtonElement
        const container = borderBtn.nextElementSibling as HTMLElement
        const removeBtn = Array.from(container.querySelectorAll('button')).find(
          b => (b.textContent || '').trim() === 'Remove',
        ) as HTMLButtonElement
        removeBtn.click()
      })
      // Verify inline border-radius style has been removed (empty string)
      await runner.waitForFunction(() => {
        const el = (window as any).ref?.current as HTMLDivElement | null
        return !!el && el.style.getPropertyValue('border-radius') === ''
      })

      // Fetch the spatialized element and assert SpatialScene cornerRadius falls back to class-based default (rounded-lg => 8px)
      const spatializedElementId = await runner.evaluate(() => {
        const el = (window as any).ref?.current as HTMLDivElement | null
        if (!el) return null
        const spatializedElement = (window as any).getSpatialized2DElement?.(el)
        return spatializedElement ? spatializedElement.id : null
      })
      expect(spatializedElementId).to.be.not.null
      const spatialObj = runner
        .getCurrentScene()
        ?.findSpatialObject(spatializedElementId as string) as any

      // Inline removal only clears style.border-radius ; it does not remove class-based styles. The target element still has rounded-lg in its class list, so CSS keeps a radius.
      // rounded-lg in Tailwind sets border-radius: 0.5rem which is 8px with a 16px root font size. That class continues to apply after the inline style is removed.
      expect(spatialObj).to.be.not.null
      expect(spatialObj.cornerRadius?.topLeading).to.equal(8)
      expect(spatialObj.cornerRadius?.bottomLeading).to.equal(8)
      expect(spatialObj.cornerRadius?.topTrailing).to.equal(8)
      expect(spatialObj.cornerRadius?.bottomTrailing).to.equal(8)
    })

    it('should be successfully apply valid border-radius value after this property is removed', async () => {
      if (!runner) throw new Error('Puppeteer runner not initialized')
      // Navigate to the page and ensure the test element ref is ready
      await runner.navigate('http://localhost:5173/domApiTest', {
        waitUntil: 'networkidle0',
        timeout: 30000,
      })
      await runner.waitForFunction(() => !!(window as any).ref?.current)

      // First remove inline border-radius so the element falls back to class-based radius (rounded-lg)
      await runner.evaluate(() => {
        const sections = Array.from(
          document.querySelectorAll('.grid.grid-cols-2'),
        )
        const targetSection = sections.find(sec =>
          Array.from(sec.querySelectorAll('button')).some(
            b => (b.textContent || '').trim() === 'Border Radius',
          ),
        )
        const borderBtn = Array.from(
          targetSection!.querySelectorAll('button'),
        ).find(
          b => (b.textContent || '').trim() === 'Border Radius',
        ) as HTMLButtonElement
        const container = borderBtn.nextElementSibling as HTMLElement
        const removeBtn = Array.from(container.querySelectorAll('button')).find(
          b => (b.textContent || '').trim() === 'Remove',
        ) as HTMLButtonElement
        removeBtn.click()
      })
      // Verify inline border-radius is cleared
      await runner.waitForFunction(() => {
        const el = (window as any).ref?.current as HTMLDivElement | null
        return !!el && el.style.getPropertyValue('border-radius') === ''
      })

      // Apply a new valid value via the slider and button, expect inline style to reflect 50px
      const applyResult = await runner.evaluate(() => {
        const sections = Array.from(
          document.querySelectorAll('.grid.grid-cols-2'),
        )
        const targetSection = sections.find(sec =>
          Array.from(sec.querySelectorAll('button')).some(
            b => (b.textContent || '').trim() === 'Border Radius',
          ),
        )
        const borderBtn = Array.from(
          targetSection!.querySelectorAll('button'),
        ).find(
          b => (b.textContent || '').trim() === 'Border Radius',
        ) as HTMLButtonElement
        const container = borderBtn.nextElementSibling as HTMLElement
        const slider = container.querySelector(
          'input[type="range"]',
        ) as HTMLInputElement
        const desc = Object.getOwnPropertyDescriptor(
          HTMLInputElement.prototype,
          'value',
        )
        desc?.set?.call(slider, '50')
        slider.dispatchEvent(new Event('input', { bubbles: true }))
        slider.dispatchEvent(new Event('change', { bubbles: true }))
        borderBtn.click()
        const el = (window as any).ref?.current as HTMLDivElement | null
        return el?.style.getPropertyValue('border-radius') || null
      })
      expect(applyResult).to.equal('50px')

      // Confirm SpatialScene reflects the new per-corner radius
      const spatializedElementId = await runner.evaluate(() => {
        const el = (window as any).ref?.current as HTMLDivElement | null
        if (!el) return null
        const spatializedElement = (window as any).getSpatialized2DElement?.(el)
        return spatializedElement ? spatializedElement.id : null
      })
      expect(spatializedElementId).to.be.not.null
      const spatialObj = runner
        .getCurrentScene()
        ?.findSpatialObject(spatializedElementId as string) as any
      expect(spatialObj).to.be.not.null
      expect(spatialObj.cornerRadius?.topLeading).to.equal(50)
      expect(spatialObj.cornerRadius?.bottomLeading).to.equal(50)
      expect(spatialObj.cornerRadius?.topTrailing).to.equal(50)
      expect(spatialObj.cornerRadius?.bottomTrailing).to.equal(50)
    })
  })

  describe('--xr-background-material tests', async () => {
    it('should set and get the thin value for xr-background-material property of a spatial div when enable-xr is present in html', async () => {
      // Navigate and ensure test element is mounted
      if (!runner) throw new Error('Puppeteer runner not initialized')
      await runner.navigate('http://localhost:5173/domApiTest', {
        waitUntil: 'networkidle0',
        timeout: 30000,
      })
      await runner.waitForFunction(() => !!(window as any).ref?.current)

      // Pick background material 'thin' from the select next to the "Material" button
      // Note: there are multiple selects with the same id on the page; use relative lookup from the button's container
      await runner.evaluate(() => {
        const materialBtn = Array.from(
          document.querySelectorAll('button'),
        ).find(b => (b.textContent || '').trim() === 'Material') as
          | HTMLButtonElement
          | undefined
        const container = materialBtn?.nextElementSibling as HTMLElement | null
        const select = container?.querySelector(
          'select',
        ) as HTMLSelectElement | null
        if (select) {
          select.value = 'thin'
          select.dispatchEvent(new Event('change', { bubbles: true }))
        }
      })

      // Wait until inline CSS variable reflects the chosen material
      await runner.waitForFunction(() => {
        const el = (window as any).ref?.current as HTMLDivElement | null
        if (!el) return false
        return el.style.getPropertyValue('--xr-background-material') === 'thin'
      })

      // Click the "Material" button to apply the selection
      await runner.evaluate(() => {
        const materialBtn = Array.from(
          document.querySelectorAll('button'),
        ).find(b => (b.textContent || '').trim() === 'Material') as
          | HTMLButtonElement
          | undefined
        materialBtn?.click()
      })

      // Verify the CSS variable remains 'thin' after application
      await runner.waitForFunction(() => {
        const el = (window as any).ref?.current as HTMLDivElement | null
        if (!el) return false
        return el.style.getPropertyValue('--xr-background-material') === 'thin'
      })

      // Inspect SpatialScene and assert the spatialized element's material is updated
      const spatializedElementId = await runner.evaluate(() => {
        const el = (window as any).ref?.current as HTMLDivElement | null
        if (!el) return null
        const spatializedElement = (window as any).getSpatialized2DElement?.(el)
        return spatializedElement ? spatializedElement.id : null
      })
      expect(spatializedElementId).to.be.not.null
      const spatialObj = runner
        .getCurrentScene()
        ?.findSpatialObject(spatializedElementId as string) as any
      expect(spatialObj).to.be.not.null
      expect(spatialObj.backgroundMaterial).to.equal('thin')
    })

    it('should set and get the regular value for --xr-background-material property of a spatial div when enable-xr is present in html', async () => {
      // Navigate and ensure test element is mounted
      if (!runner) throw new Error('Puppeteer runner not initialized')
      await runner.navigate('http://localhost:5173/domApiTest', {
        waitUntil: 'networkidle0',
        timeout: 30000,
      })
      await runner.waitForFunction(() => !!(window as any).ref?.current)

      // Pick background material 'regular' from the select next to the "Material" button
      // Note: there are multiple selects with the same id on the page; use relative lookup from the button's container
      await runner.evaluate(() => {
        const materialBtn = Array.from(
          document.querySelectorAll('button'),
        ).find(b => (b.textContent || '').trim() === 'Material') as
          | HTMLButtonElement
          | undefined
        const container = materialBtn?.nextElementSibling as HTMLElement | null
        const select = container?.querySelector(
          'select',
        ) as HTMLSelectElement | null
        if (select) {
          select.value = 'regular'
          select.dispatchEvent(new Event('change', { bubbles: true }))
        }
      })

      // Wait until inline CSS variable reflects the chosen material
      await runner.waitForFunction(() => {
        const el = (window as any).ref?.current as HTMLDivElement | null
        if (!el) return false
        return (
          el.style.getPropertyValue('--xr-background-material') === 'regular'
        )
      })

      // Click the "Material" button to apply the selection
      await runner.evaluate(() => {
        const materialBtn = Array.from(
          document.querySelectorAll('button'),
        ).find(b => (b.textContent || '').trim() === 'Material') as
          | HTMLButtonElement
          | undefined
        materialBtn?.click()
      })

      // Verify the CSS variable remains 'regular' after application
      await runner.waitForFunction(() => {
        const el = (window as any).ref?.current as HTMLDivElement | null
        if (!el) return false
        return (
          el.style.getPropertyValue('--xr-background-material') === 'regular'
        )
      })

      // Inspect SpatialScene and assert the spatialized element's material is updated
      const spatializedElementId = await runner.evaluate(() => {
        const el = (window as any).ref?.current as HTMLDivElement | null
        if (!el) return null
        const spatializedElement = (window as any).getSpatialized2DElement?.(el)
        return spatializedElement ? spatializedElement.id : null
      })
      expect(spatializedElementId).to.be.not.null
      const spatialObj = runner
        .getCurrentScene()
        ?.findSpatialObject(spatializedElementId as string) as any
      expect(spatialObj).to.be.not.null
      expect(spatialObj.backgroundMaterial).to.equal('regular')
    })

    it('should set and get the translucent value for --xr-background-material property of a spatial div when enable-xr is present in html', async () => {
      // Navigate and ensure test element is mounted
      if (!runner) throw new Error('Puppeteer runner not initialized')
      await runner.navigate('http://localhost:5173/domApiTest', {
        waitUntil: 'networkidle0',
        timeout: 30000,
      })
      await runner.waitForFunction(() => !!(window as any).ref?.current)

      // Pick background material 'translucent' from the select next to the "Material" button
      // Note: there are multiple selects with the same id on the page; use relative lookup from the button's container
      await runner.evaluate(() => {
        const materialBtn = Array.from(
          document.querySelectorAll('button'),
        ).find(b => (b.textContent || '').trim() === 'Material') as
          | HTMLButtonElement
          | undefined
        const container = materialBtn?.nextElementSibling as HTMLElement | null
        const select = container?.querySelector(
          'select',
        ) as HTMLSelectElement | null
        if (select) {
          select.value = 'translucent'
          select.dispatchEvent(new Event('change', { bubbles: true }))
        }
      })

      // Wait until inline CSS variable reflects the chosen material
      await runner.waitForFunction(() => {
        const el = (window as any).ref?.current as HTMLDivElement | null
        if (!el) return false
        return (
          el.style.getPropertyValue('--xr-background-material') ===
          'translucent'
        )
      })

      // Click the "Material" button to apply the selection
      await runner.evaluate(() => {
        const materialBtn = Array.from(
          document.querySelectorAll('button'),
        ).find(b => (b.textContent || '').trim() === 'Material') as
          | HTMLButtonElement
          | undefined
        materialBtn?.click()
      })

      // Verify the CSS variable remains 'translucent' after application
      await runner.waitForFunction(() => {
        const el = (window as any).ref?.current as HTMLDivElement | null
        if (!el) return false
        return (
          el.style.getPropertyValue('--xr-background-material') ===
          'translucent'
        )
      })

      // Inspect SpatialScene and assert the spatialized element's material is updated
      const spatializedElementId = await runner.evaluate(() => {
        const el = (window as any).ref?.current as HTMLDivElement | null
        if (!el) return null
        const spatializedElement = (window as any).getSpatialized2DElement?.(el)
        return spatializedElement ? spatializedElement.id : null
      })
      expect(spatializedElementId).to.be.not.null
      const spatialObj = runner
        .getCurrentScene()
        ?.findSpatialObject(spatializedElementId as string) as any
      expect(spatialObj).to.be.not.null
      expect(spatialObj.backgroundMaterial).to.equal('translucent')
    })
  })

  it('should set and get the thick value for --xr-background-material property of a spatial div when enable-xr is present in html', async () => {
    // Navigate and ensure test element is mounted
    if (!runner) throw new Error('Puppeteer runner not initialized')
    await runner.navigate('http://localhost:5173/domApiTest', {
      waitUntil: 'networkidle0',
      timeout: 30000,
    })
    await runner.waitForFunction(() => !!(window as any).ref?.current)

    // Pick background material 'thick' from the select next to the "Material" button
    // Note: there are multiple selects with the same id on the page; use relative lookup from the button's container
    await runner.evaluate(() => {
      const materialBtn = Array.from(document.querySelectorAll('button')).find(
        b => (b.textContent || '').trim() === 'Material',
      ) as HTMLButtonElement | undefined
      const container = materialBtn?.nextElementSibling as HTMLElement | null
      const select = container?.querySelector(
        'select',
      ) as HTMLSelectElement | null
      if (select) {
        select.value = 'thick'
        select.dispatchEvent(new Event('change', { bubbles: true }))
      }
    })

    // Wait until inline CSS variable reflects the chosen material
    await runner.waitForFunction(() => {
      const el = (window as any).ref?.current as HTMLDivElement | null
      if (!el) return false
      return el.style.getPropertyValue('--xr-background-material') === 'thick'
    })

    // Click the "Material" button to apply the selection
    await runner.evaluate(() => {
      const materialBtn = Array.from(document.querySelectorAll('button')).find(
        b => (b.textContent || '').trim() === 'Material',
      ) as HTMLButtonElement | undefined
      materialBtn?.click()
    })

    // Verify the CSS variable remains 'thick' after application
    await runner.waitForFunction(() => {
      const el = (window as any).ref?.current as HTMLDivElement | null
      if (!el) return false
      return el.style.getPropertyValue('--xr-background-material') === 'thick'
    })

    // Inspect SpatialScene and assert the spatialized element's material is updated
    const spatializedElementId = await runner.evaluate(() => {
      const el = (window as any).ref?.current as HTMLDivElement | null
      if (!el) return null
      const spatializedElement = (window as any).getSpatialized2DElement?.(el)
      return spatializedElement ? spatializedElement.id : null
    })
    expect(spatializedElementId).to.be.not.null
    const spatialObj = runner
      .getCurrentScene()
      ?.findSpatialObject(spatializedElementId as string) as any
    expect(spatialObj).to.be.not.null
    expect(spatialObj.backgroundMaterial).to.equal('thick')
  })

  it('should set and get the none value for xr-background-material property of a spatial div when enable-xr is present in html', async () => {
    // Navigate and ensure test element is mounted
    if (!runner) throw new Error('Puppeteer runner not initialized')
    await runner.navigate('http://localhost:5173/domApiTest', {
      waitUntil: 'networkidle0',
      timeout: 30000,
    })
    await runner.waitForFunction(() => !!(window as any).ref?.current)

    // Pick background material 'none' from the select next to the "Material" button
    // Note: there are multiple selects with the same id on the page; use relative lookup from the button's container
    await runner.evaluate(() => {
      const materialBtn = Array.from(document.querySelectorAll('button')).find(
        b => (b.textContent || '').trim() === 'Material',
      ) as HTMLButtonElement | undefined
      const container = materialBtn?.nextElementSibling as HTMLElement | null
      const select = container?.querySelector(
        'select',
      ) as HTMLSelectElement | null
      if (select) {
        select.value = 'none'
        select.dispatchEvent(new Event('change', { bubbles: true }))
      }
    })

    // Wait until inline CSS variable reflects the chosen material
    await runner.waitForFunction(() => {
      const el = (window as any).ref?.current as HTMLDivElement | null
      if (!el) return false
      return el.style.getPropertyValue('--xr-background-material') === 'none'
    })

    // Click the "Material" button to apply the selection
    await runner.evaluate(() => {
      const materialBtn = Array.from(document.querySelectorAll('button')).find(
        b => (b.textContent || '').trim() === 'Material',
      ) as HTMLButtonElement | undefined
      materialBtn?.click()
    })

    // Verify the CSS variable remains 'none' after application
    await runner.waitForFunction(() => {
      const el = (window as any).ref?.current as HTMLDivElement | null
      if (!el) return false
      return el.style.getPropertyValue('--xr-background-material') === 'none'
    })

    // Inspect SpatialScene and assert the spatialized element's material is updated
    const spatializedElementId = await runner.evaluate(() => {
      const el = (window as any).ref?.current as HTMLDivElement | null
      if (!el) return null
      const spatializedElement = (window as any).getSpatialized2DElement?.(el)
      return spatializedElement ? spatializedElement.id : null
    })
    expect(spatializedElementId).to.be.not.null
    const spatialObj = runner
      .getCurrentScene()
      ?.findSpatialObject(spatializedElementId as string) as any
    expect(spatialObj).to.be.not.null
    expect(spatialObj.backgroundMaterial).to.equal('none')
  })

  describe('--xr-back tests', async () => {
    it('should set and get the value for --xr-back property (backOffset) of a spatial div when enable-xr is present in html', async () => {
      // Navigate to test app and wait until the target element ref is available
      if (!runner) throw new Error('Puppeteer runner not initialized')
      await runner.navigate('http://localhost:5173/domApiTest', {
        waitUntil: 'networkidle0',
        timeout: 30000,
      })
      await runner.waitForFunction(() => !!(window as any).ref?.current)

      // Set the --xr-back slider value to 100 using the native setter and dispatch input/change
      await runner.evaluate(() => {
        const xrBackBtn = Array.from(document.querySelectorAll('button')).find(
          b => (b.textContent || '').trim() === 'Xr Back',
        ) as HTMLButtonElement | undefined
        const container = xrBackBtn?.nextElementSibling as HTMLElement | null
        const slider = container?.querySelector(
          'input[type="range"]',
        ) as HTMLInputElement | null
        if (slider) {
          const desc = Object.getOwnPropertyDescriptor(
            HTMLInputElement.prototype,
            'value',
          )
          desc?.set?.call(slider, '100')
          slider.dispatchEvent(new Event('input', { bubbles: true }))
          slider.dispatchEvent(new Event('change', { bubbles: true }))
        }
      })

      // Click the "Xr Back" button to apply the current slider value to --xr-back
      await runner.evaluate(() => {
        const xrBackBtn = Array.from(document.querySelectorAll('button')).find(
          b => (b.textContent || '').trim() === 'Xr Back',
        ) as HTMLButtonElement | undefined
        xrBackBtn?.click()
      })

      // Verify the inline CSS variable --xr-back equals '100'
      await runner.waitForFunction(() => {
        const el = (window as any).ref?.current as HTMLDivElement | null
        if (!el) return false
        return el.style.getPropertyValue('--xr-back') === '100'
      })

      // Inspect SpatialScene and assert backOffset is 100
      const spatializedElementId = await runner.evaluate(() => {
        const el = (window as any).ref?.current as HTMLDivElement | null
        if (!el) return null
        const spatializedElement = (window as any).getSpatialized2DElement?.(el)
        return spatializedElement ? spatializedElement.id : null
      })
      expect(spatializedElementId).to.be.not.null
      const spatialObj = runner
        .getCurrentScene()
        ?.findSpatialObject(spatializedElementId as string) as any
      expect(spatialObj).to.be.not.null
      console.log('spatialObj.backOffset: ', spatialObj.backOffset)
      expect(spatialObj.backOffset).to.equal(100)
    })

    it('should successfully remove --xr-back property of a spatial div when enable-xr is present in html', async () => {
      // Navigate to the test page and ensure the spatialized element ref is ready
      if (!runner) throw new Error('Puppeteer runner not initialized')
      await runner.navigate('http://localhost:5173/domApiTest', {
        waitUntil: 'networkidle0',
        timeout: 30000,
      })
      await runner.waitForFunction(() => !!(window as any).ref?.current)

      // Pre-condition: set --xr-back to 100 via the slider and apply using "Xr Back" button
      await runner.evaluate(() => {
        const xrBackBtn = Array.from(document.querySelectorAll('button')).find(
          b => (b.textContent || '').trim() === 'Xr Back',
        ) as HTMLButtonElement | undefined
        const container = xrBackBtn?.nextElementSibling as HTMLElement | null
        const slider = container?.querySelector(
          'input[type="range"]',
        ) as HTMLInputElement | null
        if (slider) {
          const desc = Object.getOwnPropertyDescriptor(
            HTMLInputElement.prototype,
            'value',
          )
          desc?.set?.call(slider, '100')
          slider.dispatchEvent(new Event('input', { bubbles: true }))
          slider.dispatchEvent(new Event('change', { bubbles: true }))
        }
        xrBackBtn?.click()
      })

      // Verify inline CSS variable --xr-back equals '100'
      await runner.waitForFunction(() => {
        const el = (window as any).ref?.current as HTMLDivElement | null
        if (!el) return false
        return el.style.getPropertyValue('--xr-back') === '100'
      })

      // Click the "Remove" button to clear the inline --xr-back property
      await runner.evaluate(() => {
        const xrBackBtn = Array.from(document.querySelectorAll('button')).find(
          b => (b.textContent || '').trim() === 'Xr Back',
        ) as HTMLButtonElement | undefined
        const container = xrBackBtn?.nextElementSibling as HTMLElement | null
        const removeBtn = Array.from(
          container?.querySelectorAll('button') || [],
        ).find(b => (b.textContent || '').trim() === 'Remove') as
          | HTMLButtonElement
          | undefined
        removeBtn?.click()
      })

      // Verify the inline CSS variable is removed (empty string)
      await runner.waitForFunction(() => {
        const el = (window as any).ref?.current as HTMLDivElement | null
        if (!el) return false
        return el.style.getPropertyValue('--xr-back') === ''
      })

      // Inspect SpatialScene: backOffset should reset to 0 after removal
      const spatializedElementId = await runner.evaluate(() => {
        const el = (window as any).ref?.current as HTMLDivElement | null
        if (!el) return null
        const spatializedElement = (window as any).getSpatialized2DElement?.(el)
        return spatializedElement ? spatializedElement.id : null
      })
      expect(spatializedElementId).to.be.not.null
      const spatialObj = runner
        .getCurrentScene()
        ?.findSpatialObject(spatializedElementId as string) as any
      expect(spatialObj).to.be.not.null
      expect(spatialObj.backOffset).to.equal(0)
    })

    it('should successfully set --xr-back value after remove --xr-back property  (-120 && 900)', async () => {
      // Navigate to the test page and wait until spatial element ref is available
      if (!runner) throw new Error('Puppeteer runner not initialized')
      await runner.navigate('http://localhost:5173/domApiTest', {
        waitUntil: 'networkidle0',
        timeout: 30000,
      })
      await runner.waitForFunction(() => !!(window as any).ref?.current)

      // Remove inline --xr-back to start from a clean state
      await runner.evaluate(() => {
        const xrBackBtn = Array.from(document.querySelectorAll('button')).find(
          b => (b.textContent || '').trim() === 'Xr Back',
        ) as HTMLButtonElement | undefined
        const container = xrBackBtn?.nextElementSibling as HTMLElement | null
        const removeBtn = Array.from(
          container?.querySelectorAll('button') || [],
        ).find(b => (b.textContent || '').trim() === 'Remove') as
          | HTMLButtonElement
          | undefined
        removeBtn?.click()
      })

      // Verify the CSS variable is cleared
      await runner.waitForFunction(() => {
        const el = (window as any).ref?.current as HTMLDivElement | null
        if (!el) return false
        return el.style.getPropertyValue('--xr-back') === ''
      })

      // Set a negative value (-120) via the slider and apply using the "Xr Back" button
      await runner.evaluate(() => {
        const xrBackBtn = Array.from(document.querySelectorAll('button')).find(
          b => (b.textContent || '').trim() === 'Xr Back',
        ) as HTMLButtonElement | undefined
        const container = xrBackBtn?.nextElementSibling as HTMLElement | null
        const slider = container?.querySelector(
          'input[type="range"]',
        ) as HTMLInputElement | null
        if (slider) {
          const desc = Object.getOwnPropertyDescriptor(
            HTMLInputElement.prototype,
            'value',
          )
          desc?.set?.call(slider, '-120')
          slider.dispatchEvent(new Event('input', { bubbles: true }))
          slider.dispatchEvent(new Event('change', { bubbles: true }))
        }
        xrBackBtn?.click()
      })

      // Verify inline --xr-back equals '-120'
      await runner.waitForFunction(() => {
        const el = (window as any).ref?.current as HTMLDivElement | null
        if (!el) return false
        return el.style.getPropertyValue('--xr-back') === '-120'
      })

      // Assert SpatialScene backOffset reflects -120
      const spatializedElementId1 = await runner.evaluate(() => {
        const el = (window as any).ref?.current as HTMLDivElement | null
        if (!el) return null
        const spatializedElement = (window as any).getSpatialized2DElement?.(el)
        return spatializedElement ? spatializedElement.id : null
      })
      expect(spatializedElementId1).to.be.not.null
      const spatialObj1 = runner
        .getCurrentScene()
        ?.findSpatialObject(spatializedElementId1 as string) as any
      expect(spatialObj1).to.be.not.null
      expect(spatialObj1.backOffset).to.equal(-120)

      // Set a large value (900) via the slider and apply again
      await runner.evaluate(() => {
        const xrBackBtn = Array.from(document.querySelectorAll('button')).find(
          b => (b.textContent || '').trim() === 'Xr Back',
        ) as HTMLButtonElement | undefined
        const container = xrBackBtn?.nextElementSibling as HTMLElement | null
        const slider = container?.querySelector(
          'input[type="range"]',
        ) as HTMLInputElement | null
        if (slider) {
          const desc = Object.getOwnPropertyDescriptor(
            HTMLInputElement.prototype,
            'value',
          )
          desc?.set?.call(slider, '900')
          slider.dispatchEvent(new Event('input', { bubbles: true }))
          slider.dispatchEvent(new Event('change', { bubbles: true }))
        }
        xrBackBtn?.click()
      })

      // Verify inline --xr-back equals '900'
      await runner.waitForFunction(() => {
        const el = (window as any).ref?.current as HTMLDivElement | null
        if (!el) return false
        return el.style.getPropertyValue('--xr-back') === '900'
      })

      // Assert SpatialScene backOffset reflects 900
      const spatializedElementId2 = await runner.evaluate(() => {
        const el = (window as any).ref?.current as HTMLDivElement | null
        if (!el) return null
        const spatializedElement = (window as any).getSpatialized2DElement?.(el)
        return spatializedElement ? spatializedElement.id : null
      })
      expect(spatializedElementId2).to.be.not.null
      const spatialObj2 = runner
        .getCurrentScene()
        ?.findSpatialObject(spatializedElementId2 as string) as any
      expect(spatialObj2).to.be.not.null
      expect(spatialObj2.backOffset).to.equal(900)
    })
  })

  describe('transform tests', async () => {
    it('should set and get the transform value for a spatial div when enable-xr is present in html', async () => {
      if (!runner) throw new Error('Puppeteer runner not initialized')
      await runner.navigate('http://localhost:5173/domApiTest', {
        waitUntil: 'networkidle0',
        timeout: 30000,
      })
      await runner.waitForFunction(() => !!(window as any).ref?.current)

      // 调整 translateX 和 rotateZ 的滑块值
      await runner.evaluate(() => {
        const transformBtn = Array.from(
          document.querySelectorAll('button'),
        ).find(b => (b.textContent || '').trim() === 'Transform Test') as
          | HTMLButtonElement
          | undefined
        const container = transformBtn?.nextElementSibling as HTMLElement | null
        const sliders = container?.querySelectorAll('input[type="range"]') as
          | NodeListOf<HTMLInputElement>
          | undefined
        if (sliders && sliders.length >= 2) {
          const desc = Object.getOwnPropertyDescriptor(
            HTMLInputElement.prototype,
            'value',
          )
          // set translateX = 25
          desc?.set?.call(sliders[0], '25')
          sliders[0].dispatchEvent(new Event('input', { bubbles: true }))
          sliders[0].dispatchEvent(new Event('change', { bubbles: true }))
          // set rotateZ = 45
          desc?.set?.call(sliders[1], '45')
          sliders[1].dispatchEvent(new Event('input', { bubbles: true }))
          sliders[1].dispatchEvent(new Event('change', { bubbles: true }))
        }
      })

      // wait for value labels to show 25px and 45deg
      await runner.waitForFunction(() => {
        const transformBtn = Array.from(
          document.querySelectorAll('button'),
        ).find(b => (b.textContent || '').trim() === 'Transform Test') as
          | HTMLButtonElement
          | undefined
        const container = transformBtn?.nextElementSibling as HTMLElement | null
        const spans = container?.querySelectorAll('span') as
          | NodeListOf<HTMLSpanElement>
          | undefined
        if (!spans || spans.length < 2) return false
        const tx = (spans[0].textContent || '').trim()
        const rz = (spans[1].textContent || '').trim()
        return tx === '25px' && rz === '45deg'
      })

      // click the Transform Test button to apply
      await runner.evaluate(() => {
        const transformBtn = Array.from(
          document.querySelectorAll('button'),
        ).find(b => (b.textContent || '').trim() === 'Transform Test') as
          | HTMLButtonElement
          | undefined
        transformBtn?.click()
      })

      // wait until computed style transform is not 'none' (avoid brittle string checks)
      await runner.waitForFunction(() => {
        const el = (window as any).ref?.current as HTMLDivElement | null
        if (!el) return false
        const t = getComputedStyle(el).transform
        return !!t && t !== 'none'
      })

      // get spatialized2DElement id
      const spatializedElementId = await runner.evaluate(() => {
        const el = (window as any).ref?.current as HTMLDivElement | null
        if (!el) return null
        const spatializedElement = (window as any).getSpatialized2DElement?.(el)
        return spatializedElement ? spatializedElement.id : null
      })
      expect(spatializedElementId).to.be.not.null

      // compute expected DOMMatrix (length should be 16)
      const expectedMatrix = (await runner.evaluate(() => {
        const el = (window as any).ref?.current as HTMLDivElement | null
        if (!el) return null
        const inlineT = el.style.getPropertyValue('transform')
        const dm = new (window as any).DOMMatrix(
          inlineT && inlineT !== '' ? inlineT : undefined,
        )
        return Array.from(dm.toFloat64Array())
      })) as number[] | null
      expect(expectedMatrix).to.be.not.null
      expect(expectedMatrix as number[]).to.have.lengthOf(16)

      // read from SpatialScene and assert matrix reflects updates
      const spatialObj = runner
        .getCurrentScene()
        ?.findSpatialObject(spatializedElementId as string) as any
      expect(spatialObj).to.be.not.null
      const matrix = spatialObj.transform?.matrix as number[]
      expect(matrix).to.be.an('array').with.lengthOf(16)
      // translation X component should be 25 (DOMMatrix m41,m42,m43 are translation)
      expect(matrix[12]).to.be.closeTo(25, 1e-4)
      // abs diagonal cosine components for Z=45° should be ≈ sqrt(1/2)
      const cos45 = Math.SQRT1_2
      expect(Math.abs(matrix[0])).to.be.closeTo(cos45, 1e-3)
      expect(Math.abs(matrix[5])).to.be.closeTo(cos45, 1e-3)
    })

    it('should successfully remove transform property of a spatial div when enable-xr is present in html', async () => {
      if (!runner) throw new Error('Puppeteer runner not initialized')
      await runner.navigate('http://localhost:5173/domApiTest', {
        waitUntil: 'networkidle0',
        timeout: 30000,
      })
      await runner.waitForFunction(() => !!(window as any).ref?.current)

      // click Remove to clear transform
      await runner.evaluate(() => {
        const transformBtn = Array.from(
          document.querySelectorAll('button'),
        ).find(b => (b.textContent || '').trim() === 'Transform Test') as
          | HTMLButtonElement
          | undefined
        const container = transformBtn?.nextElementSibling as HTMLElement | null
        const removeBtn = Array.from(
          container?.querySelectorAll('button') || [],
        ).find(b => (b.textContent || '').trim() === 'Remove') as
          | HTMLButtonElement
          | undefined
        removeBtn?.click()
      })

      await runner.waitForFunction(() => {
        const el = (window as any).ref?.current as HTMLDivElement | null
        if (!el) return false
        const inlineT = el.style.getPropertyValue('transform')
        const computedT = getComputedStyle(el).transform
        return inlineT === '' && computedT === 'none'
      })

      // apply Transform Test again (sliders reset to 0 in removeTestTransform)
      await runner.evaluate(() => {
        const transformBtn = Array.from(
          document.querySelectorAll('button'),
        ).find(b => (b.textContent || '').trim() === 'Transform Test') as
          | HTMLButtonElement
          | undefined
        transformBtn?.click()
      })

      const spatializedElementId = await runner.evaluate(() => {
        const el = (window as any).ref?.current as HTMLDivElement | null
        if (!el) return null
        const spatializedElement = (window as any).getSpatialized2DElement?.(el)
        return spatializedElement ? spatializedElement.id : null
      })
      expect(spatializedElementId).to.be.not.null
      const identity = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
      let ok = false
      for (let attempt = 0; attempt < 20 && !ok; attempt++) {
        const so = runner
          .getCurrentScene()
          ?.findSpatialObject(spatializedElementId as string) as any
        expect(so).to.be.not.null
        const m = so.transform?.matrix as number[]
        if (Array.isArray(m) && m.length === 16) {
          ok = m.every((v, i) => Math.abs(v - identity[i]) < 1e-3)
        }
        if (!ok) {
          await new Promise(r => setTimeout(r, 50))
        }
      }
      expect(ok).to.equal(true)
    })
  })

  describe('transformOrigin Tests', async () => {
    it('should set and get correct value for transformOrigin (RotationAnchor) when enable-xr is present in HTML', async () => {
      if (!runner) throw new Error('Puppeteer runner not initialized')
      await runner.navigate('http://localhost:5173/domApiTest', {
        waitUntil: 'networkidle0',
        timeout: 30000,
      })
      await runner.waitForFunction(() => !!(window as any).ref?.current)

      // all transform-origin selections to validate
      const options = [
        'left top',
        'left center',
        'left bottom',
        'center top',
        'right center',
        'right bottom',
        '50% 50%',
        '0% 0%',
      ]

      for (const value of options) {
        // select the transform-origin value via dropdown and fire change
        await runner.evaluate(val => {
          const select = Array.from(document.querySelectorAll('select')).find(
            s =>
              (s.getAttribute('style') || '').includes('width: 250px') &&
              Array.from(s.querySelectorAll('option')).some(
                o => (o as HTMLOptionElement).value === 'left top',
              ),
          ) as HTMLSelectElement | undefined
          if (select) {
            select.value = val as string
            select.dispatchEvent(new Event('change', { bubbles: true }))
          }
        }, value)

        // wait until computed transform-origin is present
        await runner.waitForFunction(() => {
          const el = (window as any).ref?.current as HTMLDivElement | null
          if (!el) return false
          const v = getComputedStyle(el).getPropertyValue('transform-origin')
          return !!v && v.trim() !== ''
        })

        // compute expected normalized rotationAnchor from computed style
        const expected = await runner.evaluate(() => {
          const el = (window as any).ref?.current as HTMLDivElement | null
          if (!el) return null
          const cs = getComputedStyle(el)
          const origin = cs.getPropertyValue('transform-origin')
          const [ox, oy] = origin.split(' ').map(parseFloat)
          const w = parseFloat(cs.getPropertyValue('width'))
          const h = parseFloat(cs.getPropertyValue('height'))
          return { x: w > 0 ? ox / w : 0.5, y: h > 0 ? oy / h : 0.5, z: 0.5 }
        })

        // locate spatialized element and assert rotationAnchor matches expected
        const spatializedElementId = await runner.evaluate(() => {
          const el = (window as any).ref?.current as HTMLDivElement | null
          if (!el) return null
          const spatializedElement = (window as any).getSpatialized2DElement?.(
            el,
          )
          return spatializedElement ? spatializedElement.id : null
        })
        expect(spatializedElementId).to.be.not.null
        const spatialObj = runner
          .getCurrentScene()
          ?.findSpatialObject(spatializedElementId as string) as any
        expect(spatialObj).to.be.not.null
        expect(spatialObj.rotationAnchor.x).to.be.closeTo(
          (expected as any).x,
          1e-6,
        )
        expect(spatialObj.rotationAnchor.y).to.be.closeTo(
          (expected as any).y,
          1e-6,
        )
        expect(spatialObj.rotationAnchor.z).to.be.closeTo(
          (expected as any).z,
          1e-6,
        )
      }
    })

    it('should remove transformOrigin property of a spatialDiv when enable-xr is present in html.', async () => {
      if (!runner) throw new Error('Puppeteer runner not initialized')
      await runner.navigate('http://localhost:5173/domApiTest', {
        waitUntil: 'networkidle0',
        timeout: 30000,
      })
      await runner.waitForFunction(() => !!(window as any).ref?.current)

      // set a non-default transform-origin first (e.g., left top)
      await runner.evaluate(() => {
        const select = Array.from(document.querySelectorAll('select')).find(
          s =>
            (s.getAttribute('style') || '').includes('width: 250px') &&
            Array.from(s.querySelectorAll('option')).some(
              o => (o as HTMLOptionElement).value === 'left top',
            ),
        ) as HTMLSelectElement | undefined
        if (select) {
          const desc = Object.getOwnPropertyDescriptor(
            HTMLSelectElement.prototype,
            'value',
          )
          desc?.set?.call(select, 'left top')
          select.dispatchEvent(new Event('change', { bubbles: true }))
        }
      })

      await runner.waitForFunction(() => {
        const el = (window as any).ref?.current as HTMLDivElement | null
        if (!el) return false
        const v = getComputedStyle(el).getPropertyValue('transform-origin')
        return !!v && v.trim() !== ''
      })

      // click Remove to clear transform-origin
      await runner.evaluate(() => {
        const select = Array.from(document.querySelectorAll('select')).find(
          s =>
            (s.getAttribute('style') || '').includes('width: 250px') &&
            Array.from(s.querySelectorAll('option')).some(
              o => (o as HTMLOptionElement).value === 'left top',
            ),
        ) as HTMLSelectElement | undefined
        const container = select?.parentElement as HTMLElement | null
        const removeBtn = Array.from(
          container?.querySelectorAll('button') || [],
        ).find(b => (b.textContent || '').trim() === 'Remove') as
          | HTMLButtonElement
          | undefined
        removeBtn?.click()
      })

      // expected rotationAnchor after removal (use computed default)
      const expected = await runner.evaluate(() => {
        const el = (window as any).ref?.current as HTMLDivElement | null
        if (!el) return null
        const cs = getComputedStyle(el)
        const origin = cs.getPropertyValue('transform-origin')
        const [ox, oy] = origin.split(' ').map(parseFloat)
        const w = parseFloat(cs.getPropertyValue('width'))
        const h = parseFloat(cs.getPropertyValue('height'))
        return { x: w > 0 ? ox / w : 0.5, y: h > 0 ? oy / h : 0.5, z: 0.5 }
      })

      const spatializedElementId = await runner.evaluate(() => {
        const el = (window as any).ref?.current as HTMLDivElement | null
        if (!el) return null
        const spatializedElement = (window as any).getSpatialized2DElement?.(el)
        return spatializedElement ? spatializedElement.id : null
      })
      expect(spatializedElementId).to.be.not.null

      // poll until rotationAnchor matches expected (updates are async)
      let ok = false
      for (let attempt = 0; attempt < 20 && !ok; attempt++) {
        const spatialObj = runner
          .getCurrentScene()
          ?.findSpatialObject(spatializedElementId as string) as any
        expect(spatialObj).to.be.not.null
        const ra = spatialObj.rotationAnchor
        if (
          Math.abs(ra.x - (expected as any).x) < 1e-3 &&
          Math.abs(ra.y - (expected as any).y) < 1e-3 &&
          Math.abs(ra.z - (expected as any).z) < 1e-3
        ) {
          ok = true
        } else {
          await new Promise(r => setTimeout(r, 50))
        }
      }
      expect(ok).to.equal(true)
    })
  })
})
