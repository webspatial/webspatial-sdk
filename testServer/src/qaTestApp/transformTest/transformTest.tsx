// @ts-nocheck
import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'

function App() {
  const [translateX, setTranslateX] = useState(0)
  const [translateY, setTranslateY] = useState(0)
  const [translateZ, setTranslateZ] = useState(0)
  const [scaleX, setScaleX] = useState(1)
  const [scaleY, setScaleY] = useState(1)
  const [scaleZ, setScaleZ] = useState(1)
  const [rotate, setRotate] = useState(0)
  const [rotateX, setRotateX] = useState(0)
  const [rotateY, setRotateY] = useState(0)
  const [rotateZ, setRotateZ] = useState(0)
  const [skewX, setSkewX] = useState(0)
  const [skewY, setSkewY] = useState(0)
  const [matrix, setMatrix] = useState([1, 0, 0, 1, 0, 0])
  const [matrix3D, setMatrix3D] = useState([
    1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1,
  ])

  const [translateX1, setTranslateX1] = useState(0)
  const [translateY1, setTranslateY1] = useState(0)
  const [translateZ1, setTranslateZ1] = useState(0)
  const [scaleX1, setScaleX1] = useState(1)
  const [scaleY1, setScaleY1] = useState(1)
  const [scaleZ1, setScaleZ1] = useState(1)
  const [rotate1, setRotate1] = useState(0)
  const [rotateX1, setRotateX1] = useState(0)
  const [rotateY1, setRotateY1] = useState(0)
  const [rotateZ1, setRotateZ1] = useState(0)
  const [skewX1, setSkewX1] = useState(0)
  const [skewY1, setSkewY1] = useState(0)
  const [matrix1, setMatrix1] = useState([1, 0, 0, 1, 0, 0])
  const [matrix3D1, setMatrix3D1] = useState([
    1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1,
  ])

  const transformStyle = {
    transform: `translate3d(${translateX}px, ${translateY}px, ${translateZ}px) scale3d(${scaleX}, ${scaleY}, ${scaleZ}) rotate(${rotate}deg) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg) skew(${skewX}deg, ${skewY}deg) matrix(${matrix.join(', ')}) matrix3d(${matrix3D.join(', ')})`,
    width: '100px',
    height: '100px',
    backgroundColor: 'lightblue',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '20px auto',
  }

  const nestedTransformStyle = {
    transform: `translate3d(${translateX1}px, ${translateY1}px, ${translateZ1}px) scale3d(${scaleX1}, ${scaleY1}, ${scaleZ1}) rotate(${rotate1}deg) rotateX(${rotateX1}deg) rotateY(${rotateY1}deg) rotateZ(${rotateZ1}deg) skew(${skewX1}deg, ${skewY1}deg) matrix(${matrix1.join(', ')}) matrix3d(${matrix3D1.join(', ')})`,
    width: '100px',
    height: '100px',
    backgroundColor: 'blue',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '20px auto',
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <h1 style={{ textAlign: 'center', fontSize: '36px' }}>
        <div enable-xr className="text-6xl font-bold text-white p-8 rounded-xl">
          Transform Tests
        </div>
      </h1>
      {/* Navigation Bar */}
      <div className="flex text-white text-lg bg-black bg-opacity-25 p-4 gap-5 mb-4">
        <a href="/" className="hover:text-blue-400 transition-colors">
          Return to home page
        </a>
        <a
          href="#"
          onClick={() => history.go(-1)}
          className="hover:text-blue-400 transition-colors"
        >
          Back
        </a>
      </div>

      <div className="max-w-3xl mx-auto space-y-4">
        <div enable-xr style={transformStyle}>
          box
          <div enable-xr style={nestedTransformStyle}>
            nested box
          </div>
        </div>

        <div className=" grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg col-span-1">
            <div
              enable-xr
              style={{
                '--xr-background-material': 'default',
              }}
              className="p-2 text-white rounded-lg transition-colors"
            >
              <center>Transform Tests</center>
            </div>
            <div>
              <label>Translate X:</label>
              <input
                type="range"
                min="-200"
                max="200"
                value={translateX}
                onChange={e => setTranslateX(Number(e.target.value))}
              />
              <span>{translateX}px</span>
            </div>

            <div>
              <label>Translate Y:</label>
              <input
                type="range"
                min="-200"
                max="200"
                value={translateY}
                onChange={e => setTranslateY(Number(e.target.value))}
              />
              <span>{translateY}px</span>
            </div>

            <div>
              <label>Translate Z:</label>
              <input
                type="range"
                min="-200"
                max="200"
                value={translateZ}
                onChange={e => setTranslateZ(Number(e.target.value))}
              />
              <span>{translateZ}px</span>
            </div>

            <div>
              <label>Scale X:</label>
              <input
                type="range"
                min="0.1"
                max="3"
                step="0.1"
                value={scaleX}
                onChange={e => setScaleX(Number(e.target.value))}
              />
              <span>{scaleX}</span>
            </div>

            <div>
              <label>Scale Y:</label>
              <input
                type="range"
                min="0.1"
                max="3"
                step="0.1"
                value={scaleY}
                onChange={e => setScaleY(Number(e.target.value))}
              />
              <span>{scaleY}</span>
            </div>

            <div>
              <label>Scale Z:</label>
              <input
                type="range"
                min="0.1"
                max="3"
                step="0.1"
                value={scaleZ}
                onChange={e => setScaleZ(Number(e.target.value))}
              />
              <span>{scaleZ}</span>
            </div>

            <div>
              <label>Rotate:</label>
              <input
                type="range"
                min="0"
                max="360"
                value={rotate}
                onChange={e => setRotate(Number(e.target.value))}
              />
              <span>{rotate}°</span>
            </div>

            <div>
              <label>Rotate X:</label>
              <input
                type="range"
                min="0"
                max="360"
                value={rotateX}
                onChange={e => setRotateX(Number(e.target.value))}
              />
              <span>{rotateX}°</span>
            </div>

            <div>
              <label>Rotate Y:</label>
              <input
                type="range"
                min="0"
                max="360"
                value={rotateY}
                onChange={e => setRotateY(Number(e.target.value))}
              />
              <span>{rotateY}°</span>
            </div>

            <div>
              <label>Rotate Z:</label>
              <input
                type="range"
                min="0"
                max="360"
                value={rotateZ}
                onChange={e => setRotateZ(Number(e.target.value))}
              />
              <span>{rotateZ}°</span>
            </div>

            <div>
              <label>Skew X:</label>
              <input
                type="range"
                min="-50"
                max="50"
                value={skewX}
                onChange={e => setSkewX(Number(e.target.value))}
              />
              <span>{skewX}°</span>
            </div>

            <div>
              <label>Skew Y:</label>
              <input
                type="range"
                min="-50"
                max="50"
                value={skewY}
                onChange={e => setSkewY(Number(e.target.value))}
              />
              <span>{skewY}°</span>
            </div>

            <div>
              <label>Matrix:</label>
              <input
                type="text"
                value={matrix.join(', ')}
                onChange={e => setMatrix(e.target.value.split(',').map(Number))}
              />
              <span>{`matrix(${matrix.join(', ')})`}</span>
            </div>

            <div>
              <label>Matrix3D:</label>
              <input
                type="text"
                value={matrix3D.join(', ')}
                onChange={e =>
                  setMatrix3D(e.target.value.split(',').map(Number))
                }
              />
              <span>{`matrix3d(${matrix3D.join(', ')})`}</span>
            </div>
          </div>

          <div className="p-4 rounded-lg col-span-1">
            <div
              enable-xr
              style={{
                '--xr-background-material': 'default',
              }}
              className="p-2 text-white rounded-lg transition-colors"
            >
              <center>Nested Transform Tests</center>
            </div>
            <div>
              <label>Translate X:</label>
              <input
                type="range"
                min="-200"
                max="200"
                value={translateX1}
                onChange={e => setTranslateX1(Number(e.target.value))}
              />
              <span>{translateX1}px</span>
            </div>

            <div>
              <label>Translate Y:</label>
              <input
                type="range"
                min="-200"
                max="200"
                value={translateY1}
                onChange={e => setTranslateY1(Number(e.target.value))}
              />
              <span>{translateY1}px</span>
            </div>

            <div>
              <label>Translate Z:</label>
              <input
                type="range"
                min="-200"
                max="200"
                value={translateZ1}
                onChange={e => setTranslateZ1(Number(e.target.value))}
              />
              <span>{translateZ1}px</span>
            </div>

            <div>
              <label>Scale X:</label>
              <input
                type="range"
                min="0.1"
                max="3"
                step="0.1"
                value={scaleX1}
                onChange={e => setScaleX1(Number(e.target.value))}
              />
              <span>{scaleX1}</span>
            </div>

            <div>
              <label>Scale Y:</label>
              <input
                type="range"
                min="0.1"
                max="3"
                step="0.1"
                value={scaleY1}
                onChange={e => setScaleY1(Number(e.target.value))}
              />
              <span>{scaleY1}</span>
            </div>

            <div>
              <label>Scale Z:</label>
              <input
                type="range"
                min="0.1"
                max="3"
                step="0.1"
                value={scaleZ1}
                onChange={e => setScaleZ1(Number(e.target.value))}
              />
              <span>{scaleZ1}</span>
            </div>

            <div>
              <label>Rotate:</label>
              <input
                type="range"
                min="0"
                max="360"
                value={rotate1}
                onChange={e => setRotate1(Number(e.target.value))}
              />
              <span>{rotate1}°</span>
            </div>

            <div>
              <label>Rotate X:</label>
              <input
                type="range"
                min="0"
                max="360"
                value={rotateX1}
                onChange={e => setRotateX1(Number(e.target.value))}
              />
              <span>{rotateX1}°</span>
            </div>

            <div>
              <label>Rotate Y:</label>
              <input
                type="range"
                min="0"
                max="360"
                value={rotateY1}
                onChange={e => setRotateY1(Number(e.target.value))}
              />
              <span>{rotateY1}°</span>
            </div>

            <div>
              <label>Rotate Z:</label>
              <input
                type="range"
                min="0"
                max="360"
                value={rotateZ1}
                onChange={e => setRotateZ1(Number(e.target.value))}
              />
              <span>{rotateZ1}°</span>
            </div>

            <div>
              <label>Skew X:</label>
              <input
                type="range"
                min="-50"
                max="50"
                value={skewX1}
                onChange={e => setSkewX1(Number(e.target.value))}
              />
              <span>{skewX1}°</span>
            </div>

            <div>
              <label>Skew Y:</label>
              <input
                type="range"
                min="-50"
                max="50"
                value={skewY1}
                onChange={e => setSkewY1(Number(e.target.value))}
              />
              <span>{skewY1}°</span>
            </div>

            <div>
              <label>Matrix:</label>
              <input
                type="text"
                value={matrix1.join(', ')}
                onChange={e =>
                  setMatrix1(e.target.value.split(',').map(Number))
                }
              />
              <span>{`matrix(${matrix1.join(', ')})`}</span>
            </div>

            <div>
              <label>Matrix3D:</label>
              <input
                type="text"
                value={matrix3D1.join(', ')}
                onChange={e =>
                  setMatrix3D1(e.target.value.split(',').map(Number))
                }
              />
              <span>{`matrix3d(${matrix3D1.join(', ')})`}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const root = document.createElement('div')
document.body.appendChild(root)
ReactDOM.createRoot(root).render(<App />)
