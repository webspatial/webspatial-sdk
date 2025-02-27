import { execSync } from 'child_process'

export default class Xcrun {
  public static async validate(
    path: string,
    key1: string,
    key2: string,
    useAccount: boolean,
  ) {
    const cmd = new XcrunCMD()
    cmd.validate(path)
    if (useAccount) {
      cmd.authAccount(key1, key2)
    } else {
      cmd.authApi(key1, key2)
    }
    cmd.platform('visionos')
    const res = execSync(cmd.line)
    return res.toString()
  }
  public static async uploadPackage(
    path: string,
    key1: string,
    key2: string,
    appleId: string,
    useAccount: boolean,
  ) {
    const cmd = new XcrunCMD()
    cmd.uploadPackage(path)
    if (useAccount) {
      cmd.authAccount(key1, key2)
    } else {
      cmd.authApi(key1, key2)
    }
    cmd.platform('visionos')
    cmd.appleId(appleId)
    const res = execSync(cmd.line)
    return res.toString()
  }

  public static async uploadApp(
    path: string,
    key1: string,
    key2: string,
    useAccount: boolean,
  ) {
    const cmd = new XcrunCMD()
    cmd.uploadApp(path)
    if (useAccount) {
      cmd.authAccount(key1, key2)
    } else {
      cmd.authApi(key1, key2)
    }
    cmd.platform('visionos')
    const res = execSync(cmd.line)
    return res.toString()
  }
}

class XcrunCMD {
  public line = 'xcrun altool'
  public validate(path: string) {
    this.line += ` --validate-app -f ${path}`
    return this
  }
  public uploadApp(path: string) {
    this.line += ` --upload-app -f ${path}`
    return this
  }

  public uploadPackage(path: string) {
    this.line += ` --upload-package ${path}`
    return this
  }

  public authAccount(username: string, password: string) {
    this.line += ` -u ${username} -p ${password}`
    return this
  }

  public authApi(key: string, issuer: string) {
    this.line += ` --apiKey ${key} --apiIssuer ${issuer}`
    return this
  }

  public appleId(id: string) {
    this.line += ` --apple-id ${id}`
    return this
  }

  public platform(platform: string) {
    this.line += ` -t ${platform}`
    return this
  }

  public version(version: string) {
    this.line += ` --bundle-version ${version}`
    return this
  }

  public verbose() {
    this.line += ` --verbose`
    return this
  }
}
