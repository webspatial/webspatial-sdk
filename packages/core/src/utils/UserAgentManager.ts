/** VisionOS shell's UA use "WSAppShell"
 *  PicoOS shell's UA use "PicoWebApp"
 */
export const UserAgentManager = {
  getUserAgent(): string {
    return typeof window !== 'undefined' ? window.navigator.userAgent : ''
  },
  isPuppeteer(): boolean {
    return this.getUserAgent().includes('Puppeteer')
  },
  isPicoOS(): boolean {
    return this.getUserAgent().includes('PicoWebApp')
  },
  isAndroid(): boolean {
    return (
      this.getUserAgent().includes('Android') ||
      this.getUserAgent().includes('Linux')
    )
  },
  hasWebSpatialEnv(): boolean {
    return this.getUserAgent().includes('WebSpatial')
  },
  wsAppShellVersionFromUA: '0.0.0',
  getWebSpatialVersionFromUA: function () {
    const match = this.getUserAgent().match(
      /(?:WebSpatial)\/(\d+(?:\.\d+){2}(?:[-+][0-9A-Za-z.-]+)*)/,
    )
    return match ? match[1] : '0.0.0'
  },
  getShellVersionFromUA: function () {
    if (this.wsAppShellVersionFromUA !== '0.0.0') {
      return this.wsAppShellVersionFromUA
    }
    const match = this.getUserAgent().match(
      /(?:WSAppShell|PicoWebApp)\/(\d+(?:\.\d+){2}(?:[-+][0-9A-Za-z.-]+)*)/,
    )
    this.wsAppShellVersionFromUA = match ? match[1] : '0.0.0'
    return this.wsAppShellVersionFromUA
  },
}
