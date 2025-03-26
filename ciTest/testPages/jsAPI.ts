import { SpatialHelper } from '@webspatial/core-sdk'
import ky from 'ky'
console.log('hello world')
var testResults = [] as any[]

var testPort = parseInt(window.location.port) + 1

var main = async () => {
  if (SpatialHelper.instance === null) {
    testResults.push({
      status: 'fail',
      message: 'SpatialHelper.instance is null',
    })
    document.body.innerHTML = JSON.stringify(testResults)
  } else {
    testResults.push({
      status: 'success',
      message: 'SpatialHelper.instance is populated',
    })
    var res = await ky.post('http://localhost:' + testPort, {
      json: { results: testResults },
    })
    document.body.innerHTML = JSON.stringify(testResults)
  }
}
main()
