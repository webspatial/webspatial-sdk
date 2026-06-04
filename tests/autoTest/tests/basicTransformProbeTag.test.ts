import { expect } from 'chai'
import { PuppeteerRunner } from '../src/runtime/puppeteerRunner'
import { spawn, ChildProcess } from 'child_process'
import { before, after } from 'mocha'
import 'source-map-support/register'

const ROUTE = 'http://localhost:5173/basicTransformProbeTagTest'
const TEST_ID = 'basic-transform-spatial-h1'
const ROTATE_Z_DEG = 30
const COS30 = Math.cos((ROTATE_Z_DEG * Math.PI) / 180)

let runner: PuppeteerRunner | null = null
let server: ChildProcess | null = null

describe('SpatialDiv probe mirrors host intrinsic tag (h1 CSS transform)', function (this: Mocha.Suite) {
  this.timeout(150000)

  before(async () => {
    const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm'
    server = spawn(npmCmd, ['run', 'devAVP'], {
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: true,
    })

    server.stdout?.on('data', (data: Buffer) => {
      console.log(`Server stdout: ${data}`)
    })
    server.stderr?.on('data', (data: Buffer) => {
      console.error(`Server stderr: ${data}`)
    })

    await new Promise(resolve => setTimeout(resolve, 5000))

    runner = new PuppeteerRunner()
    runner.init({
      width: 1280,
      height: 800,
      headless: true,
      timeout: 30000,
      enableXR: true,
    })
    await runner.start()
  })

  after(async () => {
    if (runner?.close) {
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

  it('applies h1.basicTransformProbe stylesheet transform to the spatial slab', async () => {
    if (!runner) throw new Error('Puppeteer runner not initialized')

    await runner.navigate(ROUTE, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    })

    await runner.waitForFunction(
      () => !!document.querySelector(`[data-testid="${TEST_ID}"]`),
    )

    await runner.waitForFunction(() => {
      const el = document.querySelector(
        `[data-testid="${TEST_ID}"]`,
      ) as HTMLElement | null
      const fn = (window as any).getSpatialized2DElement
      return !!el && typeof fn === 'function' && !!fn(el)
    })

    const probeInfo = await runner.evaluate((testId: string) => {
      const host = document.querySelector(
        `[data-testid="${testId}"]`,
      ) as HTMLElement | null
      const parser = document.querySelector(
        '[data-id="css-parser-div-container"]',
      )
      const probe = parser?.querySelector('h1') as HTMLElement | null
      const hostTag = host?.tagName ?? null
      const probeTag = probe?.tagName ?? null
      const probeTransform = probe ? getComputedStyle(probe).transform : null
      const hostSpatialId = host?.getAttribute('data-spatial-id')
      const probeSpatialId = probe?.getAttribute('data-spatial-id')
      return {
        hostTag,
        probeTag,
        probeTransform,
        hostSpatialId,
        probeSpatialId,
        probeClass: probe?.className ?? null,
      }
    }, TEST_ID)

    expect(probeInfo.hostTag).to.equal('H1')
    expect(probeInfo.probeTag).to.equal('H1')
    expect(probeInfo.probeTransform).to.be.a('string').and.not.equal('none')
    expect(probeInfo.probeClass).to.contain('basicTransformProbe')
    expect(probeInfo.hostSpatialId).to.be.a('string').and.not.empty
    expect(probeInfo.probeSpatialId).to.equal(probeInfo.hostSpatialId)

    const spatialId = await runner.evaluate((testId: string) => {
      const el = document.querySelector(
        `[data-testid="${testId}"]`,
      ) as HTMLElement | null
      if (!el) return null
      const spatializedElement = (window as any).getSpatialized2DElement?.(el)
      return spatializedElement ? spatializedElement.id : null
    }, TEST_ID)
    expect(spatialId).to.be.not.null

    let matrix: number[] | null = null
    for (let i = 0; i < 50; i++) {
      const spatialObj = runner
        .getCurrentScene()
        ?.findSpatialObject(spatialId as string) as {
        transform?: { matrix?: number[] }
      } | null
      matrix = (spatialObj?.transform?.matrix as number[]) ?? null
      const ok =
        Array.isArray(matrix) &&
        matrix.length === 16 &&
        Math.abs(Math.abs(matrix[0]) - COS30) < 0.05 &&
        Math.abs(Math.abs(matrix[5]) - COS30) < 0.05
      if (ok) break
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    expect(matrix).to.be.an('array').with.lengthOf(16)
    expect(Math.abs((matrix as number[])[0])).to.be.closeTo(COS30, 0.05)
    expect(Math.abs((matrix as number[])[5])).to.be.closeTo(COS30, 0.05)
  })
})
