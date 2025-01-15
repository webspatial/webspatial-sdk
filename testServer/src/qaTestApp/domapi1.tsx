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

  // const updateElementState = (ref: React.MutableRefObject<HTMLDivElement | null>, setElementState: React.Dispatch<React.SetStateAction<{ style: string; className: string }>>) => {
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
  }, [ref.current, ref1.current])

  // 测试BorderRadius
  // 存储 borderRadius 的值
  const [borderRadius, setBorderRadius] = useState(0)
  // 设置 borderRadius 的函数
  const SetBorderRadius = (
    ref: React.MutableRefObject<HTMLDivElement | null>,
    borderRadius: number,
  ) => {
    console.log('borderRadius:' + borderRadius, ref.current)
    if (!ref.current) return
    ref.current.style.setProperty('border-radius', `${borderRadius}px`)
    updateElementState(ref)
  }
  // 处理滑动条值变化的事件处理函数
  const handleBorderRadiusChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    // 将滑动条的值转换为整数并更新 borderRadius 状态
    setBorderRadius(parseInt(event.target.value, 10))
  }
  // 移除 borderRadius 的函数
  const removeBorderRadius = () => {
    if (ref.current) {
      ref.current.style.removeProperty('border-radius')
      updateElementState(ref)
    }
  }

  // 测试XrBack
  // 存储 xrBack 的值
  const [xrBack, setXrBack] = useState(0)
  // 设置 xrBack 的函数
  const SetXrBack = () => {
    if (!ref.current) return
    console.log('xrBack: ' + xrBack)
    // ref.current.style['--xr-back'] = `${xrBack}`; //方式1
    ref.current.style.setProperty('--xr-back', `${xrBack}`) //方式2
    updateElementState(ref)
  }
  // 处理滑动条值变化的事件处理函数
  const handleXrBackChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // 将滑动条的值转换为整数并更新 xrBack 状态
    setXrBack(parseInt(event.target.value, 10))
  }
  // 移除 xrBack 的函数
  const removeXrBack = () => {
    if (ref.current) {
      ref.current.style.removeProperty('--xr-back')
      updateElementState(ref)
    }
  }

  // 测试 background-material
  // 存储 backgroundMaterial 的值
  const [backgroundMaterial, setBackgroundMaterial] = useState('default') // 可以直接修改material

  const handleBackgroundMaterialChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const selectedMaterial = event.target.value
    setBackgroundMaterial(selectedMaterial)
    if (!ref.current) return
    console.log('selected', selectedMaterial)
    ref.current.style.setProperty('--xr-background-material', selectedMaterial)
    updateElementState(ref)
  }
  // 设置 backgroundMaterial 的函数
  const setBackgroundMaterialValue = (value: string) => {
    setBackgroundMaterial(value)
    if (!ref.current) return
    console.log('selected', value)
    ref.current.style.setProperty('--xr-background-material', value)
    updateElementState(ref)
  }

  // 测试 testTransform
  // 存储 translateX 和 rotateZ 的值
  const [translateX, setTranslateX] = useState(0)
  const [rotateZ, setRotateZ] = useState(0)
  // 处理滑动条值变化的事件处理函数
  const handleTranslateXChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setTranslateX(parseInt(event.target.value, 10))
  }
  const handleRotateZChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRotateZ(parseInt(event.target.value, 10))
  }
  // 设置 testTransform 的函数
  const testTransform = () => {
    if (!ref.current) return
    ref.current.style.transform = `translateX(${translateX}px) rotateZ(${rotateZ}deg)`
    updateElementState(ref)
  }

  //  测试transform-origin
  // 存储 transformOrigin 的值
  const [transformOrigin, setTransformOrigin] = useState('left top')

  // 处理下拉框值变化的事件处理函数
  const handleTransformOriginChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const selectedOrigin = event.target.value
    setTransformOrigin(selectedOrigin)
    if (!ref.current) return
    console.log('ref.current:', ref.current)
    ref.current.style.transformOrigin = selectedOrigin
    updateElementState(ref)
  }

  // 测试zIndex
  // 存储 zIndex 的值
  const [zIndex, setZIndex] = useState(0)
  const [zIndex1, setZIndex1] = useState(0)

  // 设置 zIndex 的函数
  const setZIndexValue = () => {
    if (!ref.current) return
    console.log(zIndex, ref.current)
    // ref.current.style.setProperty('zIndex',`${zIndex}`)
    // ref.current.style['zIndex'] = '70'
    ref.current.style.zIndex = zIndex.toString()
    updateElementState(ref)
  }
  const handleZIndexChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setZIndex(parseInt(event.target.value, 10))
  }
  // 设置 zIndex1 的函数
  const setZIndexValue1 = () => {
    if (!ref1.current) return
    console.log(zIndex1, ref1.current)
    // ref.current.style.setProperty('zIndex',`${zIndex1}`)
    ref1.current.style.zIndex = zIndex1.toString()
    updateElementState(ref1)
  }
  const handleZIndex1Change = (event: React.ChangeEvent<HTMLInputElement>) => {
    setZIndex1(parseInt(event.target.value, 10))
  }

  // 移除 zIndex 的函数
  const removeZIndex = () => {
    if (ref.current) {
      console.log('removeZIndex', ref.current)
      ref.current.style.removeProperty('zIndex')
      updateElementState(ref)
    }
  } //mabye bug??
  // 移除 zIndex1 的函数
  const removeZIndex1 = () => {
    if (ref.current) {
      console.log('removeZIndex1', ref.current)
      ref.current.style.removeProperty('zIndex')
      updateElementState(ref1)
    }
  } //mabye bug??

  // 测试class操作
  const testClassOperations = () => {
    if (!ref.current) return
    ref.current.className =
      'test-element w-32 h-32 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white transition-all duration-300 classA classB'
    updateElementState(ref)
    ref.current.classList.add('translate-y-8')
    updateElementState(ref)

    setTimeout(() => {
      if (ref.current) {
        ref.current.classList.remove('translate-y-8')
        updateElementState(ref)
      }
      setTimeout(() => {
        if (ref.current) {
          ref.current.classList.add('translate-y-8')
          ref.current.classList.replace('translate-y-8', 'translate-x-8')
          updateElementState(ref)
        }
        setTimeout(() => {
          if (ref.current) {
            ref.current.classList.toggle('translate-y-8')
            updateElementState(ref)
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
    updateElementState(ref)
  }

  const resetStyles = () => {
    if (!ref.current) return
    ref.current.removeAttribute('style')
    ref.current.className =
      'test-element w-32 h-32 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white transition-all duration-300'
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
          <div
            enable-xr
            ref={ref}
            className="test-element w-32 h-32 bg-gradient-to-r bg-opacity-15 bg-red-200/30  rounded-lg flex items-center justify-center text-white transition-all duration-300"
          >
            Test Element
          </div>
          <div
            enable-xr
            ref={ref1}
            className="test-element w-32 h-32 bg-gradient-to-r bg-opacity-15 bg-blue-200/30  rounded-lg flex items-center justify-center text-white transition-all duration-300"
          >
            Test Element1
          </div>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="grid grid-cols-2 gap-2">
            {/*渲染BorderRadius*/}
            <button
              onClick={() => SetBorderRadius(ref, borderRadius)}
              className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Border Radius
            </button>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="range"
                min="-1"
                max="9999"
                value={borderRadius}
                onChange={handleBorderRadiusChange}
                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                style={{ width: '250px' }}
              />
              <button
                onClick={removeBorderRadius}
                className="p-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                style={{ width: '100px', marginLeft: '10px' }}
              >
                remove
              </button>
            </div>
            {/*渲染XrBack*/}
            <button
              onClick={SetXrBack}
              className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Xr Back
            </button>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="range"
                min="0"
                max="100"
                value={xrBack}
                onChange={handleXrBackChange}
                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                style={{ width: '250px' }}
              />
              <button
                onClick={removeXrBack}
                className="p-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                style={{ width: '100px', marginLeft: '10px' }}
              >
                remove
              </button>
            </div>
            {/* 渲染 background-material */}
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
                <option value="default">default</option>
                <option value="none">none</option>
                <option value="thin">thin</option>
                <option value="regular">regular</option>
                <option value="thick">thick</option>
              </select>
            </div>
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
                min="-100"
                max="100"
                value={translateX}
                onChange={handleTranslateXChange}
                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                style={{ width: '250px' }}
              />
              <span className="ml-1.5 text-red-500">{translateX}px</span>
              <input
                type="range"
                min="-180"
                max="180"
                value={rotateZ}
                onChange={handleRotateZChange}
                className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                style={{ width: '250px' }}
              />
              <span className="ml-1 text-red-500">{rotateZ}deg</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {/* 渲染 transformOrigin */}
              <button
                onClick={() => setTransformOrigin(transformOrigin)}
                className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                Transform Origin
              </button>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <select
                  className="p-2  bg-purple-50 text-black rounded-lg transition-colors"
                  style={{ flex: 1 }}
                  value={transformOrigin}
                  onChange={handleTransformOriginChange}
                >
                  <option value="left top">left top</option>
                  <option value="left center">left center</option>
                  <option value="left bottom">left bottom</option>
                  <option value="center top">center top</option>
                  <option value="center center">center center</option>
                  <option value="center bottom">center bottom</option>
                  <option value="right top">right top</option>
                  <option value="right center">right center</option>
                  <option value="right bottom">right bottom</option>
                  <option value="-50% -50%">自定义 (-50% -50%)</option>
                  <option value="-100% -100%">自定义 (-100% -100%)</option>
                  {/* 添加更多自定义选项 */}
                </select>
              </div>
            </div>
            {/* 渲染zIndex */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={setZIndexValue}
                className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                ZIndex for Element
              </button>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={zIndex}
                  onChange={handleZIndexChange}
                  className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  style={{ width: '250px' }}
                />
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
                ZIndex for Element1
              </button>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={zIndex1}
                  onChange={handleZIndex1Change}
                  className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  style={{ width: '250px' }}
                />
                <button
                  onClick={removeZIndex1}
                  className="p-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  style={{ width: '100px', marginLeft: '10px' }}
                >
                  remove
                </button>
              </div>
            </div>
            {/* 渲染Class Operations */}
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
