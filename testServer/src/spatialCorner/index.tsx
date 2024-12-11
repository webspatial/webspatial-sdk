import { type BackgroundMaterialType } from '@xrsdk/runtime'
import ReactDOM from 'react-dom/client'
import { useEffect, useState } from 'react'

function App() {
  const z = 100

  const [mainBorderRadius, setBorderRadius] = useState(10)

  const [bottomLeft, setBottomLeading] = useState(10)
  const [bottomRight, setBottomTrailing] = useState(10)
  const [topLeft, setTopLeading] = useState(10)
  const [topRight, setTopTrailing] = useState(10)

  const borderRadius = `${topLeft}px ${topRight}px ${bottomRight}px ${bottomLeft}px`

  const toggleBackgroundMaterial = () => {
    const backgroundMaterial =
      document.documentElement.style['--xr-background-material']
    if (backgroundMaterial !== 'default') {
      document.documentElement.style['--xr-background-material'] = 'default'
      document.documentElement.style['background-color'] = 'transparent'
    } else {
      document.documentElement.style['--xr-background-material'] = 'none'
      document.documentElement.style['background-color'] = '#4f4f4f'
    }
  }

  useEffect(() => {
    document.documentElement.style.borderRadius = `${mainBorderRadius}px`
  }, [mainBorderRadius])

  return (
    <>
      <div className="text-blue    	bg-clip-border px-6 py-6  ">
        <a href="#" onClick={() => history.go(-1)}>
          Go Back
        </a>
      </div>

      <div className="text-orange-200 mx-2.5 my-2.5">
        <button className="bg-indigo-500" onClick={toggleBackgroundMaterial}>
          toggle background material:
        </button>
        <div className="">
          change main window borderRadius:
          <input
            type="range"
            style={{ width: '50%' }}
            min={0}
            max="200"
            value={mainBorderRadius}
            onChange={e => {
              setBorderRadius(Number(e.target.value))
            }}
            className="range"
          />
        </div>

        <div className="">
          borderRadius bottomLeft:
          <input
            type="range"
            style={{ width: '50%' }}
            min={0}
            max="200"
            value={bottomLeft}
            onChange={e => {
              setBottomLeading(Number(e.target.value))
            }}
            className="range"
          />
        </div>

        <div>
          borderRadius bottomRight:
          <input
            type="range"
            style={{ width: '50%' }}
            min={0}
            max="200"
            value={bottomRight}
            onChange={e => {
              setBottomTrailing(Number(e.target.value))
            }}
            className="range"
          />
        </div>

        <div>
          borderRadius topLeft:
          <input
            type="range"
            style={{ width: '50%' }}
            min={0}
            max="200"
            value={topLeft}
            onChange={e => {
              setTopLeading(Number(e.target.value))
            }}
            className="range"
          />
        </div>

        <div>
          borderRadius topRight:
          <input
            type="range"
            style={{ width: '50%' }}
            min={0}
            max="200"
            value={topRight}
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
            borderRadius,
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
            borderRadius,
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
            borderRadius,
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
            borderRadius,
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
            borderRadius,
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
