import { runViteServer } from '../scripts/vite-server'
import { runWebSpatialBuilder } from './websptial-builder-utils'
import { AddressInfo } from 'node:net'
import { AsyncPromise } from '../utils/AsyncPromise'
import { assert } from 'chai'
import { postResultToLark } from '../src/api.ts'
const fail = assert.fail

describe('E2E Test For Webspatial SDK', function () {
  this.timeout(1000 * 60 * 5) // 5 minutes

  it('should pass', async () => {
    const promise = new AsyncPromise<TestResults>()

    try {
      const server = await runViteServer({
        mochaResultCb: (data: any) => {
          promise.resolve(data)
        },
      })

      const address = server.address() as AddressInfo
      const entryURL = `http://localhost:${address.port}/`
      try {
        await runWebSpatialBuilder(entryURL)
      } catch (error) {
        console.error(error)
        fail()
      }

      // wait for mocha result finished
      const result = await promise.waitFinish()

      if (process.env.pingLark) {
        postResultToLark(result)
      }
      const hasError = result.failures.length > 0
      if (hasError) {
        console.error('Failures', result.failures)
        fail()
      } else {
        // close server
        server.close()
      }
    } catch (error) {
      console.log('error', error)
      fail(error as string)
    }
  })
})
