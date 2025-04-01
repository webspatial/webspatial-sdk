import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { SpatialDiv } from '@webspatial/react-sdk'
import { Euler, Quaternion } from 'three'

function getRatio(index: number, itemCount: number) {
  return (-Math.floor(itemCount / 2) + index) / (itemCount / 2)
}

function App() {
  const [toggle, setToggle] = useState(false)

  useEffect(() => {
    // Need this to workaround https://github.com/webspatial/webspatial-sdk/issues/282
    setTimeout(() => {
      setToggle(true)
    }, 200)
  }, [])

  return (
    <div className="h-screen w-full p-8">
      {!toggle ? (
        <></>
      ) : (
        <>
          <div className="flex h-full items-center justify-center">
            <div className="relative flex w-full max-w-6xl gap-6">
              {/* Artist Cards */}
              {[1, 2, 3, 4, 5].map((_, index) => (
                <SpatialDiv
                  key={index}
                  className="group relative flex-1"
                  spatialStyle={{
                    position: { z: 0 + Math.abs(getRatio(index, 5) * 80) },
                    rotation: new Quaternion().setFromEuler(
                      new Euler(0, -getRatio(index, 5) * 0.5, 0),
                    ),
                  }}
                >
                  {/* Artwork Display */}
                  <div
                    className="aspect-[3/4] w-full rounded-lg"
                    style={{
                      maskImage:
                        'linear-gradient(to bottom, rgba(1,0,0,1) 50%, rgba(1,0,0,0))',
                      backgroundImage:
                        "url('https://picsum.photos/200/300?x=" + index + "')",
                    }}
                  ></div>

                  {/* Artist Info Overlay */}
                  <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3 rounded-lg bg-black/20 p-3 ">
                    <div className="h-10 w-10 overflow-hidden rounded-full bg-gray-200" />
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">
                        Product {index + 1}
                      </span>
                    </div>
                  </div>
                </SpatialDiv>
              ))}
            </div>
          </div>

          {/* Back to Home Button */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
            <button className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm shadow-lg">
              <span className="material-icons text-gray-600">home</span>
              Back to Home
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// Initialize react
var root = document.createElement('div')
document.body.appendChild(root)
ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
// Force page height to 100% to get centering to work
document.documentElement.style.height = '100%'
document.body.style.height = '100%'
root.style.height = '100%'
