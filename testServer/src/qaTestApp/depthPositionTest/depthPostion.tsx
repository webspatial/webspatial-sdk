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

  const containerStyle = {
    '--xr-back': 10,
    position: 'relative',
    // position: 'absolute',
    width: '500px',
    height: '300px',
    backgroundColor: 'rgba(173, 216, 230, 0.2)',
    border: '1px solid red',
    margin: '50px auto',
  }

  const styleOne = {
    '--xr-back': 30,
    position: 'absolute', //绝对定位（相对已定位的祖先元素定位）
    // position: 'relative', //相对定位（相对其正常位置偏移）
    // position: 'static',  //html顺序布局
    // position: 'fixed',  //相对浏览器窗口定位
    width: '200px',
    height: '78px',
    // top: '-25px',
    right: '100px',
    // bottom: '50px',
    backgroundColor: 'red',
    // border: '1px solid red',
    zIndex: 11,
  }

  const referenceStyle = {
    '--xr-back': 30,
    position: 'absolute',
    // position: 'relative',
    width: '100px',
    height: '100px',
    backgroundColor: 'green',
    // top: '50px',
    // left: '50px',
    zIndex: 13,
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
        {/*<div enable-xr style={containerStyle}>*/}
        {/*  <div enable-xr style={referenceStyle}>*/}
        {/*    参考元素*/}
        {/*  </div>*/}
        {/*  <div enable-xr style={styleOne} ref={ref}>*/}
        {/*    one*/}
        {/*  </div>*/}
        {/*替换为css类*/}
        <div enable-xr className="container">
          <div enable-xr className="reference">
            参考元素
          </div>
          <div enable-xr className="style-one" ref={ref}>
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
