import { reactRouter } from '@react-router/dev/vite'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, type Plugin } from 'vite'

/**
 * Chrome DevTools probes `/.well-known/appspecific/com.chrome.devtools.json`.
 * Without a matching route React Router SSR throws ("No route matches URL").
 */
function ignoreChromeWellKnown(): Plugin {
  return {
    name: 'spatial-remix-ignore-chrome-well-known',
    enforce: 'pre',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url ?? ''
        if (url.startsWith('/.well-known/')) {
          res.statusCode = 404
          res.end()
          return
        }
        next()
      })
    },
  }
}

export default defineConfig({
  plugins: [ignoreChromeWellKnown(), tailwindcss(), reactRouter()],
})
