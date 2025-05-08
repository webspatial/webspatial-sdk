import { postMochaResult } from './api'
import './main.css'

import { enableDebugTool } from '@webspatial/react-sdk'

enableDebugTool()

async function runMocha(): Promise<TestResults> {
  const modules = import.meta.glob('./specs/*.spec.tsx', { eager: true })
  for (const path in modules) {
    modules[path]
  }
  const runner = mocha.run()

  const results: TestResults = {
    passes: [],
    failures: [],
  }

  runner.on('pass', function (test) {
    results.passes.push({
      title: test.title,
      fullTitle: test.fullTitle(),
      duration: test.duration,
    })
  })

  runner.on('fail', function (test, err) {
    results.failures.push({
      title: test.title,
      fullTitle: test.fullTitle(),
      err: err.message,
    })
  })

  return new Promise((resolve, _) => {
    runner.on('end', function () {
      resolve(results)
    })
  })
}

async function waitWindowLoaded() {
  return new Promise((resolve, _) => {
    window.onload = () => {
      resolve(null)
    }
  })
}

async function main() {
  const p1 = waitWindowLoaded()
  const p2 = runMocha()
  await Promise.allSettled([p1, p2])
  const results = await p2
  postMochaResult(results)
}

main()
