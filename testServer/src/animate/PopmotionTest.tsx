import { useRef } from 'react'
import { animate } from 'popmotion'

export function PopmotionTest() {
  const ref = useRef<HTMLElement>(null)

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
      to: 0,
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

  return (
    <div>
      <div className="text-white"> this is popmotion test</div>
      <div enable-xr ref={ref} className="box">
        this is spatial div
      </div>
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
  )
}
