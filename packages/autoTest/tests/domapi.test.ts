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
        const valueSpan = container?.querySelector('span') as HTMLSpanElement | null
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
        const borderBtn = Array.from(targetSection!.querySelectorAll('button')).find(
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

      const spatialObj = runner.getCurrentScene()?.findSpatialObject(spatializedElementId as string) as any
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

      // 
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
        const valueSpan = container?.querySelector('span') as HTMLSpanElement | null
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
        const borderBtn = Array.from(targetSection!.querySelectorAll('button')).find(
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
        const sections = Array.from(document.querySelectorAll('.grid.grid-cols-2'))
        const targetSection = sections.find(sec =>
          Array.from(sec.querySelectorAll('button')).some(
            b => (b.textContent || '').trim() === 'Border Radius',
          ),
        )
        const borderBtn = Array.from(targetSection!.querySelectorAll('button')).find(
          b => (b.textContent || '').trim() === 'Border Radius',
        ) as HTMLButtonElement
        const container = borderBtn.nextElementSibling as HTMLElement
        const slider = container.querySelector('input[type="range"]') as HTMLInputElement
        const desc = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')
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
        const sections = Array.from(document.querySelectorAll('.grid.grid-cols-2'))
        const targetSection = sections.find(sec =>
          Array.from(sec.querySelectorAll('button')).some(
            b => (b.textContent || '').trim() === 'Border Radius',
          ),
        )
        const borderBtn = Array.from(targetSection!.querySelectorAll('button')).find(
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
        const sections = Array.from(document.querySelectorAll('.grid.grid-cols-2'))
        const targetSection = sections.find(sec =>
          Array.from(sec.querySelectorAll('button')).some(
            b => (b.textContent || '').trim() === 'Border Radius',
          ),
        )
        const borderBtn = Array.from(targetSection!.querySelectorAll('button')).find(
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
        const sections = Array.from(document.querySelectorAll('.grid.grid-cols-2'))
        const targetSection = sections.find(sec =>
          Array.from(sec.querySelectorAll('button')).some(
            b => (b.textContent || '').trim() === 'Border Radius',
          ),
        )
        const borderBtn = Array.from(targetSection!.querySelectorAll('button')).find(
          b => (b.textContent || '').trim() === 'Border Radius',
        ) as HTMLButtonElement
        const container = borderBtn.nextElementSibling as HTMLElement
        const slider = container.querySelector('input[type="range"]') as HTMLInputElement
        const desc = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')
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
        const materialBtn = Array.from(document.querySelectorAll('button')).find(
          b => (b.textContent || '').trim() === 'Material',
        ) as HTMLButtonElement | undefined
        const container = materialBtn?.nextElementSibling as HTMLElement | null
        const select = container?.querySelector('select') as HTMLSelectElement | null
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
        const materialBtn = Array.from(document.querySelectorAll('button')).find(
          b => (b.textContent || '').trim() === 'Material',
        ) as HTMLButtonElement | undefined
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

    it('should set and get the regular value for xr-background-material property of a spatial div when enable-xr is present in html', async () => {
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
        const materialBtn = Array.from(document.querySelectorAll('button')).find(
          b => (b.textContent || '').trim() === 'Material',
        ) as HTMLButtonElement | undefined
        const container = materialBtn?.nextElementSibling as HTMLElement | null
        const select = container?.querySelector('select') as HTMLSelectElement | null
        if (select) {
          select.value = 'regular'
          select.dispatchEvent(new Event('change', { bubbles: true }))
        }
      })

      // Wait until inline CSS variable reflects the chosen material
      await runner.waitForFunction(() => {
        const el = (window as any).ref?.current as HTMLDivElement | null
        if (!el) return false
        return el.style.getPropertyValue('--xr-background-material') === 'regular'
      })

      // Click the "Material" button to apply the selection
      await runner.evaluate(() => {
        const materialBtn = Array.from(document.querySelectorAll('button')).find(
          b => (b.textContent || '').trim() === 'Material',
        ) as HTMLButtonElement | undefined
        materialBtn?.click()
      })

      // Verify the CSS variable remains 'regular' after application
      await runner.waitForFunction(() => {
        const el = (window as any).ref?.current as HTMLDivElement | null
        if (!el) return false
        return el.style.getPropertyValue('--xr-background-material') === 'regular'
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

    it('should set and get the translucent value for xr-background-material property of a spatial div when enable-xr is present in html', async () => {
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
        const materialBtn = Array.from(document.querySelectorAll('button')).find(
          b => (b.textContent || '').trim() === 'Material',
        ) as HTMLButtonElement | undefined
        const container = materialBtn?.nextElementSibling as HTMLElement | null
        const select = container?.querySelector('select') as HTMLSelectElement | null
        if (select) {
          select.value = 'translucent'
          select.dispatchEvent(new Event('change', { bubbles: true }))
        }
      })

      // Wait until inline CSS variable reflects the chosen material
      await runner.waitForFunction(() => {
        const el = (window as any).ref?.current as HTMLDivElement | null
        if (!el) return false
        return el.style.getPropertyValue('--xr-background-material') === 'translucent'
      })

      // Click the "Material" button to apply the selection
      await runner.evaluate(() => {
        const materialBtn = Array.from(document.querySelectorAll('button')).find(
          b => (b.textContent || '').trim() === 'Material',
        ) as HTMLButtonElement | undefined
        materialBtn?.click()
      })

      // Verify the CSS variable remains 'translucent' after application
      await runner.waitForFunction(() => {
        const el = (window as any).ref?.current as HTMLDivElement | null
        if (!el) return false
        return el.style.getPropertyValue('--xr-background-material') === 'translucent'
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

  it('should set and get the thick value for xr-background-material property of a spatial div when enable-xr is present in html', async () => {
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
        const select = container?.querySelector('select') as HTMLSelectElement | null
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
        const select = container?.querySelector('select') as HTMLSelectElement | null
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

    describe('--xr-background-material tests', async ()=> {
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
          const slider = container?.querySelector('input[type="range"]') as HTMLInputElement | null
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
          const slider = container?.querySelector('input[type="range"]') as HTMLInputElement | null
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
          const removeBtn = Array.from(container?.querySelectorAll('button') || []).find(
            b => (b.textContent || '').trim() === 'Remove',
          ) as HTMLButtonElement | undefined
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
    })



})
