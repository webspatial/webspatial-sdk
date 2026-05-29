import { join, normalize, relative, resolve } from 'path'

function configStartUrl(
  manifestStartUrl: string,
  base: string,
  manifestUrl: string,
  isNet: boolean,
) {
  let start_url = manifestStartUrl ?? '/index.html'

  if (!start_url.match(/\.html(\?|$)/)) {
    const [path, query] = start_url.split('?')
    start_url = path.endsWith('/') ? `${path}index.html` : `${path}/index.html`
    if (query) start_url += `?${query}`
  }

  const isStartUrl = validateURL(start_url)
  const hasBase = base.length > 0
  if (hasBase) {
    const isBaseUrl = validateURL(base)
    if (!isStartUrl && !isBaseUrl) {
      const staticWebRoot = resolve('./static-web')
      let resolvedPath = join(base, start_url)
      const normalizedPath = normalize(resolvedPath)
      const safePath = join(staticWebRoot, normalizedPath)
      start_url = relative(process.cwd(), safePath)
        .replace(/^(\.\.\/)+/, './')
        .replace(/\/$/, '')
    } else if (isStartUrl && !isBaseUrl) {
      const startUrl = new URL(start_url)
      const fullPath =
        join(base, startUrl.pathname) + startUrl.search + startUrl.hash
      let newBase = new URL('/', startUrl.origin)
      start_url = new URL(fullPath, newBase).href
    } else if (!isStartUrl && isBaseUrl) {
      if (start_url.startsWith('/')) {
        const baseUrl = new URL(base)
        start_url = baseUrl.origin + join(baseUrl.pathname, start_url)
      } else {
        start_url = new URL(start_url, base).href
      }
    } else if (isStartUrl && isBaseUrl) {
      const startUrl = new URL(start_url)
      const baseUrl = new URL(base)
      const startFullPath = startUrl.pathname + startUrl.search + startUrl.hash
      start_url = new URL(startFullPath, baseUrl.origin + baseUrl.pathname).href
    }
  } else {
    if (isNet) {
      const murl = new URL(manifestUrl)
      if (!isStartUrl) {
        const newStartUrl = new URL(start_url, murl.origin)
        start_url = newStartUrl.href
      } else {
        const startUrl = new URL(start_url)
        start_url =
          murl.origin + startUrl.pathname + startUrl.search + startUrl.hash
      }
    } else if (!isStartUrl) {
      const staticWebRoot = resolve('./static-web')
      const resolvedPath = resolve(staticWebRoot, start_url)
      const normalizedPath = normalize(resolvedPath)
      const safePath = join(staticWebRoot, normalizedPath)
      start_url = relative(process.cwd(), safePath)
        .replace(/^(\.\.\/)+/, './')
        .replace(/\/$/, '')
    }
  }
  return start_url
}

function configScope(start_url: string, scope: string) {
  const isStartUrl = validateURL(start_url)
  const isUrl = validateURL(scope)
  if (isStartUrl && isUrl) {
    const scopeURL = new URL(scope)
    const startURL = new URL(start_url)
    if (scopeURL.host !== startURL.host || start_url.indexOf(scope) !== 0) {
      scope = parseRouter(start_url)
    }
  } else if (isStartUrl && !isUrl) {
    scope = new URL(scope, start_url).href
  } else if (!isStartUrl && isUrl) {
    const cleanPath = start_url.replace(/\/[^\/]+$/, '')
    scope = normalize(cleanPath + '/')
  }
  //  else {
  //   scope = join(parseRouter(start_url), scope)
  // }
  // scope = scope
  return scope
}

function validateURL(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch (error) {
    return false
  }
}

function parseRouter(url: string): string {
  let urlParts = url.split('/')
  urlParts.pop()
  let pathUrl: string = urlParts.join()
  while (pathUrl.indexOf(',') >= 0) {
    pathUrl = pathUrl.replace(',', '/')
  }
  return pathUrl
}

function testStartUrl() {
  console.log(configStartUrl('/', '', '/manifest.json', false))
  console.log(
    configStartUrl(
      'http://www.baidu.com',
      '',
      'http://www.baidu.com/manifest.json',
      true,
    ),
  )
  console.log(configStartUrl('/', '/', '/manifest.json', false))
  console.log(configStartUrl('/a.html?a=1', '/', '/manifest.json', false))
  console.log(
    configStartUrl(
      'http://www.baidu.com/test/a.html?a=1',
      '/xx',
      '/manifest.json',
      false,
    ),
  )
  console.log(
    configStartUrl(
      'http://www.baidu.com/a.html?a=1',
      'http://www.google.com/test',
      '/manifest.json',
      false,
    ),
  )
  console.log(
    configStartUrl('/test/index.html', '/public/aaa', '/manifest.json', false),
  )
}

function testScope() {
  console.log(configScope('/test/index.html', '/test'))
}

export function test() {
  // testStartUrl()
  // testScope()
}
