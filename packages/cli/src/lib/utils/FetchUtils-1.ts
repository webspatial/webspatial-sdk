class FetchUtils {
  private fetchEngine = null
  public fetch: any = null
  public downloadFile: any = null
  public decompressResponseBuffer: any = null
  setFetchEngine(newFetchEngine: any): void {
    this.fetchEngine = newFetchEngine
  }
  setFetch(newFetch: any): void {
    this.fetch = newFetch
  }
  setDownloadFile(newDownloadFile: any): void {
    this.downloadFile = newDownloadFile
  }
  setDecompressResponseBuffer(newDecompressResponseBuffer: any): void {
    this.decompressResponseBuffer = newDecompressResponseBuffer
  }
}
const fetchUtils = new FetchUtils()
export { fetchUtils }
