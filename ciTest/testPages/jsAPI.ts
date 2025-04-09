import { SpatialHelper } from '@webspatial/core-sdk'
import ky from 'ky'
var testPort = parseInt(window.location.port) + 1

var testResults = [] as any[]
const testComplete = (pass: boolean, message: String) => {
  testResults.push({
    status: pass ? 'success' : 'fail',
    message: message,
  })
  document.body.innerHTML = JSON.stringify(testResults)
}
const testPass = (message: String) => {
  testComplete(true, message)
}
const testFail = (message: String) => {
  testComplete(false, message)
}

var main = async () => {
  if (SpatialHelper.instance === null) {
    testFail('SpatialHelper.instance is null')
  } else {
    testPass('SpatialHelper.instance is populated')

    document.documentElement.style.color = 'white'
    document.documentElement.style.padding = '50px'
    await SpatialHelper.instance.setBackgroundStyle(
      { material: { type: 'translucent' }, cornerRadius: 50 },
      '#00000000',
    )
    testPass('setBackgroundStyle')

    await SpatialHelper.instance.navigation.openPanel(
      '/testPages/testPage.html',
      { resolution: { width: 100, height: 100 } },
    )
    testPass('open panel')

    let shapEnt = await SpatialHelper.instance.shape.createShapeEntity()
    testPass('createShapeEntity')

    var res = await ky.post('http://localhost:' + testPort, {
      json: { results: testResults },
    })
    testPass('Received result')
  }
}
main()
