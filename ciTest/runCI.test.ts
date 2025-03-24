import express from 'express'
import { exec } from 'child_process'

// Make timeout 10 min
jest.setTimeout(1000 * 60 * 10)

// Disable jest's special console output
global.console = require('console')

// Express server setup
const app = express()
const port = 5174 // You can change the port number if needed

test('App builds and loads url', async () => {
  // Setup deffered promise for test results
  var deffered = {} as { res: Function; rej: Function }
  var testStatus = new Promise((res, rej) => {
    deffered = { res, rej }
  })

  // Start the server
  app.get('/', (req, res) => {
    res.send('Hello World!')
    deffered.res({ status: 'success' })
  })
  var server = app.listen(port, () => {
    console.log(`Test server waiting for result http://localhost:${port}`)
  })

  console.log('Running builder')
  var process = exec(
    'npx @webspatial/builder run --base=http://localhost:5174/',
    (error: any, stdout: any, stderr: any) => {
      console.log('Builder finished')
      var logBuilder = false
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
    },
  )

  var result = (await testStatus) as any
  console.log('Test done, status: ' + result.status)
  expect(result.status).toBe('success')

  // Cleanup
  server.close()
  process.kill()
  console.log('Cleanup complete')
})
