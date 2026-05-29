export class AsyncPromise<T> {
  private promise: Promise<T>
  private promiseResolve?: (value: T | PromiseLike<T>) => void
  private promiseReject?: (reason?: any) => void

  constructor() {
    this.promise = new Promise((res, rej) => {
      this.promiseResolve = res
      this.promiseReject = rej
    })
  }

  waitFinish() {
    return this.promise
  }

  resolve(data: T) {
    this.promiseResolve!(data)
  }

  reject(error: any) {
    this.promiseReject!(error)
  }
}
