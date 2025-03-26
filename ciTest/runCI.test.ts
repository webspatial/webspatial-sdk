import express from 'express'
import cors from 'cors'
import { exec } from 'child_process'

// Make timeout 10 min
jest.setTimeout(1000 * 60 * 10)

// Disable jest's special console output
global.console = require('console')

// Express server setup
const app = express()
app.use(cors())
app.use(express.json())
const testSitePort = 5179
const port = testSitePort + 1

test('App builds and loads url', async () => {
  // Setup deffered promise for test results
  var deffered = {} as { res: Function; rej: Function }
  var testStatus = new Promise((res, rej) => {
    deffered = { res, rej }
  })
  // Start the server that is used to get events from the webspatial app
  app.post('/', (req, res) => {
    console.log('\n\n\nReceived result:' + JSON.stringify(req.body))
    res.send({})
    deffered.res({ status: 'success' })
  })
  var server = app.listen(port, () => {
    console.log(`Test server waiting for result http://localhost:${port}`)
  })

  // Setup vite server to serve our webspatial app
  const { createServer } = await import('vite')
  var viteServer = await createServer({
    root: './',
    server: {
      port: testSitePort,
      watch: {
        ignored: ['**/**'],
      },
    },
    logLevel: 'silent',
  })
  await viteServer.listen() // Start the Vite server

  // Run webspatial page in the simulator
  console.log('Running builder')
  var process = exec(
    'npx @webspatial/builder run --base=http://localhost:' +
      testSitePort +
      '/testPages',
    (error: any, stdout: any, stderr: any) => {
      var logBuilder = true
      if (logBuilder) {
        if (stdout) {
          console.log('stdout: ' + stdout)
        }
        if (stderr) {
          console.log('stderr: ' + stderr)
        }
        if (error) {
          console.log('error: ' + error)
        }
      }

      expect(error).toBeNull()
      console.log('Builder finished')
    },
  )

  var result = (await testStatus) as any
  console.log('Test done, status: ' + result.status)
  expect(result.status).toBe('success')

  // Cleanup
  server.close()
  process.kill()
  await viteServer.close()

  console.log('Cleanup complete')
})
