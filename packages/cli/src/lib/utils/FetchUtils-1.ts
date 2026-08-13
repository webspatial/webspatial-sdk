class FetchUtils {
  public fetch: any = null
  public downloadFile: any = null
  public decompressResponseBuffer: any = null
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
