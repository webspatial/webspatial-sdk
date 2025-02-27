import { useRef } from 'react'
import { Easing, Tween } from '@tweenjs/tween.js'

function applyTeen(tween) {
  function animate() {
    tween.update()
    if (tween.isPlaying()) {
      requestAnimationFrame(animate)
    }
  }
  animate()
}

export function TeenjsTest() {
  const ref = useRef<HTMLElement>(null)

  const onChangeBack = () => {
    const tween = new Tween({ v: 0 })
      .to({ v: 100 }, 1000)
      .easing(Easing.Quadratic.InOut)
      .onUpdate(o => {
        if (ref.current) ref.current.style['--xr-back'] = o.v
      })
      .start()
    applyTeen(tween)
  }

  const onChangeOpacity = () => {
    const tween = new Tween({ v: 1 })
      .to({ v: 0.5 }, 1000)
      .easing(Easing.Quadratic.InOut)
      .onUpdate(o => {
        if (ref.current) ref.current.style.opacity = o.v
      })
      .start()
    applyTeen(tween)
  }

  const onChangeRotation = () => {
    const tween = new Tween({ v: 0 })
      .to({ v: 360 }, 1000)
      .onUpdate(o => {
        if (ref.current)
          ref.current.style.transform = 'rotateY(' + o.v + 'deg) '
      })
      .start()
    applyTeen(tween)
  }

  const onReset = () => {
    if (ref.current) {
      ref.current.style.opacity = 1
      ref.current.style['--xr-back'] = 0
      ref.current.style.transform = 'none'
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="text-white">this is tweenjs test</div>
      <div
        enable-xr
        ref={ref}
        className="test-element w-64 h-32 rounded-lg bg-white bg-opacity-10 flex items-center justify-center text-white"
      >
        test Box
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
