import React, { useState } from 'react'
import { Btn, Pair, Panel, Scenario } from '../shared'

export default function Scroll() {
  const [xform, setXform] = useState(false)
  const [nested, setNested] = useState(false)
  const [position, setPosition] = useState<'sticky' | 'absolute' | 'fixed'>(
    'sticky',
  )

  const posCss =
    position === 'sticky'
      ? 'position: sticky; top: 0;'
      : position === 'absolute'
        ? 'position: absolute; top: 80px; left: 16px;'
        : 'position: fixed; right: 24px; bottom: 24px;'

  const css = [
    `.scroller {`,
    `  height: 240px; overflow: auto; position: relative;`,
    xform
      ? `  transform: translateZ(0);  /* containing block for position:fixed */`
      : `  /* no transform */`,
    `}`,
    `.panel { ${posCss} --xr-back: 60; }`,
    nested
      ? `.scroller .scroller { height: 150px; overflow: auto; }`
      : `/* no nested scroller */`,
  ].join('\n')

  return (
    <Scenario
      title="Scrolling, fixed, and sticky"
      expect="Sticky panel pins at top of its scroller and scrolls with content otherwise. Absolute stays in the scroller's containing block. Fixed panel anchors to the viewport, except under a transformed ancestor where CSS makes it anchor to that ancestor. Nested scroller composes."
      watch="Sticky lags or never pins on one platform; fixed panel attached at scene root even when an ancestor is transformed; absolute treated as fixed or world-anchored; inner scroller panel not tracking inner scroll offset."
      controls={
        <>
          <Btn
            on={xform}
            hint=".scroller { transform: translateZ(0); }  /* fixed then anchors to this ancestor */"
            onClick={() => setXform(!xform)}
          >
            transform on scroller (fixed → ancestor)
          </Btn>
          <Btn
            on={nested}
            hint=".scroller .scroller { height: 150px; overflow: auto; }  /* inner scroll container */"
            onClick={() => setNested(!nested)}
          >
            nested scroller
          </Btn>
          {(
            [
              ['sticky', 'position: sticky; top: 0;'],
              ['absolute', 'position: absolute; top: 80px; left: 16px;'],
              ['fixed', 'position: fixed; right: 24px; bottom: 24px;'],
            ] as const
          ).map(([p, rule]) => (
            <Btn
              key={p}
              on={position === p}
              hint={`.panel { ${rule} }  /* lab.css .${p} */`}
              onClick={() => setPosition(p)}
            >
              position: {p}
            </Btn>
          ))}
        </>
      }
      css={css}
    >
      <Pair
        render={xr => (
          <div className={`scroller ${xform ? 'xform' : ''}`}>
            <Panel xr={xr} className={`${position} small`} back={60}>
              {position}
            </Panel>
            <div className="filler" />
            {nested && (
              <div className="scroller" style={{ height: 150 }}>
                <div className="filler" />
                <Panel
                  xr={xr}
                  className="small"
                  back={60}
                  style={{ background: '#b5562f' }}
                >
                  in nested scroller
                </Panel>
                <div className="filler" />
                <div className="filler" />
              </div>
            )}
            <div className="filler" />
            <div className="filler" />
            <div className="filler" />
            <div className="filler" />
          </div>
        )}
        height={260}
      />
    </Scenario>
  )
}
