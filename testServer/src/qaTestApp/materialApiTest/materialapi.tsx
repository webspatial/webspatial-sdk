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
  const [selectedRefMaterial, setSelectedRefMaterial] = useState('default')
  const [selectedClassNameMaterial, setSelectedClassNameMaterial] =
    useState('default')
  const [selectedInlineMaterial, setSelectedInlineMaterial] = useState('none')
  const [style, setStyle] = useState<CSSProperties>({
    '--xr-back': '100',
  } as CSSProperties)

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

  const applyRefMaterial = () => {
    if (!ref.current) return
    ;(ref.current.style as any)['--xr-background-material'] =
      selectedRefMaterial
    setTestName(`test ${selectedRefMaterial} Mat ref`)
    updateElementState()
  }

  const applyClassNameMaterial = () => {
    if (!ref.current) return
    let newClassNames =
      'test-element w-64 h-32 rounded-lg bg-white bg-opacity-10 flex items-center justify-center text-white transition-all duration-300'
    if (selectedClassNameMaterial === 'default') {
      newClassNames = 'defaultMat ' + newClassNames
    } else if (selectedClassNameMaterial === 'thick') {
      newClassNames = 'thickMat ' + newClassNames
    } else if (selectedClassNameMaterial === 'regular') {
      newClassNames = 'regularMat ' + newClassNames
    } else if (selectedClassNameMaterial === 'thin') {
      newClassNames = 'thinMat ' + newClassNames
    }
    setClassNames(newClassNames)
    console.log(`${selectedClassNameMaterial}Mat classNames: ` + classNames)
    setTestName(`test ${selectedClassNameMaterial} Mat className`)
  }

  const applyInlineStyleMaterial = () => {
    const material = selectedInlineMaterial
    const newStyle: CSSProperties = {
      '--xr-back': '100',
      ...(material !== 'none' && { '--xr-background-material': material }),
    }
    setStyle(newStyle)
    setTestName(`test ${material} Mat inline`)
  }

  const resetStyles = () => {
    if (!ref.current) return
    removeStyleAttribute()
    ref.current.className =
      'test-element w-64 h-32 rounded-lg bg-white bg-opacity-10 flex items-center justify-center text-white transition-all duration-300'
    console.log('ResetMat classNames:' + classNames)
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
        <a href="/" className="hover:text-blue-400 transition-colors">
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
          <div enable-xr style={style} ref={ref} className={classNames}>
            <center>{testName}</center>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {/* Ref Test Section */}
          <div className="bg-gray-800 p-4 rounded-lg col-span-1">
            <div
              enable-xr
              style={{
                '--xr-background-material': 'default',
              }}
              className="p-2 text-white rounded-lg transition-colors"
            >
              <center>Ref Test</center>
            </div>
            <div className="mt-4">
              <select
                value={selectedRefMaterial}
                onChange={e => setSelectedRefMaterial(e.target.value)}
                className="w-full p-2 rounded-md"
              >
                <option value="default">Glass Material</option>
                <option value="thick">Thick Material</option>
                <option value="regular">Regular Material</option>
                <option value="thin">Thin Material</option>
              </select>
              <button
                onClick={applyRefMaterial}
                className="mt-2 w-full p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Apply Material
              </button>
            </div>
          </div>

          {/* Class Name Test Section */}
          <div className="bg-gray-800 p-4 rounded-lg col-span-1">
            <div
              enable-xr
              style={{
                '--xr-background-material': 'default',
              }}
              className="p-2 text-white rounded-lg transition-colors"
            >
              <center>Class Name Test</center>
            </div>
            <div className="mt-4">
              <select
                value={selectedClassNameMaterial}
                onChange={e => setSelectedClassNameMaterial(e.target.value)}
                className="w-full p-2 rounded-md"
              >
                <option value="default">Glass Material</option>
                <option value="thick">Thick Material</option>
                <option value="regular">Regular Material</option>
                <option value="thin">Thin Material</option>
              </select>
              <button
                onClick={applyClassNameMaterial}
                className="mt-2 w-full p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Apply Material
              </button>
            </div>
          </div>

          {/* In-line Style Test */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <div
              enable-xr
              style={{
                '--xr-background-material': 'default',
              }}
              className="p-2 text-white rounded-lg transition-colors"
            >
              <center>In-line Style Test</center>
            </div>
            <div className="mt-4">
              <select
                onChange={e => setSelectedInlineMaterial(e.target.value)}
                className="w-full p-2 rounded-md"
              >
                <option value="default">Glass Material</option>
                <option value="thick">Thick Material</option>
                <option value="regular">Regular Material</option>
                <option value="thin">Thin Material</option>
              </select>
              <button
                onClick={applyInlineStyleMaterial}
                className="mt-2 w-full p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Apply Material
              </button>
            </div>
          </div>
        </div>
        {/* Reset Button */}
        <div className="flex items-center justify-end">
          <button
            onClick={resetStyles}
            className="p-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            Reset Material
          </button>
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
