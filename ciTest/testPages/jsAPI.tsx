import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { SpatialHelper } from '@webspatial/core-sdk'
import ky from 'ky'
import React from 'react'

function App() {
  console.log('app start')
  let [results, setResults] = useState([] as Array<any>)

  useEffect(() => {
    var testPort = parseInt(window.location.port) + 1

    var testResults = [] as any[]
    const testComplete = (pass: boolean, message: String) => {
      var res = {
        status: pass ? 'success' : 'fail',
        message: message,
      }
      testResults.push(res)
      ////console.log(testResults)
      console.log('as ' + testResults.length)
      //  setResults(testResults);

      setResults(prevResults => [...prevResults, res])
      //document.body.innerHTML = JSON.stringify(testResults)
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

        let page = await SpatialHelper.instance.navigation.openPanel(
          '/testPages/testPage.html',
          { resolution: { width: 100, height: 100 } },
        )
        await new Promise(r => setTimeout(r, 1000))
        await page.windowContainer.close()
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
  }, [])

  return (
    <>
      <div style={{ fontSize: '3em', backgroundColor: '#000000aa' }}>
        Results
        {results.map((result: any) => {
          console.log('update')
          console.log(result)
          return (
            <div
              key={result.message}
              style={{ color: result.status === 'success' ? 'green' : 'red' }}
            >
              {result.message}
            </div>
          )
        })}
      </div>
    </>
  )
}

createRoot(document.getElementById('root')!).render(<App />)
