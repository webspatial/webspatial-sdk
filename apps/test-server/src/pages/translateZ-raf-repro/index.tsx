import React, { useCallback, useEffect, useRef, useState } from 'react'
import { enableDebugTool } from '@webspatial/react-sdk'

enableDebugTool()

const finalZ = 200
const totalFrames = 240
const deltaZ = finalZ / totalFrames
const deltaAngleY = 60 / totalFrames

export default function TranslateZRafRepro() {
  const divRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number | null>(null)
  const [running, setRunning] = useState(false)
  const [status, setStatus] = useState('Idle')

  const stopAnimation = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    setRunning(false)
  }, [])

  const reset = useCallback(() => {
    stopAnimation()
    if (divRef.current) {
      divRef.current.style.transform = 'translateZ(0px) rotateY(0deg)'
    }
    setStatus('Reset to translateZ(0px) rotateY(0deg)')
  }, [stopAnimation])

  const startAnimation = useCallback(() => {
    stopAnimation()

    let direction = 1
    let z = 0
    let yAngle = 0
    let frame = 0
    setRunning(true)

    const tick = () => {
      z += deltaZ * direction
      yAngle += deltaAngleY * direction

      if (divRef.current) {
        divRef.current.style.transform = `translateZ(${z}px) rotateY(${yAngle}deg)`
      }
      setStatus(`frame=${frame} z=${z.toFixed(3)} angleY=${yAngle.toFixed(3)}`)

      if (z >= finalZ) {
        direction = -1
      }

      frame += 1
      if (z > 0) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        rafRef.current = null
        setRunning(false)
      }
    }

    tick()
  }, [stopAnimation])

  useEffect(() => stopAnimation, [stopAnimation])

  return (
    <div className="p-10 text-white min-h-screen">
      <h1 className="text-2xl mb-4">translateZ RAF Repro</h1>
      <p className="text-gray-300 mb-4 max-w-2xl">
        Reproduces rapid requestAnimationFrame updates of a spatial div
        transform from translateZ(0px) to translateZ(200px), with rotateY, and
        back.
      </p>
      <div className="flex gap-3 mb-4">
        <button
          className="px-4 py-2 rounded bg-blue-600 disabled:bg-gray-600"
          disabled={running}
          onClick={startAnimation}
        >
          Start animation
        </button>
        <button className="px-4 py-2 rounded bg-gray-700" onClick={reset}>
          Reset
        </button>
      </div>
      <div className="text-sm text-gray-300 mb-8" data-testid="repro-status">
        {status}
      </div>
      <div className="h-[360px] flex items-center justify-center border border-gray-700 rounded-lg bg-black/20">
        <div
          enable-xr
          ref={divRef}
          data-testid="translatez-raf-target"
          className="w-64 h-64 rounded-xl bg-gradient-to-br from-green-400 to-emerald-700 shadow-2xl flex items-center justify-center text-black font-bold"
          style={{ transform: 'translateZ(0px) rotateY(0deg)' }}
        >
          Spatial div
        </div>
      </div>
    </div>
  )
}
