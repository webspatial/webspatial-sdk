import { forwardRef, useRef } from 'react'

import { animated, useSpring } from '@react-spring/web'

// `withSpatialized2DElementContainer` was demoted to internal in v2 — the
// public mechanism for "this `<div>` should render as a spatial 2D
// container" is the `enable-xr` JSX marker. To pass a spatial-wrapped
// component to a third-party HOC like `animated(...)` (which expects a
// component type, not a JSX element), wrap your own `forwardRef` shim
// around `<div enable-xr ref={ref} />` and feed THAT to the third-party
// HOC. tsconfig `"jsxImportSource": "@webspatial/react-sdk"` is what
// makes the marker compile into the real spatial wrapper.
const SpatialDiv = forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithRef<'div'>
>(function SpatialDiv(props, ref) {
  return <div enable-xr ref={ref} {...props} />
})
SpatialDiv.displayName = 'SpatialDiv'

const AnimatedDiv = animated(SpatialDiv)

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
