// @ts-nocheck
import React, { useRef, useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { enableDebugTool } from '@xrsdk/react'

enableDebugTool()

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

  // 测试zIndex   //AVP上没有效果 bug??
  // 存储 zIndex 的值
  const [zIndex, setZIndex] = useState(0)
  const [zIndex1, setZIndex1] = useState(0)

  // 设置 zIndex 的函数
  const setZIndexValue = () => {
    if (!ref.current) return
    console.log(zIndex, ref.current)
    // ref.current.style.zIndex = zIndex.toString() //方式1
    ref.current.style.setProperty('z-Index', `${zIndex}`) //方式2 技术文档错误
    // 获取当前的 zIndex 值
    const currentZIndex = ref.current.style.getPropertyValue('z-Index')
    console.log('get zIndex:', currentZIndex)
    updateElementState(ref)
  }
  const handleZIndexChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setZIndex(parseInt(event.target.value, 10))
  }
  // 设置 zIndex1 的函数
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

  // 移除 zIndex 的函数
  const removeZIndex = () => {
    if (ref.current) {
      console.log('removeZIndex', ref.current)
      ref.current.style.removeProperty('z-Index')
      updateElementState(ref)
    }
  }
  // 移除 zIndex1 的函数
  const removeZIndex1 = () => {
    if (ref1.current) {
      console.log('removeZIndex1', ref1.current)
      ref1.current.style.removeProperty('z-Index')
      updateElementState1(ref1)
    }
  }

  // 设置 Transform
  // 存储 translateX 和 rotateZ 的值
  const [translateX, setTranslateX] = useState(0)
  const [rotateZ, setRotateZ] = useState(0)

  // 设置 Transform 的函数
  const testTransform = () => {
    if (!ref.current) return
    // console.log('testTransform:', ref.current, `translateX(${translateX}px) rotateZ(${rotateZ}deg)`)
    // 获取当前的 testTransform 值
    const currentTransform = ref.current.style.getPropertyValue('transform')
    console.log('get transform value:', currentTransform)
    ref.current.style.transform = `translateX(${translateX}px) rotateZ(${rotateZ}deg)` //方式1
    // ref.current.style.setProperty('transform', `translateX(${translateX}px) rotateZ(${rotateZ}deg)`,) //方式2
    updateElementState(ref)
  }
  // 处理滑动条值变化的事件处理函数
  const handleTranslateXChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setTranslateX(parseInt(event.target.value, 10))
  }
  const handleRotateZChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRotateZ(parseInt(event.target.value, 10))
  }

  // 移除 Transform 的函数
  const removeTestTransform = () => {
    if (ref.current) {
      ref.current.style.removeProperty('transform')
      // 获取当前的 testTransform 值
      const currentTransform = ref.current.style.getPropertyValue('transform')
      console.log('get transform value:', currentTransform)
      updateElementState(ref)
      setTranslateX(0)
      setRotateZ(0)
    }
  }
  const [position_container, setPosition1] = useState('') // 初始位置为相对定位
  const handlePositionChangeContainer = (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    setPosition1(e.target.value)
    console.log('position_container:', position_container)
  }
  const [position_reference, setPosition3] = useState('') // 初始位置为相对定位
  const handlePositionChangeReference = (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    setPosition3(e.target.value)
    console.log('position_reference:', position_reference, ref.current)
  }
  const [position_styleOne, setPosition2] = useState('') // 初始位置为相对定位
  const handlePositionChangeStyleOne = (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    setPosition2(e.target.value)
    console.log('position_styleOne:', position_styleOne, ref1.current)
  }

  const containerStyle = {
    '--xr-back': 50,
    position: position_container,
    width: '500px',
    height: '300px',
    backgroundColor: 'rgba(173, 216, 230, 0.2)',
    border: '1px solid red',
    margin: '50px auto',
  }

  const referenceStyle = {
    '--xr-back': 40,
    position: position_reference,
    width: '100px',
    height: '100px',
    backgroundColor: 'green',
  }

  const styleOne = {
    '--xr-back': 20,
    position: position_styleOne,
    width: '200px',
    height: '78px',
    right: '100px',
    backgroundColor: 'red',
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

      <div className="max-w-5xl mx-auto space-y-4">
        <div className="bg-gray-800 p-4 rounded-lg min-h-[200px] flex items-center justify-center">
          <div
            id="father"
            enable-xr
            // className="container" // 测试 CSS Classes
            style={containerStyle} // 测试 Inline Styles
          >
            <div
              enable-xr
              // className="reference" // 测试 CSS Classes
              style={referenceStyle} // 测试 Inline Styles
              ref={ref}
            >
              Test Element
            </div>
            <div
              enable-xr
              // className="style-one" //  测试 CSS Classes
              style={styleOne} // 测试 Inline Styles
              ref={ref1}
            >
              Test Element1
            </div>
          </div>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg">
          <select
            className="p-4  bg-purple-50 text-black rounded-lg transition-colors"
            value={position_container}
            onChange={handlePositionChangeContainer}
          >
            <option value="">父元素position：none</option>
            <option value="relative">父元素position：相对定位</option>
            <option value="absolute">父元素position：绝对定位</option>
          </select>
          <select
            className="p-4  bg-purple-50 text-black rounded-lg transition-colors"
            value={position_reference}
            onChange={handlePositionChangeReference}
          >
            <option value="">子Element position：none</option>
            <option value="relative">子Element position：相对定位</option>
            <option value="absolute">子Element position：绝对定位</option>
          </select>
          <select
            className="p-4  bg-purple-50 text-black rounded-lg transition-colors"
            value={position_styleOne}
            onChange={handlePositionChangeStyleOne}
          >
            <option value="">子Element1 position：none</option>
            <option value="relative">子Element1 position:相对定位</option>
            <option value="absolute">子Element1 position：绝对定位</option>
          </select>
          <div className="grid grid-cols-2 gap-2">
            {/* 渲染zIndex */}
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
                  remove
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
                  remove
                </button>
              </div>
            </div>
            <div className="w-4"></div>
            {/* 渲染Transform */}
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
                max="200"
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
                remove
              </button>
            </div>
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
