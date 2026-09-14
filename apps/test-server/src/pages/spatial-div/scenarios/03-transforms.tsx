import React, { useRef, useState } from 'react'
import { Btn, Pair, Panel, Scenario, Slider, useRect } from '../shared'

export default function Transforms() {
  const [rotY, setRotY] = useState(20)
  const [back, setBack] = useState(80)
  const [innerBack, setInnerBack] = useState(40)
  const [nested, setNested] = useState(true)
  const [persp, setPersp] = useState(false)
  const [tz, setTz] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const rect = useRect(ref)

  const css = [
    persp
      ? `.persp { perspective: 600px; }  /* lab.css on grandparent */`
      : `/* no perspective */`,
    `.tilt-parent {`,
    `  transform: rotateY(${rotY}deg) translateZ(${tz}px);  /* inline */`,
    `  transform-style: preserve-3d;`,
    `}`,
    `.panel.outer { --xr-back: ${back}; }`,
    nested
      ? `.panel.inner { --xr-back: ${innerBack}; width: 120px; height: 72px; }`
      : `/* no nested panel */`,
  ].join('\n')

  return (
    <Scenario
      title="Floating, transforms, and nesting"
      expect="Panel is a child of the rotated parent: its 2D projection follows the parent transform, and --xr-back adds depth along the parent's local Z. Nested panel composes again on top of that."
      watch="Local --xr-back forwarded but parent rotateY ignored (panel stays flat), or parent transform applied twice; nested panel depth not accumulating; changes to parent transform not re-synced."
      controls={
        <>
          <Slider
            label="parent rotateY"
            value={rotY}
            min={-60}
            max={60}
            onChange={setRotY}
            hint={`.tilt-parent { transform: rotateY(${rotY}deg) translateZ(${tz}px); }`}
          />
          <Slider
            label="parent translateZ"
            value={tz}
            min={-100}
            max={100}
            onChange={setTz}
            hint={`.tilt-parent { transform: rotateY(${rotY}deg) translateZ(${tz}px); }`}
          />
          <Slider
            label="panel --xr-back"
            value={back}
            min={0}
            max={200}
            onChange={setBack}
            hint={`.panel.outer { --xr-back: ${back}; }`}
          />
          <Slider
            label="inner --xr-back"
            value={innerBack}
            min={0}
            max={200}
            onChange={setInnerBack}
            hint={`.panel.inner { --xr-back: ${innerBack}; }`}
          />
          <Btn
            on={nested}
            hint="mount/unmount a nested .panel.inner with its own --xr-back"
            onClick={() => setNested(!nested)}
          >
            Nested panel
          </Btn>
          <Btn
            on={persp}
            hint=".persp { perspective: 600px; }  /* lab.css on the grandparent */"
            onClick={() => setPersp(!persp)}
          >
            perspective on grandparent
          </Btn>
        </>
      }
      css={css}
      readout={`enable-xr panel rect: ${rect}`}
    >
      <Pair
        render={xr => (
          <div className={persp ? 'persp' : ''}>
            <div
              className="tilt-parent"
              style={{ transform: `rotateY(${rotY}deg) translateZ(${tz}px)` }}
            >
              <Panel
                xr={xr}
                ref={xr ? ref : undefined}
                back={back}
                style={{ flexDirection: 'column', gap: 8 }}
              >
                outer
                {nested && (
                  <Panel
                    xr={xr}
                    back={innerBack}
                    className="small"
                    style={{ background: '#b5562f' }}
                  >
                    inner
                  </Panel>
                )}
              </Panel>
            </div>
          </div>
        )}
      />
    </Scenario>
  )
}
