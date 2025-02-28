import React, { useRef, useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { enableDebugTool } from '@webspatial/react-sdk'

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

  // 测试BorderRadius
  // 存储 borderRadius 的值
  const [borderRadius, setBorderRadius] = useState(0)
  // 设置 borderRadius 的函数
  const SetBorderRadius = (
    ref: React.MutableRefObject<HTMLDivElement | null>,
    borderRadius: number,
  ) => {
    if (!ref.current) return
    // 获取当前的 borderRadius 值
    const currentBorderRadius =
      ref.current.style.getPropertyValue('border-radius')
    console.log('get borderRadius value:', currentBorderRadius)
    ref.current.style.setProperty('border-radius', `${borderRadius}px`)
    console.log('set borderRadius value:', borderRadius)
    // ref.current.style.setProperty('border-radius', `0px`) //设置为0px
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
      // 重置滑动条值
      setBorderRadius(0)
    }
  }

  // 测试XrBack
  // 存储 xrBack 的值
  const [xrBack, setXrBack] = useState(0)
  // 设置 xrBack 的函数
  const SetXrBack = () => {
    if (!ref.current) return
    // 获取当前的 --xr-back 值
    const currentXrBack = ref.current.style.getPropertyValue('--xr-back')
    console.log('get xrBack value:', currentXrBack)
    // 设置新的 --xr-back 值
    ref.current.style.setProperty('--xr-back', `${xrBack}`) //方式2
    console.log('set xrBack value: ' + xrBack)
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
      setXrBack(0)
    }
  }

  // 测试 background-material
  // 存储 backgroundMaterial 的值
  const [backgroundMaterial, setBackgroundMaterial] = useState(' ') // 测试使用可以直接修改material

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
    // 获取当前的 backgroundMaterial 值
    const currentBackgroundMaterial = ref.current.style.getPropertyValue(
      '--xr-background-material',
    )
    console.log('get xrBack value:', currentBackgroundMaterial)
    ref.current.style.setProperty('--xr-background-material', value)
    updateElementState(ref)
  }

  // 移除 backgroundMaterial 的函数
  const removeBackgroundMaterial = () => {
    if (ref.current) {
      ref.current.style.removeProperty('--xr-background-material')
      updateElementState(ref)
      // setBackgroundMaterialValue('default')
    }
  }
  // 测试 Transform
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
    console.log('ref.current:', ref.current, selectedOrigin)
    // ref.current.style.transformOrigin = selectedOrigin //方式1
    ref.current.style.setProperty('transform-Origin', `${selectedOrigin}`) //方式2
    // ref.current.style.setProperty('transform-Origin', `left`)
    // 获取当前的 TransformOrigin 值
    const currentTransformOrigin =
      ref.current.style.getPropertyValue('transform-Origin')
    console.log('get transform value:', currentTransformOrigin)
    updateElementState(ref)
  }
  // 移除 TransformOrigin 的函数
  const removeTransformOrigin = () => {
    if (ref.current) {
      ref.current.style.removeProperty('Transform-Origin')
      // 获取当前的 TransformOrigin 值
      const currentTransformOrigin =
        ref.current.style.getPropertyValue('transform-Origin')
      console.log('get transform value:', currentTransformOrigin)
      updateElementState(ref)
      setTransformOrigin('left center')
    }
  }
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

  // 测试class元素操作
  const testClassOperations = () => {
    if (!ref.current) return
    // 读取class
    console.log('当前class:', ref.current.className)
    // ref.current.className =
    //   'test-element w-20 h-10 bg-white border-2 border-gray-200 rounded-lg '
    // console.log('更新后当前class:', ref.current.className)
    // // ref.current.className = ' ' //元素class name 设为空字符串后，web端与avp文本内容颜色不一致，bug？
    // // console.log('更新为空字符串后 当前class:', ref.current.className)
    // updateElementState(ref)

    // 自动修改class name
    setTimeout(() => {
      if (ref.current) {
        ref.current.className = ' '
        console.log('获取更新后当前class:', ref.current.className)
        updateElementState(ref)
      }
      setTimeout(() => {
        if (ref.current) {
          ref.current.className =
            'w-32 h-32 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg text-white'
          console.log('获取更新后当前class:', ref.current.className)
          updateElementState(ref)
        }
        setTimeout(() => {
          if (ref.current) {
            ref.current.className =
              'w-32 h-32 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white duration-300'
            console.log('获取更新后当前class:', ref.current.className)
            updateElementState(ref)
          }
        }, 3000)
      }, 3000)
    }, 3000)
  }
  // 测试Test Element1 元素clas list单个操作
  const handleClassOperation = (operation: string) => {
    if (!ref1.current) return

    switch (operation) {
      case 'add':
        ref1.current.classList.add('translate-y-8')
        console.log(
          '添加translate-y-8 class:',
          ref1.current,
          ref1.current.classList.value,
        )
        break
      case 'remove':
        ref1.current.classList.remove('translate-y-8')
        console.log('移除translate-y-8 class:', ref1.current.classList.value)
        break
      case 'replace':
        ref1.current.classList.replace('translate-y-8', 'translate-x-10')
        console.log(
          '替换translate-y-10 with translate-y-8 class:',
          ref1.current.classList.value,
        )
        break
      case 'toggle':
        ref1.current.classList.toggle('translate-y-8')
        console.log('反转translate-y-8 class:', ref1.current.classList.value)
        break
      default:
        console.log('无效的操作')
    }

    updateElementState(ref1)
  }

  const resetStyles = () => {
    if (!ref.current) return
    ref.current.removeAttribute('style')
    ref.current.removeAttribute('class')
    console.log('移除Element classList:', ref.current.classList.value)
    ref.current.className =
      'test-element w-32 h-32 bg-gradient-to-r bg-opacity-15 bg-red-200/30  rounded-lg flex items-center justify-center text-white  duration-300'
    updateElementState(ref)
  }
  const resetStyles1 = () => {
    if (!ref1.current) return
    ref1.current.removeAttribute('style')
    // ref1.current.classList.remove('translate-y-8')
    ref1.current.removeAttribute('class')
    console.log('移除Element1 classList:', ref1.current.classList.value)
    ref1.current.className =
      'test-element w-32 h-32 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white duration-300'
    updateElementState(ref1)
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
              // }} //测试常用属性值
              style={{ position: 'relative' }}
              ref={ref}
            >
              Test Element
            </div>
            <div
              enable-xr
              className="test-element w-32 h-32 bg-pink-500 hover:bg-pink-500 rounded-lg flex items-center justify-center text-white duration-300"
              // style={{ color: 'blue' }} // 测试 style样式优先级
              // className="text-red-500" // 测试 style样式优先级
              ref={ref1}
            >
              Test Element1
            </div>
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
              <button
                onClick={removeBackgroundMaterial}
                className="p-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                style={{ width: '100px', marginLeft: '10px' }}
              >
                remove
              </button>
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
                remove
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {/* 渲染 transformOrigin */}
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <select
                  className="p-2  bg-purple-50 text-black rounded-lg transition-colors"
                  style={{ flex: 1, width: '250px' }}
                  value={transformOrigin}
                  onChange={handleTransformOriginChange}
                >
                  <option value="left top">元素左上角: left top</option>
                  <option value="left center">元素左侧中心: left center</option>
                  <option value="left bottom">元素左下角: left bottom</option>
                  <option value="center top">元素的顶部中心: center top</option>
                  <option value="right center">
                    元素的右侧中心: right center
                  </option>
                  <option value="right bottom">
                    元素的右下角: right bottom
                  </option>
                  <option value="50% 50%">元素的中心: 50% 50%</option>
                  <option value="0% 0%">元素的左上角: 0% 0%</option>
                </select>
                <button
                  onClick={removeTransformOrigin}
                  className="p-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  style={{ width: '100px', marginLeft: '10px' }}
                >
                  remove
                </button>
              </div>
            </div>
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

            {/* 渲染Class Operations */}
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
                <option value="">Class List Test 下拉选择操作</option>
                <option value="add">添加类名</option>
                <option value="remove">移除类名</option>
                <option value="replace">替换类名</option>
                <option value="toggle">反转类名</option>
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
