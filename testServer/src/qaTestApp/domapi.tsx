// @ts-nocheck
import React, { useRef, useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'

function App() {
  const ref = useRef<HTMLDivElement>(null)
  const [elementState, setElementState] = useState({
    style: '',
    className: '',
  })

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

  const testBasicStyles = () => {
    if (!ref.current) return
    ref.current.style.borderRadius = '100'
    ;(ref.current.style as any)['--xr-background-material'] = 'default' // maybe bug
    ;(ref.current.style as any)['--xr-back'] = '100' // not work？maybe bug
    updateElementState()
  }

  const testTransform = () => {
    if (!ref.current) return
    ref.current.style.transform = 'translateX(40px) rotateZ(30deg)'
    ref.current.style.transformOrigin = 'left center'
    ref.current.style.zIndex = '10'
    updateElementState()
  }

  const testClassOperations = () => {
    if (!ref.current) return
    ref.current.className =
      'test-element w-32 h-32 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white transition-all duration-300 classA classB'
    updateElementState()
    ref.current.classList.add('translate-y-8')
    updateElementState()

    setTimeout(() => {
      if (ref.current) {
        ref.current.classList.remove('translate-y-8')
        updateElementState()
      }
      setTimeout(() => {
        if (ref.current) {
          ref.current.classList.add('translate-y-8')
          ref.current.classList.replace('translate-y-8', 'translate-x-8')
          updateElementState()
        }
        setTimeout(() => {
          if (ref.current) {
            ref.current.classList.toggle('translate-y-8')
            updateElementState()
          }
        }, 1000)
      }, 1000)
    }, 1000)
  }

  const testDimensionStyles = () => {
    if (!ref.current) return
    ref.current.style.fontSize = '2rem'
    ref.current.style.width = '200px'
    ref.current.style.height = '200px'
    updateElementState()
  }

  const resetStyles = () => {
    if (!ref.current) return
    ref.current.removeAttribute('style')
    ref.current.className =
      'test-element w-32 h-32 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white transition-all duration-300'
    updateElementState()
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="flex text-white text-lg bg-black bg-opacity-25 p-4 gap-5 mb-4">
        <a href="/" className="hover:text-blue-400 transition-colors">
          Return to Home Page
        </a>
        <a
          href="#"
          onClick={() => history.go(-1)}
          className="hover:text-blue-400 transition-colors"
        >
          Go Back
        </a>
      </div>

      <div className="max-w-3xl mx-auto space-y-4">
        <div className="bg-gray-800 p-4 rounded-lg min-h-[200px] flex items-center justify-center">
          <div
            enable-xr
            ref={ref}
            className="test-element w-32 h-32 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white transition-all duration-300"
          >
            Test Element
          </div>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={testBasicStyles}
              className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Basic Style Test
            </button>
            <button
              onClick={testTransform}
              className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              Transform Test
            </button>
            <button
              onClick={testClassOperations}
              className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              Class Operations Test
            </button>
            <button
              onClick={testDimensionStyles}
              className="p-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
            >
              Dimension Style Test
            </button>
            <button
              onClick={resetStyles}
              className="p-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors col-span-2"
            >
              Reset Styles
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
      </div>
    </div>
  )
}

const root = document.createElement('div')
document.body.appendChild(root)
ReactDOM.createRoot(root).render(<App />)
