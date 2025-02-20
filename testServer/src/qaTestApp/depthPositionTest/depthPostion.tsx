// @ts-nocheck
import React, { useRef, useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'

function App() {
  const ref = useRef<HTMLDivElement>(null)
  const [elementState, setElementState] = useState({
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
  }, [ref])

  const styleOne = {
    position: 'absolute',
    width: '200px',
    height: '78px',
    top: '-5px',
    backgroundColor: 'red',
  }

  const containerStyle = {
    position: 'relative',
    width: '500px',
    height: '300px',
    backgroundColor: 'rgba(173, 216, 230, 0.2)',
    border: '1px solid black',
    margin: '50px auto',
  }

  const referenceStyle = {
    position: 'absolute',
    width: '100px',
    height: '100px',
    backgroundColor: 'green',
    top: '50px',
    left: '50px',
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
          onClick={() => window.history.go(-1)}
          className="hover:text-blue-400 transition-colors"
        >
          返回上一级
        </a>
      </div>

      <div className="max-w-3xl mx-auto space-y-4">
        <div style={containerStyle}>
          <div style={referenceStyle}>参考元素</div>
          <div enable-xr style={styleOne} ref={ref}>
            one
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
