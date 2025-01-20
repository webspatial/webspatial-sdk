import React, { useRef, useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { transform } from 'esbuild'

function App() {
  const ref = useRef<HTMLDivElement>(null)
  const ref1 = useRef<HTMLDivElement>(null)

  const [elementState, setElementState] = useState({
    style: '',
    className: '',
  })
  const [elementState1, setElementState1] = useState({
    style: '',
    className: '',
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

  useEffect(() => {
    updateElementState(ref)
    updateElementState(ref1)
  }, [ref, ref1])

  const styleOne = {
    '--xr-back': 10,
    position: 'relative',
    width: '200px',
    height: '78px',

    backgroundColor: 'red',
  }

  const styleTwo = {
    '--xr-back': 10,
    backgroundColor: 'blue',
    position: 'relative',
    left: 0,
    zIndex: 11,
  }

  const styleThree = {
    '--xr-back': 10,
    backgroundColor: 'green',
    position: 'relative',
    left: 0,
    zIndex: 3,
  }
  const resetStyles = () => {
    if (!ref.current) return
    ref.current.removeAttribute('style')
    // ref.current.className =
    //   'test-element w-32 h-32 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white duration-300'
    updateElementState(ref)
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4">
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
        <div className="bg-gray-800 p-4 rounded-lg min-h-[200px] flex items-center justify-center">
          <div enable-xr style={styleOne}>
            one
            <div enable-xr style={styleTwo}>
              two
              <div enable-xr style={styleThree}>
                three
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="grid grid-cols-2 gap-2">
            {/*<button*/}
            {/*  onClick={testPositionInlineStyles}*/}
            {/*  className="p-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"*/}
            {/*>*/}
            {/*  Dimension Style Test*/}
            {/*</button>*/}
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
          <pre className="text-sm text-gray-300 whitespace-pre-wrap">
            {ref1.current
              ? `Style: ${elementState1.style}
Class Name: ${elementState1.className}`
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
