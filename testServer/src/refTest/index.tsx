import ReactDOM from 'react-dom/client'
import { enableDebugTool } from '@xrsdk/react'
import { useEffect, useRef } from 'react'

enableDebugTool()

function App() {
  const ref2 = useRef<HTMLElement>()

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
          className="w-6/12 h-20 bg-red-500"
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
        </div>
      </div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
