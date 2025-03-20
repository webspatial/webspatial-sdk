export function parseRouter(url: string): string {
  let urlParts = url.split('/')
  urlParts.pop()
  let pathUrl: string = urlParts.join()
  while (pathUrl.indexOf(',') >= 0) {
    pathUrl = pathUrl.replace(',', '/')
  }
  return pathUrl
}
