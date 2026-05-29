import { createServer } from 'vite'
import express from 'express'
import { MOCHA_RESULT_API } from '../src/api'
import { Server } from 'http'

export async function runViteServer(
  option: { port?: number; mochaResultCb?: any } = {},
): Promise<Server> {
  const app = express()

  const vite = await createServer({
    configFile: './vite.config.ts',
    server: { middlewareMode: true },
    appType: 'mpa',
  })

  const port = option.port || vite.config.server.port

  app.use(express.json())

  app.post(MOCHA_RESULT_API, (req, res) => {
    const data = req.body
    res.status(200).json({ message: 'Data received successfully', data })
    option.mochaResultCb && option.mochaResultCb(data)
  })

  app.use(vite.middlewares)

  return new Promise((resolve, reject) => {
    const server = app.listen(port, err => {
      if (err) {
        reject(err)
      } else {
        server.on('close', () => {
          console.log('Express server has been closed.')
          vite.close()
        })

        resolve(server)

        const url = `http://localhost:${port}`
        console.log(`Vite server running at ${url}`)
      }
    })
  })
}
