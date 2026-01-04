import {
  Spatialized2DElement,
  type BackgroundMaterialType,
} from '@webspatial/core-sdk'
import ReactDOM from 'react-dom/client'
import { useEffect, useRef, useState } from 'react'

import { enableDebugTool } from '@webspatial/react-sdk'

enableDebugTool()

function App() {
  const materialVals = [
    'none',
    'transparent',
    'thin',
    'translucent',
    'regular',
    'thick',
  ] as BackgroundMaterialType[]
  const [materialIndex, setMaterialIndex] = useState(0)
  const toggleBackgroundMaterial = () => {
    const newIndex = (materialIndex + 1) % materialVals.length
    document.documentElement.style.setProperty(
      '--xr-background-material',
      materialVals[newIndex],
    )
    console.log('dbg materialVals[i]', materialVals[newIndex])
    setMaterialIndex(newIndex)
  }

  const [materialIndexForSpatialDiv, setMaterialIndexForSpatialDiv] =
    useState(0)
  const toggleSpatialDivMaterial = () => {
    const newIndex = (materialIndexForSpatialDiv + 1) % materialVals.length
    setMaterialIndexForSpatialDiv(newIndex)
  }

  const [color, setColor] = useState('red')

  return (
    <>
      <div>
        <div className="m-[100px]">
          <h1 className="font-bold text-lg">
            this page background material is: {materialVals[materialIndex]}{' '}
          </h1>
          <button
            className="bg-indigo-500 text-white px-4 py-12 rounded-md"
            onClick={toggleBackgroundMaterial}
          >
            change spatialscene background material
          </button>
        </div>

        <div className="m-[100px]">
          <h1 className="font-bold text-lg">
            this spatialdiv background material is:
            {materialVals[materialIndexForSpatialDiv]}{' '}
          </h1>
          <button
            className="bg-indigo-500 text-white px-4 py-12 rounded-md mb-[20px] "
            onClick={toggleSpatialDivMaterial}
          >
            change spatialdiv background material
          </button>

          <div className="flex flex-row gap-[50px]">
            <div
              onClick={() => {
                console.log('dbg click spatialdiv')
                setColor(v => (v === 'green' ? 'red' : 'green'))
              }}
              // onSpatialTap={() => {
              //   console.log('dbg tap spatialdiv')
              // }}
              enable-xr
              style={{
                '--xr-back': 120,
                backgroundColor: color,
                transform: 'translateX(20px) rotateZ(20deg) ',
                width: '200px',
                height: '200px',
                // opacity: 0.801,
                // '--xr-background-material':
                //   materialVals[materialIndexForSpatialDiv],
                '--xr-background-material': 'transparent',
              }}
            >
              this is the first spatialdiv
            </div>

            {/* <div
              onClick={() => {
                console.log('dbg click spatialdiv')
                setColor(v => (v === 'green' ? 'red' : 'green'))
              }}
              enable-xr
              style={{
                '--xr-back': 70,
                backgroundColor: color,

                width: '200px',
                height: '200px',
                // opacity: 0.801,
                '--xr-background-material': 'transparent',
              }}
            >
              this is the second spatialdiv
            </div> */}
          </div>
        </div>
      </div>
    </>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
