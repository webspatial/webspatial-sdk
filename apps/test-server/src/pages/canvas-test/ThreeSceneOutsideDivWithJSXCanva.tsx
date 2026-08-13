import { useRef } from 'react'

const ThreeSceneOutsideDivWithCanvas = () => {
  const refCanvas = useRef(null)

  // useEffect(() => {
  //   const canvas = refCanvas.current as any

  //   const { renderer } = createScene(canvas)

  //   return () => {
  //     destroyScene(renderer)
  //   }
  // }, [])

  const readyRef = useRef(false)

  const ref = (spatialDivElement: HTMLDivElement | null) => {
    console.log('dbg ThreeSceneOutsideDiv ref', spatialDivElement)

    if (spatialDivElement) {
      readyRef.current = true
    }
  }

  const refInnerDiv = (spatialDivElement: HTMLDivElement | null) => {
    console.log('dbg ThreeSceneOutsideDiv refInnerDiv', spatialDivElement)
    if (readyRef.current && spatialDivElement) {
      // const { renderer } = createScene(canvas)
    }
  }

  return (
    <div
      enable-xr
      ref={ref}
      style={{
        marginTop: '100px',
        marginLeft: '10%',
        width: '80%',
        height: '100%',
        '--xr-background-material': 'translucent',
        '--xr-back': 300,
      }}
    >
      <canvas
        ref={refCanvas}
        width="500"
        height="500"
        style={{ width: '500px', height: '500px' }}
      />
      <div id="footer" ref={refInnerDiv}>
        {' '}
        footer{' '}
      </div>
    </div>
  )
}

export default ThreeSceneOutsideDivWithCanvas
