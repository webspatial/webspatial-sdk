import { useRef } from 'react'

import { CSSSpatialDiv } from '@webspatial/react-sdk'

import { animated, useSpring } from '@react-spring/web'

const AnimatedDiv = animated(CSSSpatialDiv)

export function ReactSpringTest() {
  const ref = useRef<HTMLElement>(null)

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
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="text-white">
        <center>this is react spring test</center>
      </div>

      <AnimatedDiv
        ref={ref}
        style={springProps}
        className="test-element w-64 h-32 rounded-lg bg-white bg-opacity-10 flex items-center justify-center text-white"
      >
        this is spatial div
      </AnimatedDiv>

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
