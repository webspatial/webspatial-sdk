import React, { useRef, useState, useEffect, CSSProperties } from 'react'
import ReactDOM from 'react-dom/client'
import { SpatialDiv } from '@xrsdk/react/dist'

function App() {
  const ref = useRef<HTMLDivElement>(null)
  const [elementState, setElementState] = useState({
    style: '',
    className: '',
  })
  const [testName, setTestName] = useState('testName')
  const [classNames, setClassNames] = useState(
    'test-element w-64 h-32 rounded-lg bg-white bg-opacity-10 flex items-center justify-center text-white transition-all duration-300',
  )
  const removeStyleAttribute = () => {
    if (ref.current) {
      // remove --xr-background-material style property
      ref.current.style.removeProperty('--xr-background-material')
    }
  }

  const updateElementState = () => {
    if (ref.current) {
      setElementState({
        style: ref.current.getAttribute('style') || 'None',
        className: ref.current.className || 'None',
      })
    }
  }

  useEffect(() => {
    updateElementState()
  }, [ref.current])

  const testDefaultMatRef = () => {
    if (!ref.current) return
    ;(ref.current.style as any)['--xr-background-material'] = 'default'
    setTestName('test default Mat ref')
    updateElementState()
  }

  const testThickMatRef = () => {
    if (!ref.current) return
    ;(ref.current.style as any)['--xr-background-material'] = 'thick'
    updateElementState()
    setTestName('test thick Mat ref')
  }

  const testRegularMatRef = () => {
    if (!ref.current) return
    ;(ref.current.style as any)['--xr-background-material'] = 'regular'
    updateElementState()
    setTestName('test regular Mat ref')
  }

  const testThinMatRef = () => {
    if (!ref.current) return
    ;(ref.current.style as any)['--xr-background-material'] = 'thin'
    updateElementState()
    setTestName('test thin Mat ref')
  }

  const testDefaultMatClassName = () => {
    if (!ref.current) return
    // (ref.current.style as any)['--xr-background-material'] = 'none'

    setClassNames(
      'defaultMat test-element w-64 h-32 rounded-lg bg-white bg-opacity-10 flex items-center justify-center text-white transition-all duration-300',
    )
    console.log('DefaultMat classNames: ' + classNames)
    setTestName('test Default Mat className')
  }

  const testRegularMatClassName = () => {
    // if (!ref.current) return
    // (ref.current.style as any)['--xr-background-material'] = 'none'
    setClassNames(
      'regularMat test-element w-64 h-32 rounded-lg bg-white bg-opacity-10 flex items-center justify-center text-white transition-all duration-300',
    )
    // updateElementState()
    console.log('RegularMat classNames: ' + classNames)
    setTestName('test Regular Mat className')
  }

  const testThickMatClassName = () => {
    // if (!ref.current) return
    setClassNames(
      'thickMat test-element w-64 h-32 rounded-lg bg-white bg-opacity-10 flex items-center justify-center text-white transition-all duration-300',
    )
    // updateElementState()
    console.log('ThickMat classNames: ' + classNames)
    setTestName('test Thick Mat className')
  }

  const testThinMatClassName = () => {
    // if (!ref.current) return
    setClassNames(
      'thinMat test-element w-64 h-32 rounded-lg bg-white bg-opacity-10 flex items-center justify-center text-white transition-all duration-300',
    )
    // updateElementState()
    console.log('ThinMat classNames: ' + classNames)
    setTestName('test Thin Mat className')
  }

  const resetStyles = () => {
    if (!ref.current) return
    // ref.current.removeAttribute('style')
    removeStyleAttribute()
    // ;(ref.current.style as any)['--xr-background-material'] = 'none'  // maybe bug this cannot be used together with className
    ref.current.className =
      'test-element w-64 h-32 rounded-lg bg-white bg-opacity-10 flex items-center justify-center text-white transition-all duration-300'
    console.log('ResetMat classNames: ' + classNames)
    // updateElementState()
    setTestName('testName')
  }

  return (
    <div className="min-h-screen bg-gray-700 p-4">
      <h1 style={{ textAlign: 'center', fontSize: '36px' }}>
        <SpatialDiv
          spatialStyle={{
            position: { z: 100 }, // z方向凸起50
          }}
          className="text-6xl font-bold text-white p-8 rounded-xl"
        >
          Material API Tests
        </SpatialDiv>
      </h1>
      {/* 导航栏 */}
      <div className="flex text-white text-lg bg-black bg-opacity-25 p-4 gap-5 mb-4">
        <a
          href="/testServer/public"
          className="hover:text-blue-400 transition-colors"
        >
          返回主页
        </a>
        <a
          href="#"
          onClick={() => history.go(-1)}
          className="hover:text-blue-400 transition-colors"
        >
          返回上一级
        </a>
      </div>

      <div className="max-w-3xl mx-auto space-y-4">
        <div className="bg-gray-800 p-4 rounded-lg min-h-[100px] flex items-center justify-center">
          <div
            enable-xr
            style={{
              '--xr-back': 100,
            }}
            ref={ref}
            // className="test-element w-64 h-32 rounded-lg bg-white bg-opacity-10 flex items-center justify-center text-white transition-all duration-300"
            className={classNames}
          >
            <center>{testName}</center>
          </div>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="grid grid-cols-2 gap-2">
            <div
              enable-xr
              style={{
                '--xr-background-material': 'default',
              }}
              className="p-2 text-white rounded-lg transition-colors col-span-2"
            >
              <center>ref test</center>
            </div>
            <button
              onClick={testDefaultMatRef}
              className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Glass Material ref
            </button>
            <button
              onClick={testThickMatRef}
              className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              Thick Material ref
            </button>
            <button
              onClick={testRegularMatRef}
              className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              Regular Material
            </button>
            <button
              onClick={testThinMatRef}
              className="p-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
            >
              Thin Material
            </button>

            <div
              enable-xr
              style={{
                '--xr-background-material': 'default',
              }}
              className="p-2 text-white rounded-lg transition-colors col-span-2"
            >
              <center>class name test</center>
            </div>
            <button
              onClick={testDefaultMatClassName}
              className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Glass Material ClassName
            </button>
            <button
              onClick={testThickMatClassName}
              className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              Thick Material ClassName
            </button>
            <button
              onClick={testRegularMatClassName}
              className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              Regular Material ClassName
            </button>
            <button
              onClick={testThinMatClassName}
              className="p-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
            >
              Thin Material ClassName
            </button>

            <button
              onClick={resetStyles}
              className="p-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors col-span-2"
            >
              Reset Material
            </button>
          </div>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-base text-white mb-2">Current Element State:</h3>
          <pre className="text-sm text-gray-300 whitespace-pre-wrap">
            {ref.current
              ? `Style: ${elementState.style}
Class Name: ${elementState.className}`
              : 'Element Not Loaded'}
          </pre>
        </div>
        <div
          enable-xr
          style={{
            '--xr-background-material': 'default',
            '--xr-back': '100',
          }}
          className="p-2 text-white rounded-lg transition-colors col-span-2"
        >
          <center>Test default material with xr bck</center>
        </div>

        <div enable-xr className="noMat bg-gray-50 bg-opacity-10">
          <center>Test none material</center>
        </div>
        <div enable-xr className="thinMat bg-gray-50 bg-opacity-10">
          <center>Test thin material</center>
        </div>
        <div enable-xr className="regularMat bg-gray-50 bg-opacity-10">
          <center>Test regular material</center>
        </div>
        <div enable-xr className="thickMat bg-gray-50 bg-opacity-10">
          <center>Test thick material</center>
        </div>
        <div enable-xr className="defaultMat bg-gray-50 bg-opacity-10">
          <center>Test default material</center>
        </div>

        <SpatialDiv
          spatialStyle={{
            position: { z: 30 }, // z方向凸起50
          }}
          className="defaultMat text-6xl font-bold text-white p-7 bg-opacity-25 rounded-xl"
        >
          Test Material Thick
        </SpatialDiv>
        <SpatialDiv
          spatialStyle={{
            position: { z: 50 }, // z方向凸起50
          }}
          className="thinMat text-6xl font-bold text-white p-7 rounded-xl"
        >
          Test Material thin
        </SpatialDiv>
      </div>
    </div>
  )
}

const root = document.createElement('div')
document.body.appendChild(root)
ReactDOM.createRoot(root).render(<App />)
