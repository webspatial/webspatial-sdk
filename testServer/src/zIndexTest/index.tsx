import ReactDOM from 'react-dom/client'

import { enableDebugTool } from '@xrsdk/react'
import { useRef, useState } from 'react'

enableDebugTool()

function App() {
  const [showInner, setShowInner] = useState(true)

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
    zIndex: showInner ? 11 : 1,
    // zIndex: 0,
  }

  const styleInner2 = {
    '--xr-back': 36,
    backgroundColor: 'green',
    position: 'absolute',
    left: 0,
    zIndex: 3,
    // zIndex: 0,
  }

  const onToggle = () => {
    setShowInner(v => !v)
  }

  const ref1 = useRef<HTMLDivElement>(null)
  const ref2 = useRef<HTMLDivElement>(null)

  ;(window as any).ref1 = ref1
  ;(window as any).ref2 = ref2

  return (
    <div className="w-screen h-screen  ">
      <div className="text-blue   bg-base-200	bg-clip-border px-6 py-6  ">
        <a href="#" onClick={() => history.go(-1)}>
          Go Back
        </a>
      </div>

      <div enable-xr style={styleOuter} debugName="OuterDiv">
        OuterDiv
        <div enable-xr ref={ref1} style={styleInner1} debugName="InnerDiv1">
          Inner Div1
        </div>
        <div enable-xr ref={ref2} style={styleInner2} debugName="InnerDiv2">
          Inner Div2
        </div>
      </div>

      <button style={{ position: 'relative', top: 100 }} onClick={onToggle}>
        toggle zIndex
      </button>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
