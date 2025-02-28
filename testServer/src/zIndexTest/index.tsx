// @ts-nocheck
import ReactDOM from 'react-dom/client'

import { enableDebugTool } from '@webspatial/react-sdk'

enableDebugTool()

function App() {
  const styleOuter = {
    '--xr-back': 121,
    position: 'relative',
    width: '200px',
    height: '78px',

    backgroundColor: 'red',
  }

  const styleInner1 = {
    '--xr-back': 36,
    backgroundColor: 'blue',
    position: 'absolute',
    left: 30,
    zIndex: 11,
  }

  const styleInner2 = {
    '--xr-back': 36,
    backgroundColor: 'green',
    position: 'absolute',
    left: 0,
    zIndex: 3,
  }

  return (
    <div className="w-screen h-screen  ">
      <div className="text-blue   bg-base-200	bg-clip-border px-6 py-6  ">
        <a href="#" onClick={() => history.go(-1)}>
          Go Back
        </a>
      </div>

      <div enable-xr style={styleOuter} debugName="OuterDiv">
        OuterDiv
        <div enable-xr style={styleInner1} debugName="InnerDiv1">
          Inner Div1
        </div>
        <div enable-xr style={styleInner2} debugName="InnerDiv2">
          Inner Div2
        </div>
      </div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
