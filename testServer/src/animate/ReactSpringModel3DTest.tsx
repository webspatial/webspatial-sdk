import { useRef } from 'react'

import { Model } from '@webspatial/react-sdk'

import { animated, useSpring } from '@react-spring/web'

const AnimatedModel3D = animated(Model)

export function ReactSpringModel3DTest() {
  const ref = useRef<any>(null)

  const [springProps, setSpringProps] = useSpring(() => ({
    opacity: 1,
    transform: 'translateX(0px)',
    '--xr-back': '10',
    width: '100px',
    height: '100px',
  }))

  const onChangeBack = () => {
    setSpringProps.start({
      '--xr-back': '100',
    })
  }

  const onChangeOpacity = () => {
    setSpringProps.start({
      opacity: 0.5,
    })
  }

  const onChangeTransform = () => {
    setSpringProps.start({
      transform: 'translateX(1000px)',
    })
  }

  const onReset = () => {
    setSpringProps.set({
      opacity: 1,
      transform: 'translateX(0px)',
      '--xr-back': '10',
    })
  }

  return (
    <div>
      <div className="text-white">this is react spring test</div>

      <AnimatedModel3D ref={ref} style={springProps} className="box">
        <source
          src="http://localhost:5173/src/assets/FlightHelmet.usdz"
          type="model/vnd.usdz+zip"
        />

        <div> this is place holder when failure </div>
      </AnimatedModel3D>

      <button className="btn btn-primary" onClick={onChangeBack}>
        start animate xr-back
      </button>
      <button className="btn btn-primary" onClick={onChangeOpacity}>
        start animate opacity
      </button>

      <button className="btn btn-primary" onClick={onChangeTransform}>
        start animate transform
      </button>

      <button className="btn btn-primary" onClick={onReset}>
        reset
      </button>
    </div>
  )
}
