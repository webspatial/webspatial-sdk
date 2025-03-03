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
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="text-white">
        <center>this is GSAP test</center>
      </div>
      <div
        enable-xr
        className="test-element w-64 h-32 rounded-lg bg-white bg-opacity-10 flex items-center justify-center text-white"
      >
        this is parent
        <div
          enable-xr
          style={{ '--xr-back': '100' }}
          ref={ref}
          className="test-element w-64 h-32 rounded-lg bg-white bg-opacity-10 flex items-center justify-center text-white"
        >
          This is child
        </div>
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
