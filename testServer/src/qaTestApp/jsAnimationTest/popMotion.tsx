import { useRef } from 'react'
import { animate } from 'popmotion'

export function PopmotionTest() {
  const ref = useRef<HTMLElement>(null)
  const refChild = useRef<HTMLDivElement>(null)

  const onChangeBack = () => {
    animate({
      from: 0,
      to: 100,
      onUpdate: latest => {
        if (ref.current) ref.current.style['--xr-back'] = latest
      },
    })
  }

  const onChangeOpacity = () => {
    animate({
      from: 1,
      to: 0.5,
      onUpdate: latest => {
        if (ref.current) ref.current.style.opacity = latest
      },
    })
  }

  const onChangeRotation = () => {
    animate({
      from: 360,
      to: 0,
      onUpdate: latest => {
        if (ref.current)
          ref.current.style.transform =
            'translate3d(0,0,0) rotateY(' + latest + 'deg)'
      },
    })
  }

  const onReset = () => {
    if (ref.current) {
      ref.current.style.opacity = 1
      ref.current.style['--xr-back'] = 0
      ref.current.style.transform = 'none'
    }
  }

  const onChangeBackChild = () => {
    animate({
      from: 0,
      to: 100,
      onUpdate: latest => {
        if (refChild.current) refChild.current.style['--xr-back'] = latest
      },
    })
  }

  const onChangeOpacityChild = () => {
    animate({
      from: 1,
      to: 0.5,
      onUpdate: latest => {
        if (refChild.current) refChild.current.style.opacity = latest
      },
    })
  }

  const onChangeRotationChild = () => {
    animate({
      from: 360,
      to: 0,
      onUpdate: latest => {
        if (refChild.current)
          refChild.current.style.transform =
            'translate3d(0,0,0) rotateY(' + latest + 'deg)'
      },
    })
  }

  const onResetChild = () => {
    if (refChild.current) {
      refChild.current.style.opacity = 1
      refChild.current.style['--xr-back'] = 0
      refChild.current.style.transform = 'none'
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="text-white">
        <center>Popmotion test</center>
      </div>
      <div
        enable-xr
        ref={ref}
        className="test-element w-64 h-32 rounded-lg bg-blue-50 bg-opacity-10 flex items-center justify-center text-white"
      >
        this is spatial div
        <div
          enable-xr
          ref={refChild}
          className="test-element w-64 h-32 rounded-lg bg-white bg-opacity-10 flex items-center justify-center text-white"
        >
          This is child spatial div
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <button className="btn btn-primary" onClick={onChangeBack}>
          start animate back
        </button>
        <button className="btn btn-primary" onClick={onChangeOpacity}>
          start animate opacity
        </button>
        <button className="btn btn-primary" onClick={onChangeRotation}>
          start animate transform
        </button>
        <button className="btn btn-primary" onClick={onReset}>
          reset
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <button className="btn btn-primary" onClick={onChangeBackChild}>
          start animate back
        </button>
        <button className="btn btn-primary" onClick={onChangeOpacityChild}>
          start animate opacity
        </button>
        <button className="btn btn-primary" onClick={onChangeRotationChild}>
          start animate transform
        </button>
        <button className="btn btn-primary" onClick={onResetChild}>
          reset
        </button>
      </div>
    </div>
  )
}
