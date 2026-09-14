import React, { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Btn, Pair, Panel, Scenario, useLog } from '../shared'

/**
 * 6b — Anchored portals (SPLIT, ASYNC).
 * Radix / MUI / Floating UI: portal to document.body, position from the
 * trigger's getBoundingClientRect (or CSS anchor positioning). autoUpdate
 * listens to *host* scrollers. The float can land at root depth behind a
 * raised panel, or track the hidden placeholder rect instead of the drawn
 * surface. Decision: inherit the trigger's plane, or stay flat.
 */
type Pos = { top: number; left: number; width: number; height: number }
type Side = 'dom' | 'xr'

function anchorNameFor(side: Side) {
  return `--lab-trigger-${side}`
}

function Floating({
  xr,
  open,
  pos,
  useAnchor,
  onClose,
}: {
  xr: boolean
  open: boolean
  pos: Pos | null
  useAnchor: boolean
  onClose: () => void
}) {
  if (!open || !pos) return null
  const side: Side = xr ? 'xr' : 'dom'
  const style: React.CSSProperties = useAnchor
    ? ({
        position: 'absolute',
        positionAnchor: anchorNameFor(side),
        top: 'anchor(bottom)',
        left: 'anchor(left)',
        marginTop: 8,
      } as React.CSSProperties)
    : {
        position: 'fixed',
        top: pos.top + pos.height + 8,
        left: pos.left,
      }
  return createPortal(
    <div
      className="lab-float"
      data-xr={xr ? '1' : '0'}
      style={{
        ...style,
        zIndex: 9999,
        minWidth: 160,
        padding: 12,
        borderRadius: 8,
        background: '#ffd166',
        color: '#000',
        fontSize: 12,
      }}
    >
      floating {side} @ {pos.left.toFixed(0)},{pos.top.toFixed(0)}
      <div>
        <button className="underline mt-1" onClick={onClose}>
          close
        </button>
      </div>
    </div>,
    document.body,
  )
}

export default function AnchoredPortals() {
  const [open, setOpen] = useState(false)
  const [useAnchor, setUseAnchor] = useState(false)
  const [raised, setRaised] = useState(true)
  const [pos, setPos] = useState<Record<Side, Pos | null>>({
    dom: null,
    xr: null,
  })
  const domRef = useRef<HTMLDivElement>(null)
  const xrRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [log, push, clear] = useLog(16)

  const measure = useCallback(
    (side: Side, reason?: string) => {
      const el = side === 'xr' ? xrRef.current : domRef.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const next = {
        top: r.top,
        left: r.left,
        width: r.width,
        height: r.height,
      }
      setPos(p => ({ ...p, [side]: next }))
      push(
        `${side}${reason ? ` ${reason}` : ''} trigger rect x=${r.x.toFixed(1)} y=${r.y.toFixed(1)} w=${r.width.toFixed(1)} h=${r.height.toFixed(1)}`,
      )
    },
    [push],
  )

  useEffect(() => {
    if (!open) return
    const on = (e: Event) => {
      const src =
        e.currentTarget === window
          ? e.target instanceof Element
            ? e.target.className || e.target.tagName
            : 'window'
          : 'lab-anchor-scroll'
      measure('dom', `autoUpdate ${e.type} ${src}`)
      measure('xr', `autoUpdate ${e.type} ${src}`)
    }
    window.addEventListener('scroll', on, true)
    window.addEventListener('resize', on)
    return () => {
      window.removeEventListener('scroll', on, true)
      window.removeEventListener('resize', on)
    }
  }, [open, measure])

  const css = [
    `.panel.trigger { --xr-back: ${raised ? 120 : 0}; }`,
    useAnchor
      ? `.trigger-dom { anchor-name: --lab-trigger-dom; }\n.trigger-xr { anchor-name: --lab-trigger-xr; }\n.lab-float { position: absolute; position-anchor: --lab-trigger-*; top: anchor(bottom); left: anchor(left); }`
      : `.lab-float { position: fixed; top: triggerRect.bottom+8; left: triggerRect.left; }`,
    `createPortal(float, document.body)  /* root depth — not the trigger plane */`,
    `autoUpdate ← host scroll (capture) + resize + .lab-anchor-scroll`,
  ].join('\n')

  return (
    <Scenario
      title="Anchored portals"
      expect="The float (portaled to document.body) sits just below the visible trigger, including a raised spatial trigger. Host-scroller autoUpdate keeps it attached. CSS anchor positioning, when on, uses the trigger as the anchor. Decision: inherit the trigger's plane, or stay flat on the page."
      watch="Float lands at root depth behind the raised panel; getBoundingClientRect is the hidden host placeholder, not the drawn surface; autoUpdate misses portal-document scroll; CSS anchor-name is not copied into the spatial tree."
      controls={
        <>
          <Btn
            on={open}
            hint="createPortal(float, document.body) positioned from trigger.getBoundingClientRect()"
            onClick={() => {
              const next = !open
              setOpen(next)
              if (next) {
                requestAnimationFrame(() => {
                  measure('dom', 'open')
                  measure('xr', 'open')
                })
              }
            }}
          >
            {open ? 'close floats' : 'open floats'}
          </Btn>
          <Btn
            on={useAnchor}
            hint=".trigger { anchor-name: --lab-trigger-* } .lab-float { top: anchor(bottom) }"
            onClick={() => setUseAnchor(!useAnchor)}
          >
            CSS anchor positioning
          </Btn>
          <Btn
            on={raised}
            hint=".panel.trigger { --xr-back: 120 }  /* float may stay on the page plane */"
            onClick={() => setRaised(!raised)}
          >
            raise trigger
          </Btn>
          <Btn onClick={clear}>clear log</Btn>
        </>
      }
      css={css}
      readout={log || 'open the floats, then scroll this box / the page'}
    >
      <div ref={scrollRef} className="lab-anchor-scroll">
        <div className="lab-anchor-filler">scroll this box (host scroller)</div>
        <Pair
          render={xr => {
            const side: Side = xr ? 'xr' : 'dom'
            return (
              <>
                <Panel
                  xr={xr}
                  ref={side === 'xr' ? xrRef : domRef}
                  back={raised ? 120 : 0}
                  className={`small trigger trigger-${side}`}
                  style={
                    {
                      anchorName: useAnchor ? anchorNameFor(side) : undefined,
                    } as React.CSSProperties
                  }
                >
                  <button
                    className="px-2 py-1 bg-white text-black rounded text-xs"
                    onClick={() => {
                      setOpen(true)
                      requestAnimationFrame(() => measure(side, 'trigger'))
                    }}
                  >
                    trigger
                  </button>
                </Panel>
                <Floating
                  xr={xr}
                  open={open}
                  pos={pos[side]}
                  useAnchor={useAnchor}
                  onClose={() => setOpen(false)}
                />
              </>
            )
          }}
          height={200}
        />
        <div className="lab-anchor-filler">more scroll room</div>
      </div>
    </Scenario>
  )
}
