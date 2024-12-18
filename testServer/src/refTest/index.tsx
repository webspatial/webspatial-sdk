import ReactDOM from 'react-dom/client'
import { enableDebugTool } from '@xrsdk/react'
import { useCallback, useEffect, useRef, useState } from 'react'

enableDebugTool()

function App() {
  const ref2 = useRef<HTMLDivElement>(null)
  const [backgroundMaterial, setBackgroundMaterial] = useState('none')

  const refBackgroundDom = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (refBackgroundDom.current) {
      // refBackgroundDom.current.style.setProperty(
      //   '--xr-background-material',
      //   backgroundMaterial,
      // )

      refBackgroundDom.current.style['--xr-background-material'] =
        backgroundMaterial
    }
  }, [backgroundMaterial])

  const onRef = useCallback((node: HTMLDivElement) => {
    if (node) {
      ;(window as any).ref1 = node

      refBackgroundDom.current = node
    }
  }, [])

  const onIncreaseBorderRadiusByRefStyle = () => {
    const curBordeRadius = parseFloat(
      ref2.current!.style.getPropertyValue('border-radius') || '0',
    )
    const newBordeRadius = curBordeRadius + 10
    ref2.current!.style.setProperty('border-radius', newBordeRadius + 'px')
  }

  const onDecreaseBorderRadiusByRefStyle = () => {
    const curBordeRadius = parseFloat(
      ref2.current!.style.getPropertyValue('border-radius') || '0',
    )
    const newBordeRadius = curBordeRadius > 10 ? curBordeRadius - 10 : 0
    ref2.current!.style.setProperty('border-radius', newBordeRadius + 'px')
  }

  const onResetBorderRadiusByRefStyle = () => {
    ref2.current!.style.removeProperty('border-radius')
  }

  const onRemoveBackgroundMaterial = () => {
    if (refBackgroundDom.current) {
      refBackgroundDom.current.style.removeProperty('--xr-background-material')
    }
  }

  const [backDepth, setBackDepth] = useState('10')
  const onChangeBackDepth = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    refBackgroundDom.current!.style.setProperty('--xr-back', value)
    setBackDepth(value)
  }

  const [rotateZ, setRotateZ] = useState('0')
  const onChangeRotateZ = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value

    setRotateZ(value)
  }

  const [translateX, setTranslateX] = useState(0)
  const onChangeTranslateX = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setTranslateX(value)
  }

  useEffect(() => {
    if (refBackgroundDom.current) {
      const transform = `translateX(${translateX}px) rotateZ(${rotateZ}deg)`
      refBackgroundDom.current!.style.setProperty('transform', transform)
    }
  }, [translateX, rotateZ])

  const [transformOrigin, setTransformOrigin] = useState('center')
  useEffect(() => {
    if (refBackgroundDom.current) {
      refBackgroundDom.current!.style.transformOrigin = transformOrigin
    }
  }, [transformOrigin])

  return (
    <div className="w-screen h-screen  ">
      <div className="text-blue   bg-base-200	bg-clip-border px-6 py-6  ">
        <a href="#">Go Back</a>
      </div>

      <div className="bg-slate-500 m-6	w-8/12">
        <div
          enable-xr
          style={{
            '--xr-back': 100,
          }}
          ref={ref2}
          className="w-6/12  bg-blue-500"
        >
          Spatial Div
        </div>

        <div className="m-6 flex w-full flex-col lg:flex-row">
          <button
            className="btn btn-primary"
            onClick={onIncreaseBorderRadiusByRefStyle}
          >
            increase borderRadio
          </button>
          <span className="divider divider-horizontal">OR</span>
          <button
            className="btn btn-primary"
            onClick={onDecreaseBorderRadiusByRefStyle}
          >
            decrease borderRadio
          </button>
          <span className="divider divider-horizontal">OR</span>
          <button
            className="btn btn-primary"
            onClick={onResetBorderRadiusByRefStyle}
          >
            reset borderRadio
          </button>
        </div>

        <div enable-xr style={{}} ref={onRef} className="w-6/12">
          Spatial Div For Background Material
        </div>

        <select
          className="select w-full m-2 select-sm max-w-xs"
          value={backgroundMaterial} // ...force the select's value to match the state variable...
          onChange={e => setBackgroundMaterial(e.target.value)}
        >
          <option>none</option>
          <option>default</option>
          <option>thin</option>
          <option>regular</option>
          <option>thick</option>
        </select>
        <button
          className="btn btn-primary"
          onClick={onRemoveBackgroundMaterial}
        >
          remove background material property
        </button>

        <div className="m-2">change depth</div>
        <input
          type="range"
          min={10}
          max="200"
          value={backDepth}
          className="range range-primary"
          onChange={onChangeBackDepth}
        />

        <div className="m-2">change rotateZ</div>
        <input
          type="range"
          min={10}
          max="200"
          value={rotateZ}
          className="range range-primary"
          onChange={onChangeRotateZ}
        />

        <div className="m-2">change translateX</div>
        <input
          type="range"
          min={0}
          max="200"
          value={translateX}
          className="range range-primary"
          onChange={onChangeTranslateX}
        />

        <div className="m-6">select transformOrigin</div>
        <select
          className="select w-full  m-2 select-sm max-w-xs"
          value={transformOrigin} // ...force the select's value to match the state variable...
          onChange={e => setTransformOrigin(e.target.value)}
        >
          <option>center</option>
          <option>top left</option>
          <option>10px 10px</option>
        </select>
      </div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
