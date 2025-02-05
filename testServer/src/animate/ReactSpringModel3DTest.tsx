import { useRef } from 'react'

import { CSSModel3D } from '@xrsdk/react'

import { animated, useSpring } from '@react-spring/web'

const AnimatedModel3D = animated(CSSModel3D)

export function ReactSpringModel3DTest() {
  const ref = useRef<HTMLDivElement>(null)

  const [springProps, setSpringProps] = useSpring(() => ({
    opacity: 1,
    transform: 'translateX(0px)',
    '--xr-back': '10',
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

      <AnimatedModel3D
        ref={ref}
        style={springProps}
        className="box"
        modelUrl="/src/assets/FlightHelmet.usdz"
      />

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
