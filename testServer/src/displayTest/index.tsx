import ReactDOM from 'react-dom/client'
import { CSSProperties, useEffect, useRef, useState } from 'react'
import { enableDebugTool } from '@xrsdk/react'

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
      debugName="PARENT"
      ref={parentRef}
    >
      this is spatial div
      <div
        enable-xr
        style={childDivVisibleStyle}
        ref={childRef}
        debugName="child"
      >
        this is child spatial div
      </div>
    </div>
  )
}

function VisibleRefComponent() {
  const ref = useRef<HTMLElement>(null)

  const onClick = () => {
    ref.current.style.display =
      ref.current.style.display !== 'none' ? 'none' : 'block'
  }

  useEffect(() => {
    ;(window as any).ref = ref
  }, [])

  return (
    <div>
      <div enable-xr ref={ref} style={{ '--xr-back': 10 }}>
        this is visible ref div
      </div>
      <button onClick={onClick}> toggle visibility by ref </button>
    </div>
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

      <VisibleRefComponent />
    </>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
