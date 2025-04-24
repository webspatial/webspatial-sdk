import { runViteServer } from '../scripts/vite-server'
import {
  runWebSpatialBuilder,
  closeXCodeSimulater,
} from './websptial-builder-utils'
import { AddressInfo } from 'node:net'
import { AsyncPromise } from '../utils/AsyncPromise'
import { assert } from 'chai'
const fail = assert.fail

describe('E2E Test For Webspatial SDK', function () {
  this.beforeAll(async () => {
    this.timeout(1000 * 60 * 5) // 5 minutes
  })

  this.afterAll(async () => {
    this.timeout(1000 * 60 * 1) // 1 minutes
  })

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

      const hasError = result.failures.length > 0

      if (hasError) {
        fail()
      } else {
        // close server
        server.close()

        // close simulater
        await closeXCodeSimulater()
      }
    } catch (error) {
      fail(error as string)
    }
  })
})
