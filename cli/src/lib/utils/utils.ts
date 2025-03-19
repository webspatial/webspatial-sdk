export function parseRouter(url: string): string {
  let urlParts = url.split('/')
  urlParts.pop()
  let pathUrl: string = urlParts.join()
  while (pathUrl.indexOf(',') >= 0) {
    pathUrl = pathUrl.replace(',', '/')
  }
  return pathUrl
}

/**
 * get webspatial avp url
 *
 *
 * @export
 * @param {string} url
 * @return {*}  {string}
 */
export function getAVPVersionUrl(url: string): string {
  const isEndWithSlash = url.endsWith('/')
  const trimmedUrl = isEndWithSlash ? url.slice(0, -1) : url

  if (trimmedUrl.endsWith('/webspatial/avp')) {
    return url
  }

  const separator = isEndWithSlash ? '' : '/'

  return `${url}${separator}webspatial/avp/`
}
