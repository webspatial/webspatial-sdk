import { type BackgroundMaterialType, CornerRadius } from '@xrsdk/runtime/dist'
import ReactDOM from 'react-dom/client'
import { useState } from 'react'

function App() {
  const z = 100

  const [bottomLeading, setBottomLeading] = useState(10)
  const [bottomTrailing, setBottomTrailing] = useState(10)
  const [topLeading, setTopLeading] = useState(10)
  const [topTrailing, setTopTrailing] = useState(10)

  const cornerRadius: CornerRadius = {
    bottomLeading,
    bottomTrailing,
    topLeading,
    topTrailing,
  }

  const style1 = {
    '--xr-back': z + '',
  }
  return (
    <>
      <div className="text-orange-200 mx-2.5 my-2.5">
        <div className="">
          borderRadius bottomLeading:
          <input
            type="range"
            style={{ width: '50%' }}
            min={0}
            max="200"
            value={bottomLeading}
            onChange={e => {
              setBottomLeading(Number(e.target.value))
            }}
            className="range"
          />
        </div>

        <div>
          borderRadius bottomTrailing:
          <input
            type="range"
            style={{ width: '50%' }}
            min={0}
            max="200"
            value={bottomTrailing}
            onChange={e => {
              setBottomTrailing(Number(e.target.value))
            }}
            className="range"
          />
        </div>

        <div>
          borderRadius topLeading:
          <input
            type="range"
            style={{ width: '50%' }}
            min={0}
            max="200"
            value={topLeading}
            onChange={e => {
              setTopLeading(Number(e.target.value))
            }}
            className="range"
          />
        </div>

        <div>
          borderRadius topTrailing:
          <input
            type="range"
            style={{ width: '50%' }}
            min={0}
            max="200"
            value={topTrailing}
            onChange={e => {
              setTopTrailing(Number(e.target.value))
            }}
            className="range"
          />
        </div>
      </div>

      <div className="flex flex-row space-x-2 w-screen text-orange-500   text-center">
        <div
          enable-xr
          style={{
            '--xr-back': z + '',
            '--xr-background-material': 'none' as BackgroundMaterialType,
            cornerRadius,
            height: '100px',
          }}
          className="grow"
        >
          this is transparent material
        </div>

        <div
          enable-xr
          style={{
            '--xr-back': z + '',
            '--xr-background-material': 'default' as BackgroundMaterialType,
            cornerRadius,
            height: '100px',
          }}
          className="grow bg-slate-50/50"
        >
          this is glass material
        </div>

        <div
          enable-xr
          style={{
            '--xr-back': z + '',
            '--xr-background-material': 'thin' as BackgroundMaterialType,
            cornerRadius,
            height: '100px',
          }}
          className="grow bg-slate-50/50"
        >
          this is thin material
        </div>

        <div
          enable-xr
          style={{
            '--xr-back': z + '',
            '--xr-background-material': 'regular' as BackgroundMaterialType,
            cornerRadius,
            height: '100px',
          }}
          className="grow bg-slate-50/50"
        >
          this is regular material
        </div>

        <div
          enable-xr
          style={{
            '--xr-back': z + '',
            '--xr-background-material': 'thick' as BackgroundMaterialType,
            cornerRadius,
            height: '100px',
          }}
          className="grow bg-slate-50/50"
        >
          this is thick material
        </div>
      </div>
    </>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
