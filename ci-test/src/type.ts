declare global {
  type PassedTestResult = {
    title: string
    fullTitle: string
    duration?: number
  }

  type FailedTestResult = {
    title: string
    fullTitle: string
    err: string
  }

  type TestResults = {
    passes: PassedTestResult[]
    failures: FailedTestResult[]
  }
}
