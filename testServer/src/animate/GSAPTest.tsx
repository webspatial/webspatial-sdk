// @ts-nocheck
import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(useGSAP)

export function GSAPTest() {
  const ref = useRef<HTMLElement>(null)

  ;(window as any).ref = ref

  const { contextSafe } = useGSAP({ scope: ref })

  const onChangeBack = contextSafe(() => {
    gsap.to(ref.current as HTMLElement, {
      rotation: 200,
      '--xr-back': 200,
      duration: 1,
      clearProps: 'all',
    })
  })

  const onChangeOpacity = contextSafe(() => {
    gsap.to(ref.current as HTMLElement, {
      opacity: 0.5,
      x: 200,
      duration: 1,
      clearProps: 'all',
    })
  })

  return (
    <div>
      <div className="text-white">this is GSAP test</div>
      <div>
        this is parent
        <div ref={ref} enable-xr className="box" />
      </div>

      <button className="btn btn-primary" onClick={onChangeBack}>
        start animate xr-back
      </button>
      <button className="btn btn-primary" onClick={onChangeOpacity}>
        start animate opacity
      </button>
    </div>
  )
}
