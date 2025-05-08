// @ts-nocheck
import { useRef } from 'react'
import anime from 'animejs/lib/anime.es.js'

export function AnimeTest() {
  const ref = useRef<HTMLElement>(null)

  const onChangeBack = () => {
    const object = {
      back: 0,
    }

    anime({
      targets: object,
      easing: 'linear',
      back: 100,
      duration: 1000,
      update: function () {
        if (ref.current) ref.current.style['--xr-back'] = object.back
      },
    })
  }

  const onChangeOpacity = () => {
    anime({
      targets: ref.current,
      opacity: 0.5,
      translateX: 100,
    })
  }

  const onChangeRotation = () => {
    anime({
      targets: ref.current,
      rotate: 180,
      translateZ: 100,
    })
  }

  const onReset = () => {
    if (ref.current) {
      ref.current.style.opacity = 1
      ref.current.style['--xr-back'] = 0
      ref.current.style.transform = 'none'
    }
  }

  const initialStyle = {
    opacity: 1,
    '--xr-back': 0,
    transform: 'none',
    '--my-color': 'red',
  }

  return (
    <div>
      <div className="text-white"> this is AnimeJS test</div>
      <div enable-xr ref={ref} style={initialStyle} className="box">
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
