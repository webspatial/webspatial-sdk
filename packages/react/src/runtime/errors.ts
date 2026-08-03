export type WebSpatialBootErrorOptions = {
  cause: unknown
  attempt: number
}

export class WebSpatialBootError extends Error {
  readonly cause: unknown
  readonly attempt: number

  constructor({ cause, attempt }: WebSpatialBootErrorOptions) {
    super(`Failed to boot WebSpatial runtime on attempt ${attempt}`)
    this.name = 'WebSpatialBootError'
    this.cause = cause
    this.attempt = attempt
  }
}
