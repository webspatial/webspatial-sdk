import ReactDOM from 'react-dom/client'
import { useState } from 'react'

import { enableDebugTool } from '@webspatial/react-sdk'

enableDebugTool()

function App() {
  const [divRow] = useState(10)
  const [divCol] = useState(10)

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
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          alignItems: 'center',
        }}
      >
        {[...Array(divRow)].map((_, rowIndex) => (
          <div
            key={rowIndex}
            style={{ gap: '10px', width: 'fit-content' }}
            className="flex flex-row text-gray-900 text-center"
          >
            {[...Array(divCol)].map((_, colIndex) => (
              <div
                key={colIndex + rowIndex * divCol}
                style={{
                  width: '80px',
                  height: '80px',
                  background: 'red',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <div
                  enable-xr
                  style={{
                    '--xr-back': z + '',
                    width: '60%',
                    height: '60%',
                    background: 'blue',
                    color: 'white',
                    fontWeight: 700,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
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
