import React, { useRef, useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'

function App() {
  const ref = useRef<HTMLDivElement>(null)
  ;(window as any).ref = ref
  const ref1 = useRef<HTMLDivElement>(null)

  const [elementState, setElementState] = useState({
    style: '',
    className: '',
  })
  const [elementState1, setElementState1] = useState({
    style1: '',
    className1: '',
  })

  const updateElementState = (
    ref: React.MutableRefObject<HTMLDivElement | null>,
  ) => {
    if (ref.current) {
      setElementState({
        style: ref.current.getAttribute('style') || 'None',
        className: ref.current.className || 'None',
      })
    }
  }
  const updateElementState1 = (
    ref: React.MutableRefObject<HTMLDivElement | null>,
  ) => {
    if (ref.current) {
      setElementState1({
        style1: ref.current.getAttribute('style') || 'None',
        className1: ref.current.className || 'None',
      })
    }
  }

  useEffect(() => {
    updateElementState(ref)
    updateElementState1(ref1)
  }, [ref, ref1])

  // Test BorderRadius
  // Store the value of borderRadius
  const [borderRadius, setBorderRadius] = useState(0)
  // Function to set borderRadius
  const SetBorderRadius = (
    ref: React.MutableRefObject<HTMLDivElement | null>,
    borderRadius: number,
  ) => {
    if (!ref.current) return
    // Get the current borderRadius value
    const currentBorderRadius =
      ref.current.style.getPropertyValue('border-radius')
    console.log('Get borderRadius value:', currentBorderRadius)
    ref.current.style.setProperty('border-radius', `${borderRadius}px`)
    console.log('Set borderRadius value:', borderRadius)
    // ref.current.style.setProperty('border-radius', `0px`) // Set to 0px
    updateElementState(ref)
  }
  // Event handler for slider value change
  const handleBorderRadiusChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    // Convert the slider value to an integer and update the borderRadius state
    setBorderRadius(parseInt(event.target.value, 10))
  }
  // Function to remove borderRadius
  const removeBorderRadius = () => {
    if (ref.current) {
      ref.current.style.removeProperty('border-radius')
      updateElementState(ref)
      // Reset the slider value
      setBorderRadius(0)
    }
  }

  // Test XrBack
  // Store the value of xrBack
  const [xrBack, setXrBack] = useState(0)
  // Function to set xrBack
  const SetXrBack = () => {
    if (!ref.current) return
    // Get the current --xr-back value
    const currentXrBack = ref.current.style.getPropertyValue('--xr-back')
    console.log('Get xrBack value:', currentXrBack)
    // Set the new --xr-back value
    ref.current.style.setProperty('--xr-back', `${xrBack}`) // Method 2
    console.log('Set xrBack value: ' + xrBack)
    updateElementState(ref)
  }
  // Event handler for slider value change
  const handleXrBackChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Convert the slider value to an integer and update the xrBack state
    setXrBack(parseInt(event.target.value, 10))
  }
  // Function to remove xrBack
  const removeXrBack = () => {
    if (ref.current) {
      ref.current.style.removeProperty('--xr-back')
      updateElementState(ref)
      setXrBack(0)
    }
  }

  // Test background-material
  // Store the value of backgroundMaterial
  const [backgroundMaterial, setBackgroundMaterial] = useState(' ') // Can directly modify the material for testing

  const handleBackgroundMaterialChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const selectedMaterial = event.target.value
    setBackgroundMaterial(selectedMaterial)
    if (!ref.current) return
    console.log('Selected', selectedMaterial)
    ref.current.style.setProperty('--xr-background-material', selectedMaterial)
    updateElementState(ref)
  }
  // Function to set backgroundMaterial
  const setBackgroundMaterialValue = (value: string) => {
    setBackgroundMaterial(value)
    if (!ref.current) return
    console.log('Selected', value)
    // Get the current backgroundMaterial value
    const currentBackgroundMaterial = ref.current.style.getPropertyValue(
      '--xr-background-material',
    )
    console.log('Get xrBack value:', currentBackgroundMaterial)
    ref.current.style.setProperty('--xr-background-material', value)
    updateElementState(ref)
  }

  // Function to remove backgroundMaterial
  const removeBackgroundMaterial = () => {
    if (ref.current) {
      ref.current.style.removeProperty('--xr-background-material')
      updateElementState(ref)
      // setBackgroundMaterialValue('default')
    }
  }
  // Test Transform
  // Store the values of translateX and rotateZ
  const [translateX, setTranslateX] = useState(0)
  const [rotateZ, setRotateZ] = useState(0)

  // Function to set Transform
  const testTransform = () => {
    if (!ref.current) return
    // console.log('testTransform:', ref.current, `translateX(${translateX}px) rotateZ(${rotateZ}deg)`)
    // Get the current testTransform value
    const currentTransform = ref.current.style.getPropertyValue('transform')
    console.log('Get transform value:', currentTransform)
    ref.current.style.transform = `translateX(${translateX}px) rotateZ(${rotateZ}deg)` // Method 1
    // ref.current.style.setProperty('transform', `translateX(${translateX}px) rotateZ(${rotateZ}deg)`,) // Method 2
    updateElementState(ref)
  }
  // Event handler for slider value change
  const handleTranslateXChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setTranslateX(parseInt(event.target.value, 10))
  }
  const handleRotateZChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRotateZ(parseInt(event.target.value, 10))
  }

  // Function to remove Transform
  const removeTestTransform = () => {
    if (ref.current) {
      ref.current.style.removeProperty('transform')
      // Get the current testTransform value
      const currentTransform = ref.current.style.getPropertyValue('transform')
      console.log('Get transform value:', currentTransform)
      updateElementState(ref)
      setTranslateX(0)
      setRotateZ(0)
    }
  }

  // Test transform-origin
  // Store the value of transformOrigin
  const [transformOrigin, setTransformOrigin] = useState('left top')

  // Event handler for dropdown value change
  const handleTransformOriginChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const selectedOrigin = event.target.value
    setTransformOrigin(selectedOrigin)
    if (!ref.current) return
    console.log('ref.current:', ref.current, selectedOrigin)
    // ref.current.style.transformOrigin = selectedOrigin // Method 1
    ref.current.style.setProperty('transform-Origin', `${selectedOrigin}`) // Method 2
    // ref.current.style.setProperty('transform-Origin', `left`)
    // Get the current TransformOrigin value
    const currentTransformOrigin =
      ref.current.style.getPropertyValue('transform-Origin')
    console.log('Get transform value:', currentTransformOrigin)
    updateElementState(ref)
  }
  // Function to remove TransformOrigin
  const removeTransformOrigin = () => {
    if (ref.current) {
      ref.current.style.removeProperty('Transform-Origin')
      // Get the current TransformOrigin value
      const currentTransformOrigin =
        ref.current.style.getPropertyValue('transform-Origin')
      console.log('Get transform value:', currentTransformOrigin)
      updateElementState(ref)
      setTransformOrigin('left center')
    }
  }
  // Test zIndex   // No effect on AVP, bug??
  // Store the value of zIndex
  const [zIndex, setZIndex] = useState(0)
  const [zIndex1, setZIndex1] = useState(0)

  // Function to set zIndex
  const setZIndexValue = () => {
    if (!ref.current) return
    console.log(zIndex, ref.current)
    // ref.current.style.zIndex = zIndex.toString() // Method 1
    ref.current.style.setProperty('z-Index', `${zIndex}`) // Method 2, technical documentation error
    // Get the current zIndex value
    const currentZIndex = ref.current.style.getPropertyValue('z-Index')
    console.log('Get zIndex:', currentZIndex)
    updateElementState(ref)
  }
  const handleZIndexChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setZIndex(parseInt(event.target.value, 10))
  }
  // Function to set zIndex1
  const setZIndexValue1 = () => {
    if (!ref1.current) return
    console.log(zIndex1, ref1.current)
    // ref1.current.style.setProperty('z-Index',`${zIndex1}`)
    ref1.current.style.zIndex = zIndex1.toString()
    updateElementState1(ref1)
  }
  const handleZIndex1Change = (event: React.ChangeEvent<HTMLInputElement>) => {
    setZIndex1(parseInt(event.target.value, 10))
  }

  // Function to remove zIndex
  const removeZIndex = () => {
    if (ref.current) {
      console.log('Remove zIndex', ref.current)
      ref.current.style.removeProperty('z-Index')
      updateElementState(ref)
    }
  }
  // Function to remove zIndex1
  const removeZIndex1 = () => {
    if (ref1.current) {
      console.log('Remove zIndex1', ref1.current)
      ref1.current.style.removeProperty('z-Index')
      updateElementState1(ref1)
    }
  }

  // Test class element operations
  const testClassOperations = () => {
    if (!ref.current) return
    // Read the class
    console.log('Current class:', ref.current.className)
    // ref.current.className =
    //   'test-element w-20 h-10 bg-white border-2 border-gray-200 rounded-lg '
    // console.log('Updated current class:', ref.current.className)
    // // ref.current.className = ' ' // After setting the element class name to an empty string, the text content color on the web and AVP is inconsistent, bug?
    // // console.log('Current class after updating to an empty string:', ref.current.className)
    // updateElementState(ref)

    // Automatically modify the class name
    setTimeout(() => {
      if (ref.current) {
        ref.current.className = ' '
        console.log('Get the updated current class:', ref.current.className)
        updateElementState(ref)
      }
      setTimeout(() => {
        if (ref.current) {
          ref.current.className =
            'w-32 h-32 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg text-white'
          console.log('Get the updated current class:', ref.current.className)
          updateElementState(ref)
        }
        setTimeout(() => {
          if (ref.current) {
            ref.current.className =
              'w-32 h-32 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white duration-300'
            console.log('Get the updated current class:', ref.current.className)
            updateElementState(ref)
          }
        }, 3000)
      }, 3000)
    }, 3000)
  }
  // Test single operation of the class list of the Test Element1 element
  const handleClassOperation = (operation: string) => {
    if (!ref1.current) return

    switch (operation) {
      case 'add':
        ref1.current.classList.add('translate-y-8')
        console.log(
          'Add translate-y-8 class:',
          ref1.current,
          ref1.current.classList.value,
        )
        break
      case 'remove':
        ref1.current.classList.remove('translate-y-8')
        console.log('Remove translate-y-8 class:', ref1.current.classList.value)
        break
      case 'replace':
        ref1.current.classList.replace('translate-y-8', 'translate-x-10')
        console.log(
          'Replace translate-y-10 with translate-y-8 class:',
          ref1.current.classList.value,
        )
        break
      case 'toggle':
        ref1.current.classList.toggle('translate-y-8')
        console.log('Toggle translate-y-8 class:', ref1.current.classList.value)
        break
      default:
        console.log('Invalid operation')
    }

    updateElementState(ref1)
  }

  const resetStyles = () => {
    if (!ref.current) return
    ref.current.removeAttribute('style')
    ref.current.removeAttribute('class')
    console.log('Remove Element classList:', ref.current.classList.value)
    ref.current.className =
      'test-element w-32 h-32 bg-gradient-to-r bg-opacity-15 bg-red-200/30  rounded-lg flex items-center justify-center text-white  duration-300'
    updateElementState(ref)
  }
  const resetStyles1 = () => {
    if (!ref1.current) return
    ref1.current.removeAttribute('style')
    // ref1.current.classList.remove('translate-y-8')
    ref1.current.removeAttribute('class')
    console.log('Remove Element1 classList:', ref1.current.classList.value)
    ref1.current.className =
      'test-element w-32 h-32 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white duration-300'
    updateElementState(ref1)
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      {/* Navigation bar */}
      <div className="flex text-white text-lg bg-black bg-opacity-25 p-4 gap-5 mb-4">
        <a
          href="#"
          onClick={() => history.go(-1)}
          className="hover:text-blue-400 transition-colors"
        >
          Go Back
        </a>
      </div>

      <div className="max-w-5xl mx-auto space-y-4">
        <div className="bg-gray-800 p-4 rounded-lg min-h-[200px] flex items-center justify-center">
          <div
            id="father"
            className="flex"
            style={{
              backgroundColor: 'rgba(173, 216, 230, 0.2)',
              padding: '30px',
            }}
          >
            <div
              enable-xr
              className="test-element w-32 h-32  bg-gradient-to-r bg-opacity-15 bg-red-200/30 rounded-lg flex items-center justify-center text-white  duration-300"
              // style={{
              //   color: 'blue',
              //   fontSize: '24px',
              //   margin: '25px',
              //   boxShadow: '2px 2px 5px rgba(0, 0, 0, 0.3)',
              //   position: 'relative',
              // }} // Test common property values
              style={{ position: 'relative' }}
              ref={ref}
            >
              Test Element
            </div>
            <div
              enable-xr
              className="test-element w-32 h-32 bg-pink-500 hover:bg-pink-500 rounded-lg flex items-center justify-center text-white duration-300"
              // style={{ color: 'blue' }} // Test style priority
              // className="text-red-500" // Test style priority
              ref={ref1}
            >
              Test Element1
            </div>
          </div>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="grid grid-cols-2 gap-2">
            {/* Render BorderRadius */}
            <button
              onClick={() => SetBorderRadius(ref, borderRadius)}
              className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Border Radius
            </button>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="range"
                min="0"
                max="100"
                value={borderRadius}
                onChange={handleBorderRadiusChange}
                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                style={{ width: '250px' }}
              />
              <span className="ml-1.5 text-red-500">{borderRadius}px</span>
              <button
                onClick={removeBorderRadius}
                className="p-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                style={{ width: '100px', marginLeft: '10px' }}
              >
                Remove
              </button>
            </div>
            {/* Render XrBack */}
            <button
              onClick={SetXrBack}
              className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Xr Back
            </button>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="range"
                min="-150"
                max="900"
                value={xrBack}
                onChange={handleXrBackChange}
                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                style={{ width: '250px' }}
              />
              <span className="ml-1.5 text-red-500">{xrBack}px</span>
              <button
                onClick={removeXrBack}
                className="p-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                style={{ width: '100px', marginLeft: '10px' }}
              >
                Remove
              </button>
            </div>
            {/* Render background-material */}
            <button
              onClick={() => setBackgroundMaterialValue(backgroundMaterial)}
              className="p-2 bg-pink-500 hover:bg-pink-500 text-white rounded-lg transition-colors"
              style={{ flex: 1, marginRight: '10px' }}
            >
              Material
            </button>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <select
                id="backgroundMaterialSelect"
                value={backgroundMaterial}
                onChange={handleBackgroundMaterialChange}
                className="p-2  bg-purple-50 text-black rounded-lg transition-colors"
                style={{ flex: 1 }}
              >
                <option value="default">Default</option>
                <option value="none">None</option>
                <option value="thin">Thin</option>
                <option value="regular">Regular</option>
                <option value="thick">Thick</option>
              </select>
              <button
                onClick={removeBackgroundMaterial}
                className="p-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                style={{ width: '100px', marginLeft: '10px' }}
              >
                Remove
              </button>
            </div>
            {/* Render Transform */}
            <button
              onClick={testTransform}
              className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              Transform Test
            </button>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="range"
                min="-50"
                max="50"
                value={translateX}
                onChange={handleTranslateXChange}
                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                style={{ width: '250px' }}
              />
              <span className="ml-1.5 text-red-500">{translateX}px</span>
              <input
                type="range"
                min="-100"
                max="100"
                value={rotateZ}
                onChange={handleRotateZChange}
                className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                style={{ width: '250px' }}
              />
              <span className="ml-1 text-red-500">{rotateZ}deg</span>
              <button
                onClick={removeTestTransform}
                className="p-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                // style={{ width: '100px', marginLeft: '10px' }}
              >
                Remove
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {/* Render transformOrigin */}
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <select
                  className="p-2  bg-purple-50 text-black rounded-lg transition-colors"
                  style={{ flex: 1, width: '250px' }}
                  value={transformOrigin}
                  onChange={handleTransformOriginChange}
                >
                  <option value="left top">
                    Top left of the element: left top
                  </option>
                  <option value="left center">
                    Left center of the element: left center
                  </option>
                  <option value="left bottom">
                    Bottom left of the element: left bottom
                  </option>
                  <option value="center top">
                    Top center of the element: center top
                  </option>
                  <option value="right center">
                    Right center of the element: right center
                  </option>
                  <option value="right bottom">
                    Bottom right of the element: right bottom
                  </option>
                  <option value="50% 50%">
                    Center of the element: 50% 50%
                  </option>
                  <option value="0% 0%">Top left of the element: 0% 0%</option>
                </select>
                <button
                  onClick={removeTransformOrigin}
                  className="p-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  style={{ width: '100px', marginLeft: '10px' }}
                >
                  Remove
                </button>
              </div>
            </div>
            {/* Render zIndex */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={setZIndexValue}
                className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                ZIndex Element
              </button>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <input
                  type="range"
                  min="-10"
                  max="10"
                  value={zIndex}
                  onChange={handleZIndexChange}
                  className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  style={{ width: '250px' }}
                />
                <span className="ml-1.5 text-red-500">{zIndex}px</span>
                <button
                  onClick={removeZIndex}
                  className="p-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  style={{ width: '100px', marginLeft: '10px' }}
                >
                  Remove
                </button>
              </div>
              <button
                onClick={setZIndexValue1}
                className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                ZIndex Element1
              </button>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <input
                  type="range"
                  min="-10"
                  max="10"
                  value={zIndex1}
                  onChange={handleZIndex1Change}
                  className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  style={{ width: '250px' }}
                />
                <span className="ml-1.5 text-red-500">{zIndex1}px</span>
                <button
                  onClick={removeZIndex1}
                  className="p-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  style={{ width: '100px', marginLeft: '10px' }}
                >
                  Remove
                </button>
              </div>
            </div>

            {/* Render Class Operations */}
            <button
              onClick={testClassOperations}
              className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              Class Name Test
            </button>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <select
                className="p-2  bg-purple-50 text-black rounded-lg transition-colors"
                style={{ flex: 1, width: '250px' }}
                onChange={e => handleClassOperation(e.target.value)}
              >
                <option value="">Class List Test - Select an operation</option>
                <option value="add">Add class name</option>
                <option value="remove">Remove class name</option>
                <option value="replace">Replace class name</option>
                <option value="toggle">Toggle class name</option>
              </select>
            </div>
            <button
              onClick={resetStyles}
              className="p-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors col-span-2"
            >
              Reset Element
            </button>
            <button
              onClick={resetStyles1}
              className="p-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors col-span-2"
            >
              Reset Element1
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
          <pre className="text-sm text-gray-300 whitespace-pre-wrap">
            {ref1.current
              ? `Style: ${elementState1.style1}
Class Name: ${elementState1.className1}`
              : 'Element Not Loaded'}
          </pre>
        </div>
      </div>
    </div>
  )
}

const root = document.createElement('div')
document.body.appendChild(root)
ReactDOM.createRoot(root).render(<App />)
