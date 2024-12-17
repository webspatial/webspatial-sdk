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
      // ;(window as any).ref1 = node

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

  return (
    <div className="w-screen h-screen  ">
      <div className="text-blue   bg-base-200	bg-clip-border px-6 py-6  ">
        <a href="#">Go Back</a>
      </div>

      <div className="bg-slate-500 m-6	 artboard artboard-horizontal phone-2">
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

        <div
          enable-xr
          style={{
            '--xr-back': 100,
          }}
          ref={onRef}
          className="w-6/12"
        >
          Spatial Div For Background Material
        </div>

        <select
          className="select w-full m-6 select-sm max-w-xs"
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
      </div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
