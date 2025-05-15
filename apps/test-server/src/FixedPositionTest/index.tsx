import ReactDOM from 'react-dom/client'

import { enableDebugTool } from '@webspatial/react-sdk'

enableDebugTool()

function App() {
  return (
    <div className="w-screen h-screen  ">
      <div
        enable-xr
        style={{
          '--xr-back': 121,
        }}
        className="text-blue fixed w-full  bg-base-200	bg-clip-border px-6 py-6  "
      >
        <a href="#" onClick={() => history.go(-1)}>
          Go Back
        </a>
      </div>

      <div
        className="flex flex-col items-center justify-center"
        style={{
          height: '300px',
          backgroundColor: 'lightblue',
        }}
      >
        very giant block which cause scroll
      </div>

      <div
        enable-xr
        style={{
          '--xr-back': 20,
        }}
        className="text-blue-100 relative w-full   px-6 py-6  "
      >
        another spatial div
      </div>

      <div
        className="flex flex-col items-center justify-center"
        style={{
          height: '1600px',
          backgroundColor: 'lightgreen',
        }}
      >
        another giant block which cause scroll
      </div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
