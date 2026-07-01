import { expect } from 'chai'
import { spawn, ChildProcess } from 'child_process'
import * as path from 'path'
import { after, afterEach, before } from 'mocha'
import { PuppeteerRunner } from '../src/runtime/puppeteerRunner'
import 'source-map-support/register'

const TEST_SERVER_PORT = 5183
const TEST_SERVER_URL = `http://127.0.0.1:${TEST_SERVER_PORT}/#/scene/ornament-test`

let server: ChildProcess | null = null
let runner: PuppeteerRunner | null = null

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

async function waitForServer(url: string, timeout = 30000) {
  const start = Date.now()
  let lastError: unknown

  while (Date.now() - start < timeout) {
    try {
      const response = await fetch(url)
      if (response.ok) return
    } catch (error) {
      lastError = error
    }
    await delay(500)
  }

  throw new Error(`Timed out waiting for test server: ${String(lastError)}`)
}

async function waitForNodeCondition(
  predicate: () => boolean,
  message: string,
  timeout = 10000,
) {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    if (predicate()) return
    await delay(100)
  }
  throw new Error(message)
}

async function createRunner(enableXR: boolean) {
  runner = new PuppeteerRunner()
  runner.init({
    width: 1280,
    height: 800,
    headless: true,
    timeout: 30000,
    enableXR,
  })
  await runner.start()
  return runner
}

async function setControlValue(
  activeRunner: PuppeteerRunner,
  testId: string,
  value: string,
) {
  await activeRunner.evaluate(
    ({ selector, nextValue }) => {
      const control = document.querySelector(selector) as
        | HTMLInputElement
        | HTMLSelectElement
        | null
      if (!control) throw new Error(`Missing control: ${selector}`)
      const valueSetter = Object.getOwnPropertyDescriptor(
        Object.getPrototypeOf(control),
        'value',
      )?.set
      valueSetter?.call(control, nextValue)
      control.dispatchEvent(new Event('input', { bubbles: true }))
      control.dispatchEvent(new Event('change', { bubbles: true }))
    },
    {
      selector: `[data-testid="${testId}"]`,
      nextValue: value,
    },
  )
}

async function getPortalSnapshot(activeRunner: PuppeteerRunner) {
  return activeRunner.evaluate(() => {
    const frames = Array.from(
      document.querySelectorAll('iframe[id^="spatial-iframe-"]'),
    ) as HTMLIFrameElement[]
    const frame = frames[0]
    const doc = frame?.contentDocument
    const domCard = doc?.querySelector(
      '[data-testid="ornament-content-dom"]',
    ) as HTMLElement | null
    const enableXrContent = doc?.querySelector(
      '[data-testid="ornament-content-enable-xr"]',
    ) as HTMLElement | null
    const modelFallback = doc?.querySelector(
      '[data-testid="ornament-model-fallback"]',
    ) as HTMLElement | null
    const realityChild = doc?.querySelector(
      '[data-testid="ornament-reality-child"]',
    )

    return {
      frameCount: frames.length,
      text: doc?.body.textContent ?? '',
      hasDomContent: Boolean(domCard),
      hasEnableXrContent: Boolean(enableXrContent),
      hasModelFallback: Boolean(modelFallback),
      modelFallbackTag: modelFallback?.tagName.toLowerCase() ?? null,
      hasRealityChild: Boolean(realityChild),
      accentVariable:
        doc?.defaultView
          ?.getComputedStyle(doc.documentElement)
          .getPropertyValue('--ornament-demo-accent')
          .trim() ?? '',
      domBackground:
        domCard && doc?.defaultView
          ? doc.defaultView.getComputedStyle(domCard).backgroundImage
          : '',
    }
  })
}

