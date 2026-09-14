import React, { useEffect, useRef, useState } from 'react'
import { Btn, Pair, Panel, Scenario } from '../shared'

export default function Animation() {
  const [moved, setMoved] = useState(false)
  const [raised, setRaised] = useState(false)
  const [spin, setSpin] = useState(false)
  const [bob, setBob] = useState(false)
  const [jsBack, setJsBack] = useState(false)
  const [waapi, setWaapi] = useState(false)
  const [scrollTl, setScrollTl] = useState(false)
  const [back, setBack] = useState(0)
  const [registered, setRegistered] = useState(false)
  const frames = useRef(0)
  const [fps, setFps] = useState(0)
  const waapiRefs = useRef<Record<string, HTMLDivElement | null>>({
    dom: null,
    xr: null,
  })

  // JS-driven depth oscillation, one update per rAF
  useEffect(() => {
    if (!jsBack) return
    const t0 = performance.now()
    let raf = 0
    const tick = (t: number) => {
      setBack(80 + 80 * Math.sin((t - t0) / 300))
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [jsBack])

  useEffect(() => {
    if (!waapi) return
    const anims: Animation[] = []
    ;(['dom', 'xr'] as const).forEach(side => {
      const el = waapiRefs.current[side]
      if (!el?.animate) return
      anims.push(
        el.animate(
          [
            { transform: 'translateX(0) rotateZ(0deg)' },
            { transform: 'translateX(80px) rotateZ(20deg)' },
          ],
          { duration: 900, iterations: Infinity, direction: 'alternate' },
        ),
      )
    })
    return () => anims.forEach(a => a.cancel())
  }, [waapi])

  // frame counter to spot dropped frames while panels animate
  useEffect(() => {
    let raf = 0,
      last = performance.now()
    const tick = (t: number) => {
      frames.current++
      if (t - last > 1000) {
        setFps(frames.current)
        frames.current = 0
        last = t
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const register = () => {
    try {
      // Makes --xr-back interpolable. Risk: may conflict with SDK parsing — that outcome is itself the finding.
      const css = CSS as typeof CSS & {
        registerProperty?: (descriptor: {
          name: string
          syntax: string
          inherits: boolean
          initialValue: string
        }) => void
      }
      if (!css.registerProperty) {
        throw new Error('CSS.registerProperty is not available')
      }
      css.registerProperty({
        name: '--xr-back',
        syntax: '<number>',
        inherits: false,
        initialValue: '0',
      })
      setRegistered(true)
    } catch (e) {
      alert(`registerProperty failed: ${(e as Error).message}`)
    }
  }

  const css = [
    `.anim {`,
    `  transition: transform 600ms ease, --xr-back 600ms ease;`,
    moved ? `  transform: translateX(160px);` : `  transform: none;`,
    raised ? `  --xr-back: 160;` : `  /* --xr-back not set by .raised */`,
    spin ? `  animation: spin 2s linear infinite;` : `  /* no spin */`,
    bob ? `  animation: bob 1.5s ease-in-out infinite;` : `  /* no bob */`,
    `}`,
    jsBack
      ? `.panel { --xr-back: ${back.toFixed(1)}; }  /* rAF inline, stylesheet omitted */`
      : `/* --xr-back owned by stylesheet / .raised */`,
    waapi
      ? `el.animate([{transform:'none'},{transform:'translateX(80px) rotateZ(20deg)'}], {duration:900, iterations:Infinity})`
      : `/* WAAPI off */`,
    scrollTl
      ? `.anim.scroll-tl { animation: spin linear; animation-timeline: scroll(); }`
      : `/* scroll-driven timeline off */`,
    `CSS.registerProperty(--xr-back) = ${registered}`,
  ].join('\n')

  return (
    <Scenario
      title="Animation"
      expect="transform transition, @keyframes, WAAPI el.animate() (Framer Motion), JS per-frame, and animation-timeline: scroll() all run on both columns. Depth (--xr-back) only interpolates if registered as <number>. WebCore should own every timeline."
      watch="Native panel jumps or samples root props once (not per frame); WAAPI runs on the host but not the spatial surface; scroll-driven animation ignores portal/host scroll mismatch; depth snaps unless registered."
      controls={
        <>
          <Btn
            on={moved}
            hint=".anim.moved { transform: translateX(160px); }  /* transition 600ms */"
            onClick={() => setMoved(!moved)}
          >
            transition transform (translateX)
          </Btn>
          <Btn
            on={spin}
            hint=".anim.spin { animation: spin 2s linear infinite; } @keyframes spin { to { transform: rotateZ(360deg); } }"
            onClick={() => setSpin(!spin)}
          >
            keyframes spin
          </Btn>
          <Btn
            on={raised}
            hint=".anim.raised { --xr-back: 160; }  /* transition --xr-back 600ms — snaps unless registered */"
            onClick={() => setRaised(!raised)}
          >
            transition --xr-back 0→160
          </Btn>
          <Btn
            on={bob}
            hint="@keyframes bob { 0%,100% { --xr-back: 0; } 50% { --xr-back: 160; } }"
            onClick={() => setBob(!bob)}
          >
            keyframes --xr-back bob
          </Btn>
          <Btn
            on={jsBack}
            hint=".panel { --xr-back: <rAF sin wave>; }  /* inline each frame, not a CSS transition */"
            onClick={() => setJsBack(!jsBack)}
          >
            rAF-driven --xr-back
          </Btn>
          <Btn
            on={waapi}
            hint="el.animate([...], { duration: 900, iterations: Infinity })  /* Framer Motion / WAAPI */"
            onClick={() => setWaapi(!waapi)}
          >
            WAAPI el.animate()
          </Btn>
          <Btn
            on={scrollTl}
            hint=".anim { animation: spin linear; animation-timeline: scroll(); }  /* scroll this page */"
            onClick={() => setScrollTl(!scrollTl)}
          >
            animation-timeline: scroll()
          </Btn>
          <Btn
            on={registered}
            disabled={registered}
            hint="CSS.registerProperty({ name: '--xr-back', syntax: '<number>', inherits: false, initialValue: '0' })"
            onClick={register}
          >
            CSS.registerProperty(--xr-back)
          </Btn>
        </>
      }
      css={css}
      readout={`rAF frames/sec: ${fps}   js back: ${back.toFixed(1)}   registered: ${registered}`}
    >
      <Pair
        render={xr => (
          <div style={{ padding: 12 }}>
            <Panel
              xr={xr}
              ref={el => {
                waapiRefs.current[xr ? 'xr' : 'dom'] = el
              }}
              back={jsBack ? back : null}
              className={`anim ${moved ? 'moved' : ''} ${raised ? 'raised' : ''} ${spin ? 'spin' : ''} ${bob ? 'bob' : ''} ${scrollTl ? 'scroll-tl' : ''}`}
              style={{ flexDirection: 'column', gap: 8 }}
            >
              panel root
              <div
                className={`panel small anim ${moved ? 'moved' : ''} ${spin ? 'spin' : ''}`}
                style={{ background: '#b5562f', position: 'relative' }}
              >
                ordinary child
              </div>
            </Panel>
          </div>
        )}
        height={200}
      />
    </Scenario>
  )
}
