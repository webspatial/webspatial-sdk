import React, { useEffect, useRef, useState } from 'react'
import { Btn, Pair, Panel, Scenario, useLog } from '../shared'

let instanceCounter = 0

function LifecycleChild({
  xr,
  push,
}: {
  xr: boolean
  push: (s: string) => void
}) {
  const instance = useRef(0)
  useEffect(() => {
    if (!instance.current) instance.current = ++instanceCounter
    const id = instance.current
    push(`${xr ? 'xr' : 'dom'} child instance ${id}: effect setup`)
    return () =>
      push(`${xr ? 'xr' : 'dom'} child instance ${id}: effect cleanup`)
  }, [xr, push])
  return (
    <label className="text-xs">
      uncontrolled
      <input
        className="ml-2 px-2 py-1 text-black text-xs rounded w-32"
        defaultValue="edit before remount"
      />
    </label>
  )
}

export default function Lifecycle() {
  const [mounted, setMounted] = useState(true)
  const [generation, setGeneration] = useState(0)
  const [log, push, clear] = useLog(24)

  return (
    <Scenario
      title="Mount, ready, and cleanup"
      expect="One setup/cleanup per instance on each side. Changing the child key remounts only the child (new instance id; uncontrolled input resets). onSpatialContentReady fires on the xr side when spatial content is actually ready — not on the plain-web fallback."
      watch="Duplicate setup without cleanup; ready firing on the DOM twin; ready never firing on a spatial runtime; input state surviving a key change; StrictMode replay mistaken for a Hybrid bug (dev may log setup → cleanup → setup on the same instance)."
      controls={
        <>
          <Btn
            on={mounted}
            hint={
              mounted
                ? 'unmount <div enable-xr> — watch effect cleanup / ready'
                : 'mount <div enable-xr onSpatialContentReady> — watch setup / ready'
            }
            onClick={() => setMounted(!mounted)}
          >
            {mounted ? 'unmount panel' : 'mount panel'}
          </Btn>
          <Btn
            hint="<LifecycleChild key={n+1} /> — remount child only; uncontrolled input resets"
            onClick={() => setGeneration(g => g + 1)}
          >
            change child key ({generation})
          </Btn>
          <Btn onClick={clear}>clear log</Btn>
        </>
      }
      css={`.panel { --xr-back: 80; }\n/* mounted: ${mounted} */\n/* child key / generation: ${generation} */\n/* onSpatialContentReady attached on the xr column only */`}
      readout={log || 'mount / ready / cleanup events appear here'}
    >
      {mounted && (
        <Pair
          render={xr => (
            <Panel
              xr={xr}
              back={80}
              style={{ flexDirection: 'column', gap: 8 }}
              onSpatialContentReady={
                xr ? () => push('xr SDK spatial content ready') : undefined
              }
            >
              generation {generation}
              <LifecycleChild key={generation} xr={xr} push={push} />
            </Panel>
          )}
          height={180}
        />
      )}
    </Scenario>
  )
}
