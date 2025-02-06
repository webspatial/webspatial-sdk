import React, { useRef, useState, useEffect, CSSProperties } from 'react'
import ReactDOM from 'react-dom/client'
import { SpatialDiv } from '@xrsdk/react/dist'
import { PopmotionTest } from './popMotion.tsx'
import { ReactSpringTest } from './reactSpringTest.tsx'
import { GSAPTest } from './GSAPTest.tsx'
import { TeenjsTest } from './teenjsTest.tsx'

function App() {
  // const CustomReactComponent = () => {
  //   const ref = useRef()
  //   const depthRef = useRef(0)
  //   useEffect(()=> {
  //     const timeId = setInterval(() => {
  //       depthRef.current += 0.1
  //       ref.current.style['--xr-back'] = depthRef.current
  //     }, 1/60)
  //     return () => {
  //       clearInterval(timeId)
  //     }
  //   }, [])
  //
  //   return <div enable-xr ref={ref} > this is spatial div </div>
  // }

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
      ...(material !== 'none' && { '--xr-background-material': material }),
    }
    setStyle(newStyle)
    setTestName(`test ${material} Mat inline`)
  }

  const applyInlineStyleMaterialParent = () => {
    const material = selectedInlineMaterialParent
    const newStyleParent: CSSProperties = {
      '--xr-back': '50',
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
    <div className="min-h-screen bg-gray-900 p-44">
      <h1 style={{ textAlign: 'center', fontSize: '36px' }}>
        <SpatialDiv
          spatialStyle={{
            position: { z: 100 }, // z方向凸起50
          }}
          className="text-6xl font-bold text-white p-8 rounded-xl"
        >
          JS Animation Tests
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

      <PopmotionTest />
      <ReactSpringTest />
      <GSAPTest />
      <TeenjsTest />
    </div>
  )
}

const root = document.createElement('div')
document.body.appendChild(root)
ReactDOM.createRoot(root).render(<App />)
