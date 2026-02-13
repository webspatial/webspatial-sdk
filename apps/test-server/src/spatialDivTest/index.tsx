import { type BackgroundMaterialType } from '@webspatial/core-sdk'
import ReactDOM from 'react-dom/client'
import { useEffect, useState } from 'react'

import { enableDebugTool } from '@webspatial/react-sdk'

enableDebugTool()

function App() {
  const [divRow, setDivRow] = useState(10)
  const [divCol, setDivCol] = useState(10)

  const z = 100

  return (
    <>
      <div className="text-blue    	bg-clip-border px-6 py-6  ">
        <a href="#" onClick={() => history.go(-1)}>
          Go Back
        </a>
      </div>

      <div
        style={{
          width: '100%',
          height: '100%',
        }}
      >
        {[...Array(divRow)].map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="flex flex-row space-x-2 w-screen text-gray-900   text-center"
          >
            {[...Array(divCol)].map((_, colIndex) => (
              <div
                key={colIndex + rowIndex * divCol}
                style={{
                  width: '50px',
                  height: '50px',
                  background: 'red',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
                className="grow"
              >
                <div
                  enable-xr
                  style={{
                    '--xr-back': z + '',
                    width: '60%',
                    height: '60%',
                    background: 'blue',
                  }}
                >
                  {`${rowIndex}, ${colIndex}`}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
