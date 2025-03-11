// @ts-nocheck
import ReactDOM from 'react-dom/client'

import {
  enableDebugTool,
  Model,
  ModelElement,
  ModelEvent,
  ModelDragEvent,
} from '@webspatial/react-sdk'
import { CSSProperties } from 'styled-components'
import React, { useRef, useState } from 'react'

enableDebugTool()

function App() {
  const [tapFlag, setTapFlag] = useState(true)

  const ref1 = useRef<ModelElement | null>(null)
  const ref2 = useRef<ModelElement | null>(null)
  const ref3 = useRef<ModelElement | null>(null)
  const ref4 = useRef<ModelElement | null>(null)

  ;(window as any).ref1 = ref1
  ;(window as any).ref2 = ref2
  ;(window as any).ref3 = ref3
  ;(window as any).ref4 = ref4

  const buttonStyle: CSSProperties = {
    zIndex: 100,
  }

  const styleFather: CSSProperties = {
    '--xr-back': 0,
    position: 'absolute',
  }

  const styleOuter: CSSProperties = {
    '--xr-back': tapFlag ? 0 : 100,
    // visibility: 'hidden',
    position: 'relative',
    width: '100%',
    height: '100%',
    marginBottom: '140px',
    padding: '5px',
    // transform: 'translateX(100px) rotateZ(20deg)',
    // transformOrigin: 'right bottom',
    // display: 'flex',
    // flexDirection: 'row',
    // justifyContent: 'space-between',
    // flexWrap: 'wrap'
  }

  const [xrBack1, setXrBack1] = useState(0)
  const [xrBack2, setXrBack2] = useState(0)

  const handleXrBackChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    ref: React.RefObject<ModelElement>,
  ) => {
    const value = parseInt(event.target.value, 10)
    if (ref.current) {
      ref.current.style.setProperty('--xr-back', `${value}`)
      console.log('Set xrBack value:', value)
      const currentXrBack = ref.current.style.getPropertyValue('--xr-back')
      console.log('Get xrBack value:', currentXrBack)
    }
  }

  const onToggleDisplay = (ref: React.RefObject<ModelElement>) => {
    if (ref.current) {
      ref.current.style.display =
        ref.current.style.display === '' ||
        ref.current.style.display === 'block'
          ? 'none'
          : 'block'
    }
  }

  const onToggleOpacity = (ref: React.RefObject<ModelElement>) => {
    if (ref.current) {
      ref.current.style.opacity =
        ref.current.style.opacity !== '0.3' ? '0.3' : '0.5'
    }
  }

  const onToggleVisible = (ref: React.RefObject<ModelElement>) => {
    if (ref.current) {
      ref.current.style.visibility =
        ref.current.style.visibility === 'visible' ||
        ref.current.style.visibility === ''
          ? 'hidden'
          : 'visible'
    }
  }

  const [contentMode, setContentMode] = useState<'fit' | 'fill'>('fit')

  const handleContentModeChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const contentMode = event.target.value as 'fit' | 'fill'
    setContentMode(contentMode)
  }

  const [resizable, setResizable] = useState(true)

  const handleResizableChange = () => {
    setResizable(v => !v)
  }

  const [aspectRatio, setAspectRatio] = useState(0)
  const handleAspectRatioChange = () => {
    setAspectRatio(v => (v === 0 ? 4 / 3 : 0))
  }

  const [translateX1, setTranslateX1] = useState(0)
  const [rotateZ1, setRotateZ1] = useState(0)
  const [transformOrigin1, setTransformOrigin1] = useState('left top')

  const [translateX2, setTranslateX2] = useState(0)
  const [rotateZ2, setRotateZ2] = useState(0)
  const [transformOrigin2, setTransformOrigin2] = useState('left top')

  const [translateX3, setTranslateX3] = useState(0)
  const [rotateZ3, setRotateZ3] = useState(0)
  const [transformOrigin3, setTransformOrigin3] = useState('left top')

  const [translateX4, setTranslateX4] = useState(0)
  const [rotateZ4, setRotateZ4] = useState(0)
  const [transformOrigin4, setTransformOrigin4] = useState('left top')

  const handleTransformChange = (
    ref: React.RefObject<ModelElement>,
    translateX: number,
    rotateZ: number,
  ) => {
    if (ref.current) {
      ref.current.style.setProperty(
        'transform',
        `translateX(${translateX}px) rotateZ(${rotateZ}deg)`,
      )
      const currentTransform = ref.current.style.getPropertyValue('transform')
      console.log('Get transform value:', currentTransform)
    }
  }

  const handleTransformOriginChange = (
    ref: React.RefObject<ModelElement>,
    transformOrigin: string,
  ) => {
    if (ref.current) {
      // ref.current.style.transformOrigin = transformOrigin
      ref.current.style.setProperty('transform-Origin', `${transformOrigin}`)
      const currentTransformOrigin =
        ref.current.style.getPropertyValue('transform-Origin')
      console.log('Get transform value:', currentTransformOrigin)
    }
  }

  const resetModelSize = (ref: React.RefObject<ModelElement>) => {
    if (ref.current) {
      ref.current.style.width = '30%'
      ref.current.style.height = '40%'
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 p-10">
      <h1 style={{ textAlign: 'center', fontSize: '36px' }}>
        <div
          enable-xr
          style={{
            position: { z: 50 }, // Bulge 50 in the z direction
          }}
          className="text-6xl font-bold text-white p-8 rounded-xl"
        >
          Model3D Test
        </div>
      </h1>
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
      <div className="m-5 flex flex-row flex-wrap text-white">
        {/* model 1 */}
        <div className="grow bg-black bg-opacity-25 flex flex-col h-96  items-center justify-center p-20">
          <h3 className="text-xl mb-4">Model - 1</h3>
          <div
            // enable-xr
            // style={styleFather}
            className="w-full h-52"
          >
            <Model
              ref={ref1}
              style={styleOuter}
              className="w-full h-full bg-white bg-opacity-25 rounded-xl"
              contentMode={contentMode}
              resizable={resizable}
              aspectRatio={aspectRatio}
              poster="/src/assets/loading.png"
              onLoad={(event: ModelEvent) => {
                console.log(
                  'model1 onLoad',
                  event.target.ready,
                  event.target.currentSrc,
                )
              }}
              onDragStart={(dragEvent: ModelDragEvent) => {
                console.log('model1 onDragStart', dragEvent)
              }}
              onDrag={(dragEvent: ModelDragEvent) => {
                ref1.current!.style.transform = `translateX(${dragEvent.translation3D.x}px) translateY(${dragEvent.translation3D.y}px) translateZ(${dragEvent.translation3D.z}px)`
              }}
              onDragEnd={(dragEvent: ModelDragEvent) => {
                console.log(
                  'model1 onDragEnd',
                  dragEvent,
                  dragEvent.target.ready,
                  dragEvent.target.currentSrc,
                )
                ref1.current!.style.transform = 'none'
              }}
              onTap={(event: ModelEvent) => {
                setTapFlag(v => !v)
                console.log('model1 onTap', event)
              }}
              onDoubleTap={(event: ModelEvent) => {
                console.log('model1 onDoubleTap', event)
                resetModelSize(ref1)
              }}
              onLongPress={(event: ModelEvent) => {
                console.log('model1 onLongPress', event)
              }}
            >
              <source
                src="/src/assets/FlightHelmet.usdz"
                type="model/vnd.usdz+zip"
              />
              {/*<source src="https://raw.githubusercontent.com/immersive-web/model-element/main/examples/assets/FlightHelmet.usdz" type="model/vnd.usdz+zip" />*/}
              <source
                src="/src/assets/NASB_2_-_SpongeBob.usdz"
                type="model/vnd.usdz+zip"
              />
              <source
                src="/src/assets/nasb_2_-_patrick/scene.gltf"
                type="model/gltf-binary"
              />
              <source
                src="/src/assets/nasb_2_-_spongebob.glb"
                type='type="model/gltf+json"'
              />
            </Model>
          </div>
          <div className="flex flex-row gap-4 mt-4 justify-start">
            <button
              className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              onClick={() => onToggleDisplay(ref1)}
            >
              Model1 Toggle
            </button>
            <button
              className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              onClick={() => onToggleOpacity(ref1)}
            >
              Model1 Opacity
            </button>
            <button
              className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              onClick={() => onToggleVisible(ref1)}
            >
              Model1 Visible
            </button>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="range"
                min="-500"
                max="900"
                value={xrBack1}
                onChange={e => {
                  const value = parseInt(e.target.value, 10)
                  setXrBack1(value)
                  handleXrBackChange(e, ref1)
                }}
                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                style={{ width: '250px' }}
              />
              <span className="ml-1.5 text-red-500">xrBack：{xrBack1}px</span>
            </div>
          </div>
          <div
            className="flex flex-row gap-4 mt-2 justify-start"
            style={{ margin: '20px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="number"
                value={translateX1}
                onChange={e => {
                  const value = parseInt(e.target.value, 10)
                  setTranslateX1(value)
                  handleTransformChange(ref1, value, rotateZ1)
                }}
                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                style={{ width: '100px' }}
              />
              <span className="ml-1.5">translateX</span>
              <input
                type="number"
                value={rotateZ1}
                onChange={e => {
                  const value = parseInt(e.target.value, 10)
                  setRotateZ1(value)
                  handleTransformChange(ref1, translateX1, value)
                }}
                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                style={{ width: '100px' }}
              />
              <span className="ml-1.5">rotateZ</span>
              <select
                value={transformOrigin1}
                onChange={e => {
                  const value = e.target.value
                  setTransformOrigin1(value)
                  handleTransformOriginChange(ref1, value)
                }}
                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                style={{ width: '150px' }}
              >
                <option value="left bottom">left bottom</option>
                <option value="right bottom">right bottom</option>
              </select>
              <span className="ml-1.5">transformOrigin</span>
            </div>
          </div>
        </div>

        {/* model 2 */}
        <div className="grow bg-black bg-opacity-25 flex flex-col h-96  items-center justify-center p-20">
          <h3 className="text-xl mb-4">Model - 2</h3>
          <div className="w-full h-52">
            <Model
              ref={ref2}
              style={styleOuter}
              className="w-full h-full bg-white bg-opacity-25 rounded-xl"
              contentMode={contentMode}
              resizable={resizable}
              aspectRatio={aspectRatio}
              onLoad={(event: ModelEvent) => {
                console.log(
                  'model2 onLoad',
                  event.target.ready,
                  event.target.currentSrc,
                )
              }}
              onDragStart={(dragEvent: ModelDragEvent) => {
                console.log('model2 onDragStart', dragEvent)
              }}
              onDrag={(dragEvent: ModelDragEvent) => {
                ref2.current!.style.transform = `translateX(${dragEvent.translation3D.x}px) translateY(${dragEvent.translation3D.y}px) translateZ(${dragEvent.translation3D.z}px)`
              }}
              onDragEnd={(dragEvent: ModelDragEvent) => {
                console.log(
                  'model2 onDragEnd',
                  dragEvent,
                  dragEvent.target.ready,
                  dragEvent.target.currentSrc,
                )
                ref2.current!.style.transform = 'none'
              }}
              onTap={(event: ModelEvent) => {
                setTapFlag(v => !v)
                console.log('model2 onTap', event)
              }}
              onDoubleTap={(event: ModelEvent) => {
                console.log('model2 onDoubleTap', event)
              }}
              onLongPress={(event: ModelEvent) => {
                console.log('model2 onLongPress', event)
              }}
            >
              <source
                src="/src/assets/NASB_2_-_SpongeBob.usdz"
                type="model/vnd.usdz+zip"
              />
              <div> this is place holder when failure for model2 </div>
            </Model>
          </div>
          <div className="flex flex-row gap-4 mt-4 justify-start">
            <button
              className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              onClick={() => onToggleDisplay(ref2)}
            >
              Model2 Toggle
            </button>
            <button
              className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              onClick={() => onToggleOpacity(ref2)}
            >
              Model2 Opacity
            </button>
            <button
              className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              onClick={() => onToggleVisible(ref2)}
            >
              Model2 Visible
            </button>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="range"
                min="-500"
                max="900"
                value={xrBack2}
                onChange={e => {
                  const value = parseInt(e.target.value, 10)
                  setXrBack2(value)
                  handleXrBackChange(e, ref2)
                }}
                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                style={{ width: '250px' }}
              />
              <span className="ml-1.5 text-red-500">xrBack：{xrBack2}px</span>
            </div>
          </div>
          <div
            className="flex flex-row gap-4 mt-2 justify-start"
            style={{ margin: '20px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="number"
                value={translateX2}
                onChange={e => {
                  const value = parseInt(e.target.value, 10)
                  setTranslateX2(value)
                  handleTransformChange(ref2, value, rotateZ2)
                }}
                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                style={{ width: '100px' }}
              />
              <span className="ml-1.5">translateX</span>
              <input
                type="number"
                value={rotateZ2}
                onChange={e => {
                  const value = parseInt(e.target.value, 10)
                  setRotateZ2(value)
                  handleTransformChange(ref2, translateX2, value)
                }}
                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                style={{ width: '100px' }}
              />
              <span className="ml-1.5">rotateZ</span>
              <select
                value={transformOrigin2}
                onChange={e => {
                  const value = e.target.value
                  setTransformOrigin2(value)
                  handleTransformOriginChange(ref2, value)
                }}
                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                style={{ width: '150px' }}
              >
                <option value="left bottom">left bottom</option>
                <option value="right bottom">right bottom</option>
              </select>
              <span className="ml-1.5">transformOrigin</span>
            </div>
          </div>
        </div>

        {/* model 3 */}
        <div className="grow bg-black bg-opacity-25 flex flex-col h-96  items-center justify-center p-20">
          <h3 className="text-xl mb-4">Model - 3</h3>
          <div className="w-full h-52">
            <Model
              ref={ref3}
              style={styleOuter}
              className="w-full h-full bg-white bg-opacity-25 rounded-xl"
              contentMode={contentMode}
              resizable={resizable}
              aspectRatio={aspectRatio}
              poster="/src/assets/loading.png"
              onLoad={(event: ModelEvent) => {
                console.log(
                  'model3 onLoad',
                  event.target.ready,
                  event.target.currentSrc,
                )
              }}
              onDragStart={(dragEvent: ModelDragEvent) => {
                console.log('model3 onDragStart', dragEvent)
              }}
              onDrag={(dragEvent: ModelDragEvent) => {
                ref3.current!.style.transform = `translateX(${dragEvent.translation3D.x}px) translateY(${dragEvent.translation3D.y}px) translateZ(${dragEvent.translation3D.z}px)`
              }}
              onDragEnd={(dragEvent: ModelDragEvent) => {
                console.log(
                  'model3 onDragEnd',
                  dragEvent,
                  dragEvent.target.ready,
                  dragEvent.target.currentSrc,
                )
                ref3.current!.style.transform = 'none'
              }}
              onTap={(event: ModelEvent) => {
                setTapFlag(v => !v)
                console.log('model3 onTap', event)
              }}
              onDoubleTap={(event: ModelEvent) => {
                console.log('model3 onDoubleTap', event)
              }}
              onLongPress={(event: ModelEvent) => {
                console.log('model3 onLongPress', event)
              }}
            >
              <source
                src="/src/assets/FlightHelmet.glb"
                type="model/gltf-binary"
              />
              <div> this is place holder when failure for model3 </div>
            </Model>
          </div>
          <div className="flex flex-row gap-4 mt-4 justify-start">
            <button
              className="p-2 bg-pink-500 hover:bg-pink-500 text-white rounded-lg transition-colors"
              onClick={() => onToggleDisplay(ref3)}
            >
              Model3 Toggle
            </button>
            <button
              className="p-2 bg-pink-500 hover:bg-pink-500 text-white rounded-lg transition-colors"
              onClick={() => onToggleOpacity(ref3)}
            >
              Model3 Opacity
            </button>
            <button
              className="p-2 bg-pink-500 hover:bg-pink-500 text-white rounded-lg transition-colors"
              onClick={() => onToggleVisible(ref3)}
            >
              Model3 Visible
            </button>
          </div>
          <div
            className="flex flex-row gap-4 mt-2 justify-start"
            style={{ margin: '20px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="number"
                value={translateX3}
                onChange={e => {
                  const value = parseInt(e.target.value, 10)
                  setTranslateX3(value)
                  handleTransformChange(ref3, value, rotateZ3)
                }}
                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                style={{ width: '100px' }}
              />
              <span className="ml-1.5">translateX</span>
              <input
                type="number"
                value={rotateZ3}
                onChange={e => {
                  const value = parseInt(e.target.value, 10)
                  setRotateZ3(value)
                  handleTransformChange(ref3, translateX3, value)
                }}
                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                style={{ width: '100px' }}
              />
              <span className="ml-1.5">rotateZ</span>
              <select
                value={transformOrigin3}
                onChange={e => {
                  const value = e.target.value
                  setTransformOrigin3(value)
                  handleTransformOriginChange(ref3, value)
                }}
                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                style={{ width: '150px' }}
              >
                <option value="left bottom">left bottom</option>
                <option value="right bottom">right bottom</option>
              </select>
              <span className="ml-1.5">transformOrigin</span>
            </div>
          </div>
        </div>

        {/* model 4 */}
        <div className="grow bg-black bg-opacity-25 flex flex-col h-96  items-center justify-center p-20">
          <h3 className="text-xl mb-4">Model - 4</h3>
          <div className="w-full h-52">
            <Model
              ref={ref4}
              style={styleOuter}
              contentMode={contentMode}
              className="w-full h-full bg-white bg-opacity-25 rounded-xl"
              resizable={resizable}
              aspectRatio={aspectRatio}
              poster="/src/assets/flightHelmet.png"
              onLoad={(event: ModelEvent) => {
                console.log(
                  'model4 onLoad',
                  event.target.ready,
                  event.target.currentSrc,
                )
              }}
              onDragStart={(dragEvent: ModelDragEvent) => {
                console.log('model4 onDragStart', dragEvent)
              }}
              onDrag={(dragEvent: ModelDragEvent) => {
                ref4.current!.style.transform = `translateX(${dragEvent.translation3D.x}px) translateY(${dragEvent.translation3D.y}px) translateZ(${dragEvent.translation3D.z}px)`
              }}
              onDragEnd={(dragEvent: ModelDragEvent) => {
                console.log(
                  'model4 onDragEnd',
                  dragEvent,
                  dragEvent.target.ready,
                  dragEvent.target.currentSrc,
                )
                ref4.current!.style.transform = 'none'
              }}
              onTap={(event: ModelEvent) => {
                setTapFlag(v => !v)
                console.log('model4 onTap', event)
              }}
              onDoubleTap={(event: ModelEvent) => {
                console.log('model4 onDoubleTap', event)
              }}
              onLongPress={(event: ModelEvent) => {
                console.log('model4 onLongPress', event)
              }}
            >
              <source
                src="/src/assets/nasb_2_-_patrick/scene.gltf"
                type="model/gltf+json"
              />
              <div> this is place holder when failure for model4 </div>
            </Model>
          </div>
          <div className="flex flex-row gap-4 mt-4 justify-start">
            <button
              className="p-2 bg-pink-500 hover:bg-pink-500 text-white rounded-lg transition-colors"
              onClick={() => onToggleDisplay(ref4)}
            >
              Model4 Toggle
            </button>
            <button
              className="p-2 bg-pink-500 hover:bg-pink-500 text-white rounded-lg transition-colors"
              onClick={() => onToggleOpacity(ref4)}
            >
              Model4 Opacity
            </button>
            <button
              className="p-2 bg-pink-500 hover:bg-pink-500 text-white rounded-lg transition-colors"
              onClick={() => onToggleVisible(ref4)}
            >
              Model4 Visible
            </button>
          </div>
          <div
            className="flex flex-row gap-4 mt-2 justify-start"
            style={{ margin: '20px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="number"
                value={translateX4}
                onChange={e => {
                  const value = parseInt(e.target.value, 10)
                  setTranslateX4(value)
                  handleTransformChange(ref4, value, rotateZ4)
                }}
                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                style={{ width: '100px' }}
              />
              <span className="ml-1.5">translateX</span>
              <input
                type="number"
                value={rotateZ4}
                onChange={e => {
                  const value = parseInt(e.target.value, 10)
                  setRotateZ4(value)
                  handleTransformChange(ref4, translateX4, value)
                }}
                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                style={{ width: '100px' }}
              />
              <span className="ml-1.5">rotateZ</span>
              <select
                value={transformOrigin4}
                onChange={e => {
                  const value = e.target.value
                  setTransformOrigin4(value)
                  handleTransformOriginChange(ref4, value)
                }}
                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                style={{ width: '150px' }}
              >
                <option value="left bottom">left bottom</option>
                <option value="right bottom">right bottom</option>
              </select>
              <span className="ml-1.5">transformOrigin</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-4 mt-4">
        <button
          className="btn btn-primary"
          onClick={handleResizableChange}
          style={buttonStyle}
        >
          resizable
        </button>
        <button className="btn btn-primary" onClick={handleAspectRatioChange}>
          aspectRatio
        </button>
      </div>
      <div className="flex justify-center mt-4">
        <select
          value={contentMode}
          onChange={handleContentModeChange}
          className="p-2  bg-purple-50 text-black rounded-lg transition-colors"
        >
          <option value="fit">fit</option>
          <option value="fill">fill</option>
        </select>
      </div>
    </div>
  )
}

const root = document.createElement('div')
document.body.appendChild(root)
ReactDOM.createRoot(root).render(<App />)
