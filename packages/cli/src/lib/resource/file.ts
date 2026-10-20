import * as fs from 'fs'
export function copyDir(from: string, to: string) {
  const paths = fs.readdirSync(from)
  paths.forEach(path => {
    const _from = from + '/' + path
    const _to = to + '/' + path
    const stat = fs.statSync(_from)
    if (stat.isFile()) {
      try {
        fs.writeFileSync(_to, fs.readFileSync(_from))
      } catch (err) {
        console.log(err)
      }
    } else if (stat.isDirectory()) {
      if (!fs.existsSync(_to)) {
        fs.mkdirSync(_to, { recursive: true })
      }
      copyDir(_from, _to)
    }
  })
}

export function clearDir(from: string) {
  if (!fs.existsSync(from)) {
    return
  }
  const paths = fs.readdirSync(from)
  paths.forEach(path => {
    const _from = from + '/' + path
    fs.rmSync(_from, { recursive: true, force: true })
  })
}
