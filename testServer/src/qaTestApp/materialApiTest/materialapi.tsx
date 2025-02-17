import React, { useRef, useState, useEffect, CSSProperties } from 'react'
import ReactDOM from 'react-dom/client'
import { enableDebugTool, SpatialDiv } from '@xrsdk/react/dist'

enableDebugTool()

function App() {
  // child element
  const testElementRef = useRef<HTMLDivElement>(null)
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
    position: 'absolute',
  } as CSSProperties)

  // html style
  const [selectedHtmlMaterial, setSelectedHtmlMaterial] = useState('none')
  const [htmlStyles, setHtmlStyles] = useState<CSSStyleDeclaration | null>(null)

  // parent element
  const testElementRefParent = useRef<HTMLDivElement>(null)
  const [elementStateParent, setElementStateParent] = useState({
    style: '',
    className: '',
  })
  const [testNameParent, setTestNameParent] = useState('testNameParent')
  const [classNamesParent, setClassNamesParent] = useState(
    'test-element w-64 h-32 rounded-lg bg-white bg-opacity-10 flex items-center justify-center text-white transition-all duration-300',
  )
  const [selectedRefMaterialParent, setSelectedRefMaterialParent] =
    useState('default')
  const [selectedClassNameMaterialParent, setSelectedClassNameMaterialParent] =
    useState('default')
  const [selectedInlineMaterialParent, setSelectedInlineMaterialParent] =
    useState('none')
  const [styleParent, setStyleParent] = useState<CSSProperties>({
    '--xr-back': '50',
    position: 'relative',
  } as CSSProperties)

  const removeStyleAttribute = () => {
    if (testElementRef.current) {
      // remove --xr-background-material style property
      testElementRef.current.style.removeProperty('--xr-background-material')
    }
  }

  const removeStyleAttributeParent = () => {
    if (testElementRefParent.current) {
      // remove --xr-background-material style property
      testElementRefParent.current.style.removeProperty(
        '--xr-background-material',
      )
    }
  }

  const updateElementState = () => {
    if (testElementRef.current) {
      setElementState({
        style: testElementRef.current.getAttribute('style') || 'None',
        className: testElementRef.current.className || 'None',
      })
    }
  }

  const updateElementStateParent = () => {
    if (testElementRefParent.current) {
      setElementStateParent({
        style: testElementRefParent.current.getAttribute('style') || 'None',
        className: testElementRefParent.current.className || 'None',
      })
    }
  }

  useEffect(() => {
    updateElementState()
  }, [testElementRef.current])

  useEffect(() => {
    updateElementStateParent()
  }, [testElementRefParent.current])

  useEffect(() => {
    const htmlElement = document.documentElement
    const computedStyles = window.getComputedStyle(htmlElement)
    setHtmlStyles(computedStyles)
  }, [])

  useEffect(() => {
    const htmlElement = document.documentElement

    // Function to get the computed styles
    const getHtmlStyles = () => window.getComputedStyle(htmlElement)

    // Initialize with the current styles
    setHtmlStyles(getHtmlStyles())

    // MutationObserver to listen for style changes
    const observer = new MutationObserver(() => {
      setHtmlStyles(getHtmlStyles())
    })

    // Observe the <html> element for style attribute changes
    observer.observe(htmlElement, {
      attributes: true, // Listen for attribute changes
      attributeFilter: ['style'], // Only observe the "style" attribute
    })

    // Cleanup observer on component unmount
    return () => {
      observer.disconnect()
    }
  }, [])

  const updateHtmlBackgroundMaterial = (newMaterial: string) => {
    document.documentElement.style['--xr-background-material'] = newMaterial
    document.documentElement.style['background-color'] = 'transparent'
    setSelectedInlineMaterial(newMaterial)
    console.log(
      'update html style new material: ' +
        newMaterial +
        ',  ' +
        htmlStyles?.getPropertyValue('--xr-background-material'),
    )
  }

  const applyRefMaterial = () => {
    if (testElementRef.current) {
      ;(testElementRef.current.style as any)['--xr-background-material'] =
        selectedRefMaterial
      setTestName(`test ${selectedRefMaterial} Mat ref`)
    }
    updateElementState()
  }

  const applyRefMaterialParent = () => {
    if (testElementRefParent.current) {
      ;(testElementRefParent.current.style as any)['--xr-background-material'] =
        selectedRefMaterialParent
      setTestNameParent(`test ${selectedRefMaterialParent} Mat ref`)
    }
    updateElementStateParent()
  }

  const applyClassNameMaterial = () => {
    if (testElementRef.current) {
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
      console.log(`${selectedClassNameMaterial} Mat classNames: ` + classNames)
      setTestName(`test ${selectedClassNameMaterial} Mat className`)
    }
  }

  const applyClassNameMaterialParent = () => {
    console.log(
      `${selectedClassNameMaterialParent} Mat classNames: ` + classNamesParent,
    )

    if (testElementRefParent.current) {
      let newClassNames =
        'test-element w-64 h-32 rounded-lg bg-white bg-opacity-10 flex items-center justify-center text-white transition-all duration-300'
      if (selectedClassNameMaterialParent === 'default') {
        newClassNames = 'defaultMat ' + newClassNames
      } else if (selectedClassNameMaterialParent === 'thick') {
        newClassNames = 'thickMat ' + newClassNames
      } else if (selectedClassNameMaterialParent === 'regular') {
        newClassNames = 'regularMat ' + newClassNames
      } else if (selectedClassNameMaterialParent === 'thin') {
        newClassNames = 'thinMat ' + newClassNames
      }
      setClassNamesParent(newClassNames)
      console.log(
        `${selectedClassNameMaterialParent} Mat classNames: ` +
          classNamesParent,
      )
      setTestNameParent(`test ${selectedClassNameMaterialParent} Mat className`)
    }
  }

  const applyInlineStyleMaterial = () => {
    const material = selectedInlineMaterial
    const newStyle: CSSProperties = {
      '--xr-back': '100',
      // position: 'absolute',
      ...(material !== 'none' && { '--xr-background-material': material }),
    }
    setStyle(newStyle)
    setTestName(`test ${material} Mat inline`)
  }

  const applyInlineStyleMaterialParent = () => {
    const material = selectedInlineMaterialParent
    const newStyleParent: CSSProperties = {
      '--xr-back': '50',
      position: 'relative',
      ...(material !== 'none' && { '--xr-background-material': material }),
    }
    setStyleParent(newStyleParent)
    setTestNameParent(`test ${material} Mat inline`)
  }

  const resetStyles = () => {
    if (testElementRef.current) {
      testElementRef.current.className =
        'test-element w-64 h-32 rounded-lg bg-white bg-opacity-10 flex items-center justify-center text-white transition-all duration-300'
      console.log('ResetMat classNames:' + classNames)
      setTestName('testName')
    }
    removeStyleAttribute()
    // document.documentElement.style.setProperty('--xr-background-material', 'none');  // not working
    // document.documentElement.style.removeProperty('--xr-background-material')  // not working
    document.documentElement.style['--xr-background-material'] = 'none'
  }

  const resetStylesParent = () => {
    if (testElementRefParent.current) {
      testElementRefParent.current.className =
        'test-element w-64 h-32 rounded-lg bg-white bg-opacity-10 flex items-center justify-center text-white transition-all duration-300'
      console.log('ResetMat parent classNames:' + classNamesParent)
      setTestNameParent('testNameParent')
    }
    removeStyleAttributeParent()
    // document.documentElement.style.setProperty('--xr-background-material', 'none');  // not working
    // document.documentElement.style.removeProperty('--xr-background-material')  // not working
    document.documentElement.style['--xr-background-material'] = 'none'
  }

  const applyHtmlInlineStyleMaterial = () => {
    // document.documentElement.style.setProperty(
    //   '--xr-background-material',
    //   selectedHtmlMaterial,
    // )
    document.documentElement.style['--xr-background-material'] =
      selectedHtmlMaterial
    // document.documentElement.style['background-color'] = 'transparent'
    console.log(
      'Get html tag styles getPropertyValue: ' +
        htmlStyles.getPropertyValue('--xr-background-material'),
    )
    console.log(
      'Get html tag styles: ' +
        document.documentElement.style['--xr-background-material'],
    )
  }

  return (
    <div className="min-h-screen bg-amber-200 bg-opacity-10 p-4">
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
      {/* Navigation Bar */}
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
          <div
            enable-xr
            style={styleParent}
            ref={testElementRefParent}
            className={classNamesParent}
            debugName="parent"
          >
            <center>{testNameParent}</center>
            <div
              enable-xr
              style={style}
              ref={testElementRef}
              className={classNames}
              debugName="child"
            >
              <center>{testName}</center>
            </div>
          </div>
        </div>

        {/* child element tests */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-gray-800 p-4 rounded-lg col-span-3">
            <center>child div tests</center>
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
        </div>

        <div className="grid grid-cols-4 gap-4">
          {/* Ref Test Section */}
          <div className="bg-gray-800 p-4 rounded-lg col-span-1">
            <div
              enable-xr
              style={{
                '--xr-background-material': 'translucent',
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
                <option value="none">none Material</option>
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
                '--xr-background-material': 'translucent',
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
                <option value="none">none Material</option>
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
                '--xr-background-material': 'translucent',
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
                <option value="none">none Material</option>
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

          <div className="bg-gray-800 p-4 rounded-lg">
            <div
              enable-xr
              style={{
                '--xr-background-material': 'translucent',
              }}
              className="p-2 text-white rounded-lg transition-colors"
            >
              <center>html In-line Style Test</center>
            </div>
            <div className="mt-4">
              <select
                onChange={e => setSelectedHtmlMaterial(e.target.value)}
                className="w-full p-2 rounded-md"
              >
                <option value="none">None Material</option>
                <option value="default">Glass Material</option>
                <option value="thick">Thick Material</option>
                <option value="regular">Regular Material</option>
                <option value="thin">Thin Material</option>
              </select>
              <button
                onClick={applyHtmlInlineStyleMaterial}
                className="mt-2 w-full p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Apply Material
              </button>
              {/*update html style new material: htmlstyles.getpropertyValue: {htmlStyles?.getPropertyValue('--xr-background-material')}*/}
              {/*document.documentElement.style['--xr-background-material']: {document.documentElement.style['--xr-background-material']}*/}
            </div>
          </div>
        </div>

        {/* Parent element tests */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-gray-800 p-4 rounded-lg col-span-3">
            <center>parent div test</center>
          </div>
          {/* Reset Button */}
          <div className="flex items-center justify-end">
            <button
              onClick={resetStylesParent}
              className="p-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Reset parent Material
            </button>
          </div>
        </div>

        {/* parent test element */}
        <div className="grid grid-cols-4 gap-4">
          {/* Ref Test Section */}
          <div className="bg-gray-800 p-4 rounded-lg col-span-1">
            <div
              enable-xr
              style={{
                '--xr-background-material': 'translucent',
              }}
              className="p-2 text-white rounded-lg transition-colors"
            >
              <center>Ref Test</center>
            </div>
            <div className="mt-4">
              <select
                value={selectedRefMaterialParent}
                onChange={e => setSelectedRefMaterialParent(e.target.value)}
                className="w-full p-2 rounded-md"
              >
                <option value="none">none Material</option>
                <option value="default">Glass Material</option>
                <option value="thick">Thick Material</option>
                <option value="regular">Regular Material</option>
                <option value="thin">Thin Material</option>
              </select>
              <button
                onClick={applyRefMaterialParent}
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
                '--xr-background-material': 'translucent',
              }}
              className="p-2 text-white rounded-lg transition-colors"
            >
              <center>Class Name Test</center>
            </div>
            <div className="mt-4">
              <select
                value={selectedClassNameMaterialParent}
                onChange={e =>
                  setSelectedClassNameMaterialParent(e.target.value)
                }
                className="w-full p-2 rounded-md"
              >
                <option value="none">none Material</option>
                <option value="default">Glass Material</option>
                <option value="thick">Thick Material</option>
                <option value="regular">Regular Material</option>
                <option value="thin">Thin Material</option>
              </select>
              <button
                onClick={applyClassNameMaterialParent}
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
                '--xr-background-material': 'translucent',
              }}
              className="p-2 text-white rounded-lg transition-colors"
            >
              <center>In-line Style Test</center>
            </div>
            <div className="mt-4">
              <select
                onChange={e => setSelectedInlineMaterialParent(e.target.value)}
                className="w-full p-2 rounded-md"
              >
                <option value="none">none Material</option>
                <option value="default">Glass Material</option>
                <option value="thick">Thick Material</option>
                <option value="regular">Regular Material</option>
                <option value="thin">Thin Material</option>
              </select>
              <button
                onClick={applyInlineStyleMaterialParent}
                className="mt-2 w-full p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Apply Material
              </button>
            </div>
          </div>

          <div className="bg-gray-800 p-4 rounded-lg">
            <div
              enable-xr
              style={{
                '--xr-background-material': 'translucent',
              }}
              className="p-2 text-white rounded-lg transition-colors"
            >
              <center>html In-line Style Test</center>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-base text-white mb-2">Current Element State:</h3>
          <pre className="text-sm text-gray-300 whitespace-pre-wrap">
            {testElementRef.current
              ? `Style: ${elementState.style}
Class Name: ${elementState.className}`
              : 'Element Not Loaded'}
          </pre>
          <h3 className="text-base text-white mb-2">
            Current Parent Element State:
          </h3>
          <pre className="text-sm text-gray-300 whitespace-pre-wrap">
            {testElementRefParent.current
              ? `Style: ${elementStateParent.style}
Class Name: ${elementStateParent.className}`
              : 'Element Not Loaded'}
          </pre>
        </div>

        {/* Test html page material*/}
        <div className="grid grid-cols-3 gap-4">
          {/* html in-line style tests */}
        </div>

        {/*Get the html style state */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-base text-white mb-2">
            Current html style State:
          </h3>
          {htmlStyles ? (
            <pre>
              <code>
                {JSON.stringify(
                  {
                    backgroundColor: htmlStyles.backgroundColor,
                    borderRadius: htmlStyles.borderRadius,
                    '--xr-background-material':
                      document.documentElement.style[
                        '--xr-background-material'
                      ],
                  },
                  null,
                  2,
                )}
              </code>
            </pre>
          ) : (
            <p>Loading styles...</p>
          )}
        </div>

        <div
          enable-xr
          style={{
            '--xr-background-material': 'translucent',
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
