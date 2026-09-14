import React, { useEffect, useRef, useState } from 'react'
import { Btn, Pair, Panel, Scenario, useLog } from '../shared'

let mounts = 0,
  unmounts = 0

function Probe({
  xr,
  push,
  back,
}: {
  xr: boolean
  push: (s: string) => void
  back: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [info, setInfo] = useState('')
  useEffect(() => {
    const el = ref.current!
    const t0 = performance.now()
    mounts++
    push(`${xr ? 'xr ' : 'dom'} mount #${mounts}`)

    const ro = new ResizeObserver(([e]) =>
      push(
        `${xr ? 'xr ' : 'dom'} ResizeObserver ${e.contentRect.width}x${e.contentRect.height}`,
      ),
    )
    ro.observe(el)
    const io = new IntersectionObserver(
      ([e]) =>
        push(
          `${xr ? 'xr ' : 'dom'} IntersectionObserver ratio=${e.intersectionRatio.toFixed(2)}`,
        ),
      { threshold: [0, 0.5, 1] },
    )
    io.observe(el)
    // Does the SDK mutate the host element itself? (attributes/style/children)
    const mo = new MutationObserver(ms =>
      push(
        `${xr ? 'xr ' : 'dom'} MutationObserver ${ms.length} ${ms.map(m => m.type + ':' + (m.attributeName ?? '')).join(',')}`,
      ),
    )
    mo.observe(el, { attributes: true, childList: true, subtree: true })

    // Sample geometry + hit-test after spatial creation may have finished (async)
    const sample = (label: string) => {
      const r = el.getBoundingClientRect()
      const hit = document.elementFromPoint(
        r.x + r.width / 2,
        r.y + r.height / 2,
      )
      const hitDesc = hit
        ? `${hit.tagName.toLowerCase()}.${(hit as HTMLElement).className?.toString().split(' ')[0]}`
        : 'null'
      setInfo(
        `rect ${r.width.toFixed(0)}x${r.height.toFixed(0)} @ (${r.x.toFixed(0)},${r.y.toFixed(0)})  offsetParent=${el.offsetParent?.tagName ?? 'null'}  elementFromPoint=${hitDesc}  isSelf=${hit === el || el.contains(hit)}`,
      )
      push(
        `${xr ? 'xr ' : 'dom'} sampled ${label} +${(performance.now() - t0).toFixed(0)}ms`,
      )
    }
    sample('mount')
    const t1 = setTimeout(() => sample('t+100'), 100)
    const t2 = setTimeout(() => sample('t+1000'), 1000)

    return () => {
      unmounts++
      push(`${xr ? 'xr ' : 'dom'} unmount #${unmounts}`)
      ro.disconnect()
      io.disconnect()
      mo.disconnect()
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [xr, push])

  return (
    <div>
      <Panel xr={xr} ref={ref} back={back}>
        probe back={back}
      </Panel>
      <div className="text-xs text-gray-400 mt-2 font-mono">{info}</div>
    </div>
  )
}

export default function DomApis() {
  const [key, setKey] = useState(0)
  const [shown, setShown] = useState(true)
  const [back, setBack] = useState(80)
  const [log, push, clear] = useLog(24)

  return (
    <Scenario
      title="DOM APIs and geometry"
      expect="One mount/unmount per remount on each side. getBoundingClientRect returns the visible 2D geometry and should not change when only --xr-back changes. elementFromPoint at the panel's center returns the panel (isSelf=true). Observers fire once per real change. MutationObserver stays quiet unless the app changes the element. ref.current is the host in the main document."
      watch="Duplicate mount/unmount from a duplicated render branch; rect describes a hidden host that differs from the drawn surface; depth-only change rewriting x/y/w/h; elementFromPoint returns something else; SDK-driven mutations on the host; geometry changing between mount and t+1000 as spatial creation completes."
      controls={
        <>
          <Btn
            hint="React key++ remounts the Pair — CSS unchanged; observers / mount counts reset"
            onClick={() => setKey(k => k + 1)}
          >
            remount (key++)
          </Btn>
          <Btn
            on={shown}
            hint={
              shown ? 'unmount the Pair (display gone)' : 'mount the Pair again'
            }
            onClick={() => setShown(!shown)}
          >
            {shown ? 'unmount' : 'mount'}
          </Btn>
          <Btn
            hint={`.panel { --xr-back: ${back === 80 ? 160 : 80}; }  /* 2D width/height should stay 200×120 */`}
            onClick={() => setBack(b => (b === 80 ? 160 : 80))}
          >
            depth only --xr-back {back}
          </Btn>
          <Btn onClick={clear}>clear log</Btn>
        </>
      }
      css={`.panel { width: 200px; height: 120px; --xr-back: ${back}; }\n/* depth-only change must not rewrite getBoundingClientRect w/h */`}
      readout={log}
    >
      {shown && (
        <Pair
          key={key}
          render={xr => <Probe xr={xr} push={push} back={back} />}
          height={180}
        />
      )}
    </Scenario>
  )
}