describe('Ornament runtime contract via test-server demo', function () {
  this.timeout(120000)

  before(async () => {
    const repoRoot = path.resolve(process.cwd(), '../..')
    const testServerDir = path.join(repoRoot, 'apps/test-server')
    const pnpmCmd = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'

    server = spawn(pnpmCmd, ['--dir', testServerDir, 'run', 'dev'], {
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: true,
      env: {
        ...process.env,
        PORT: String(TEST_SERVER_PORT),
        LIVERELOAD_PORT: '35731',
      },
    })

    server.stdout?.on('data', (data: Buffer) => {
      console.log(`Test server stdout: ${data}`)
    })
    server.stderr?.on('data', (data: Buffer) => {
      console.error(`Test server stderr: ${data}`)
    })
    server.on('error', (error: Error) => {
      console.error(`Test server error: ${error.message}`)
    })

    await waitForServer(`http://127.0.0.1:${TEST_SERVER_PORT}`)
  })

  afterEach(async () => {
    if (runner) {
      await runner.close()
      runner = null
    }
  })

  after(async () => {
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
      server = null
    }
  })

  it('creates, updates, hides, and destroys an Ornament from the public demo controls', async () => {
    const activeRunner = await createRunner(true)
    await activeRunner.navigate(TEST_SERVER_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    })
    await activeRunner.waitForSelector('[data-testid="ornament-list"]')

    await waitForNodeCondition(
      () => activeRunner.getCurrentScene()?.activeOrnaments.length === 1,
      'Ornament was not added to the fake runtime scene',
    )

    let ornaments = activeRunner.getCurrentScene()?.activeOrnaments ?? []
    expect(ornaments).to.have.length(1)
    expect(ornaments[0].options).to.deep.include({
      attachmentAnchor: 'bottom',
      contentAlignment: 'back',
      visibility: 'visible',
      width: 240,
      height: 140,
      backgroundMaterial: 'none',
    })
    expect(ornaments[0].options.cornerRadius).to.deep.equal({
      topLeading: 16,
      bottomLeading: 16,
      topTrailing: 16,
      bottomTrailing: 16,
    })

    await activeRunner.waitForFunction(() => {
      const frame = document.querySelector(
        'iframe[id^="spatial-iframe-"]',
      ) as HTMLIFrameElement | null
      return Boolean(
        frame?.contentDocument?.querySelector(
          '[data-testid="ornament-content-dom"]',
        ),
      )
    })

    let portal = await getPortalSnapshot(activeRunner)
    expect(portal.frameCount).to.equal(1)
    expect(portal.hasDomContent).to.equal(true)
    expect(portal.accentVariable).to.equal('#38bdf8')
    expect(portal.domBackground).to.contain('gradient')

    await setControlValue(
      activeRunner,
      'ornament-item-0-attachment-anchor',
      'leading',
    )
    await setControlValue(
      activeRunner,
      'ornament-item-0-content-alignment',
      'top',
    )
    await setControlValue(activeRunner, 'ornament-item-0-visibility', 'hidden')
    await setControlValue(activeRunner, 'ornament-item-0-width', '320')
    await setControlValue(activeRunner, 'ornament-item-0-height', '180')
    await setControlValue(activeRunner, 'ornament-item-0-corner-radius', '28')
    await setControlValue(
      activeRunner,
      'ornament-item-0-background-material',
      'thin',
    )

    await waitForNodeCondition(() => {
      const ornament = activeRunner.getCurrentScene()?.activeOrnaments[0]
      return (
        ornament?.options.attachmentAnchor === 'leading' &&
        ornament.options.contentAlignment === 'top' &&
        ornament.options.visibility === 'hidden' &&
        ornament.options.width === 320 &&
        ornament.options.height === 180 &&
        ornament.options.cornerRadius.topLeading === 28 &&
        ornament.options.cornerRadius.bottomTrailing === 28 &&
        ornament.options.backgroundMaterial === 'thin'
      )
    }, 'Ornament options were not updated in the fake runtime scene')

    const firstItemState = await activeRunner.evaluate(() => ({
      attachment: (
        document.querySelector(
          '[data-testid="ornament-item-0-attachment-anchor"]',
        ) as HTMLSelectElement | null
      )?.value,
      alignment: (
        document.querySelector(
          '[data-testid="ornament-item-0-content-alignment"]',
        ) as HTMLSelectElement | null
      )?.value,
      visibility: (
        document.querySelector(
          '[data-testid="ornament-item-0-visibility"]',
        ) as HTMLSelectElement | null
      )?.value,
      width: (
        document.querySelector(
          '[data-testid="ornament-item-0-width"]',
        ) as HTMLInputElement | null
      )?.value,
      height: (
        document.querySelector(
          '[data-testid="ornament-item-0-height"]',
        ) as HTMLInputElement | null
      )?.value,
      cornerRadius: (
        document.querySelector(
          '[data-testid="ornament-item-0-corner-radius"]',
        ) as HTMLInputElement | null
      )?.value,
      backgroundMaterial: (
        document.querySelector(
          '[data-testid="ornament-item-0-background-material"]',
        ) as HTMLSelectElement | null
      )?.value,
    }))
    expect(firstItemState).to.deep.equal({
      attachment: 'leading',
      alignment: 'top',
      visibility: 'hidden',
      width: '320',
      height: '180',
      cornerRadius: '28',
      backgroundMaterial: 'thin',
    })

    await activeRunner.click('[data-testid="ornament-add"]')
    await waitForNodeCondition(
      () => activeRunner.getCurrentScene()?.activeOrnaments.length === 2,
      'Second Ornament was not added after clicking Add',
    )
    expect(
      await activeRunner.evaluate(
        () =>
          document.querySelector('[data-testid="ornament-count"]')?.textContent,
      ),
    ).to.equal('2')
    portal = await getPortalSnapshot(activeRunner)
    expect(portal.frameCount).to.equal(2)

    await activeRunner.click('[data-testid="ornament-remove"]')
    await waitForNodeCondition(
      () => activeRunner.getCurrentScene()?.activeOrnaments.length === 1,
      'Remove did not destroy the last Ornament item',
    )
    portal = await getPortalSnapshot(activeRunner)
    expect(portal.frameCount).to.equal(1)

    await activeRunner.click('[data-testid="ornament-remove"]')
    await waitForNodeCondition(
      () => activeRunner.getCurrentScene()?.activeOrnaments.length === 0,
      'Remove did not destroy the final Ornament item',
    )
    portal = await getPortalSnapshot(activeRunner)
    expect(portal.frameCount).to.equal(0)
  })

  it('exercises demo content modes and verifies documented degradation behavior', async () => {
    const activeRunner = await createRunner(true)
    await activeRunner.navigate(TEST_SERVER_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    })
    await activeRunner.waitForSelector('[data-testid="ornament-list"]')

    await setControlValue(
      activeRunner,
      'ornament-item-0-content-mode',
      'enable-xr',
    )
    await activeRunner.waitForFunction(() => {
      const frame = document.querySelector(
        'iframe[id^="spatial-iframe-"]',
      ) as HTMLIFrameElement | null
      return Boolean(
        frame?.contentDocument?.querySelector(
          '[data-testid="ornament-content-enable-xr"]',
        ),
      )
    })
    let portal = await getPortalSnapshot(activeRunner)
    expect(portal.hasEnableXrContent).to.equal(true)
    expect(activeRunner.getCurrentScene()?.activeOrnaments).to.have.length(1)
    expect(
      Object.values(activeRunner.getCurrentScene()?.children ?? {}),
    ).to.have.length(0)

    await setControlValue(activeRunner, 'ornament-item-0-content-mode', 'model')
    await activeRunner.waitForFunction(() => {
      const frame = document.querySelector(
        'iframe[id^="spatial-iframe-"]',
      ) as HTMLIFrameElement | null
      return Boolean(
        frame?.contentDocument?.querySelector(
          '[data-testid="ornament-model-fallback"]',
        ),
      )
    })
    portal = await getPortalSnapshot(activeRunner)
    expect(portal.hasModelFallback).to.equal(true)
    expect(portal.modelFallbackTag).to.equal('model')

    await setControlValue(
      activeRunner,
      'ornament-item-0-content-mode',
      'reality',
    )
    await activeRunner.waitForFunction(() => {
      const frame = document.querySelector(
        'iframe[id^="spatial-iframe-"]',
      ) as HTMLIFrameElement | null
      return Boolean(
        frame?.contentDocument?.querySelector(
          '[data-testid="ornament-content-reality"]',
        ),
      )
    })
    portal = await getPortalSnapshot(activeRunner)
    expect(portal.text).to.contain('Reality content wrapper')
    expect(portal.hasRealityChild).to.equal(false)
  })

  it('renders null in unsupported runtimes without creating an Ornament container', async () => {
    const activeRunner = await createRunner(false)
    await activeRunner.navigate(TEST_SERVER_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    })
    await activeRunner.waitForSelector('[data-testid="ornament-list"]')

    const unsupportedState = await activeRunner.evaluate(() => ({
      count: document.querySelector('[data-testid="ornament-count"]')
        ?.textContent,
      frameCount: document.querySelectorAll('iframe[id^="spatial-iframe-"]')
        .length,
      leakedContent: Boolean(
        document.querySelector('[data-testid="ornament-content-dom"]'),
      ),
    }))

    expect(unsupportedState).to.deep.equal({
      count: '1',
      frameCount: 0,
      leakedContent: false,
    })
  })
})
