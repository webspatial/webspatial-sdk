import { useRef } from 'react'

import { withSpatialized2DElementContainer } from '@webspatial/react-sdk'

import { animated, useSpring } from '@react-spring/web'

const AnimatedDiv = animated(withSpatialized2DElementContainer('div'))

export function ReactSpringTest() {
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

      <AnimatedDiv ref={ref} style={springProps} className="box">
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
