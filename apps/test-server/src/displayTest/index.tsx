import ReactDOM from 'react-dom/client'
import { CSSProperties, useEffect, useRef, useState } from 'react'
import { enableDebugTool } from '@webspatial/react-sdk'

enableDebugTool()

function CustomComponent(props: {
  visible: boolean
  childDivVisible: boolean
}) {
  const [color, setColor] = useState('blue')

  const onToggleColor = () => {
    setColor(v => (v === 'blue' ? 'green' : 'blue'))
  }

  const styleForSpatialDiv: CSSProperties = {
    position: 'relative',
    top: '-30px',
    height: '100px',
    backgroundColor: color,
    '--xr-back': 30,
    display: props.visible ? 'block' : 'none',
  }

  const childDivVisibleStyle: CSSProperties = {
    display: props.childDivVisible ? 'block' : 'none',
    '--xr-back': 30,
    '--xr-background-material': 'translucent',
  }

  const childRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    ;(window as any).refChild = childRef
    ;(window as any).parentRef = parentRef
  }, [])

  const parentRef = useRef<HTMLDivElement>(null)

  return (
    <div
      enable-xr
      style={styleForSpatialDiv}
      onClick={onToggleColor}
      ref={parentRef}
    >
      this is spatial div
      <div enable-xr style={childDivVisibleStyle} ref={childRef}>
        this is child spatial div
      </div>
    </div>
  )
}

function GridComponent() {
  const style = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gridTemplateRows: '1fr 1fr',
    gap: '10px',
    '--xr-back': 1,
  }
  return (
    <div enable-xr style={style}>
      <div style={{ backgroundColor: 'red' }}>1</div>
      <div style={{ backgroundColor: 'blue' }}>2</div>
      <div style={{ backgroundColor: 'green' }}>3</div>
      <div style={{ backgroundColor: 'yellow' }}>4</div>
    </div>
  )
}

function InlineComponent() {
  const style = {
    '--xr-back': 120,
  }
  return (
    <p
      enable-xr
      style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <a style={style}>
        Edit <code>src/App.tsx</code> and save to test HMR
      </a>
    </p>
  )
}

function App() {
  const [color, setColor] = useState('red')
  const onChangeBackgroundColor = () => {
    setColor(v => (v === 'red' ? 'blue' : 'red'))
  }

  const style = {
    backgroundColor: color,
  }

  const [visible, setVisible] = useState(true)

  const onToggleVisible = () => {
    setVisible(v => !v)
  }

  const [childDivVisible, setChildDivVisible] = useState(true)

  const onToggleChildVisible = () => {
    setChildDivVisible(v => !v)
  }

  return (
    <>
      <div className="text-blue  	bg-clip-border px-6 py-6  ">
        <a href="#" onClick={() => history.go(-1)}>
          Go Back
        </a>
      </div>

      <div className="text-orange-200 mx-2.5 my-2.5">
        <button style={style} onClick={onChangeBackgroundColor}>
          toggle background color:
        </button>
      </div>

      <CustomComponent
        visible={visible}
        childDivVisible={childDivVisible}
      ></CustomComponent>

      <div className="text-orange-200 mx-2.5 my-2.5">
        <button onClick={onToggleVisible}>toggle spatialdiv display</button>
      </div>

      <div className="text-orange-200 mx-2.5 my-2.5">
        <button onClick={onToggleChildVisible}>
          toggle child spatialdiv display
        </button>
      </div>

      <GridComponent />

      <InlineComponent />
    </>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
