import React, { useEffect, useState } from 'react'
import { Btn, Pair, Panel, Scenario } from '../shared'

export default function Styles() {
  const [theme, setTheme] = useState(false)
  const [varOn, setVarOn] = useState(false)
  const [inject, setInject] = useState(false) // <style> appended at runtime (CSS-in-JS style)
  const [adopted, setAdopted] = useState(false) // constructed stylesheet via adoptedStyleSheets
  const [cssom, setCssom] = useState(0) // CSSOM insertRule / replace

  useEffect(() => {
    if (!inject) return
    const el = document.createElement('style')
    el.textContent = `.inject .panel { outline: 4px solid #22e06b; --xr-back: 160; letter-spacing: 2px; }`
    document.head.appendChild(el)
    return () => el.remove()
  }, [inject])

  useEffect(() => {
    if (!cssom) return
    const el = document.createElement('style')
    document.head.appendChild(el)
    el.sheet?.insertRule(
      `.cssom .panel { background: ${cssom % 2 ? '#c58c49' : '#2f9b6b'} !important; }`,
      0,
    )
    return () => el.remove()
  }, [cssom])

  useEffect(() => {
    if (!adopted || !('adoptedStyleSheets' in document)) return
    const sheet = new CSSStyleSheet()
    sheet.replaceSync(
      `.adopted .panel { box-shadow: 0 0 0 4px #e0225a inset; transform: scale(1.1); }`,
    )
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet]
    return () => {
      document.adoptedStyleSheets = document.adoptedStyleSheets.filter(
        s => s !== sheet,
      )
    }
  }, [adopted])

  const css = [
    `/* .theme on ancestor — lab.css descendant selector */`,
    theme
      ? `.theme .panel { color: #ffd166; background: #5a2d91; transform: rotateY(20deg); }`
      : `/* .theme class off */`,
    ``,
    `/* --panel-color on ancestor — inherited custom property */`,
    varOn
      ? `.ancestor { --panel-color: #7dd3fc; }\n.panel { color: var(--panel-color, #fff); }`
      : `.panel { color: var(--panel-color, #fff); }  /* fallback #fff */`,
    ``,
    `/* Runtime <style> injection — document.head textContent */`,
    inject
      ? `.inject .panel { outline: 4px solid #22e06b; --xr-back: 160; letter-spacing: 2px; }`
      : `/* no injected <style> */`,
    ``,
    `/* CSSOM insertRule — style.sheet.insertRule(...) */`,
    cssom
      ? `.cssom .panel { background: ${cssom % 2 ? '#c58c49' : '#2f9b6b'} !important; }`
      : `/* no CSSOM rule */`,
    ``,
    `/* adoptedStyleSheets — constructed CSSStyleSheet */`,
    adopted
      ? `.adopted .panel { box-shadow: 0 0 0 4px #e0225a inset; transform: scale(1.1); }`
      : `/* no adopted sheet */`,
  ].join('\n')

  return (
    <Scenario
      title="Styles and inheritance"
      expect="Ancestor selector, inherited custom property, runtime <style>, CSSOM insertRule, and constructed stylesheet all apply to the panel identically on both sides."
      watch="Themed rule matching on the probe but not the visible surface (or vice versa); --panel-color not inherited; injected/CSSOM/adopted sheets ignored because they were never copied to the native document."
      controls={
        <>
          <Btn
            on={theme}
            hint=".theme .panel { color: #ffd166; background: #5a2d91; transform: rotateY(20deg); }  /* lab.css */"
            onClick={() => setTheme(!theme)}
          >
            .theme on ancestor (color + rotateY)
          </Btn>
          <Btn
            on={varOn}
            hint=".ancestor { --panel-color: #7dd3fc; }  /* inherited; .panel uses color: var(--panel-color) */"
            onClick={() => setVarOn(!varOn)}
          >
            --panel-color on ancestor
          </Btn>
          <Btn
            on={inject}
            hint=".inject .panel { outline: 4px solid #22e06b; --xr-back: 160; letter-spacing: 2px; }  /* <style> in document.head */"
            onClick={() => setInject(!inject)}
          >
            Runtime &lt;style&gt; injection
          </Btn>
          <Btn
            on={cssom > 0}
            hint={`.cssom .panel { background: ${(cssom + 1) % 2 ? '#c58c49' : '#2f9b6b'} !important; }  /* CSSOM insertRule */`}
            onClick={() => setCssom(n => n + 1)}
          >
            CSSOM insertRule / replace
          </Btn>
          <Btn
            on={adopted}
            hint=".adopted .panel { box-shadow: 0 0 0 4px #e0225a inset; transform: scale(1.1); }  /* adoptedStyleSheets */"
            onClick={() => setAdopted(!adopted)}
          >
            adoptedStyleSheets
          </Btn>
        </>
      }
      css={css}
    >
      <Pair
        render={xr => (
          <div
            className={`${theme ? 'theme' : ''} ${inject ? 'inject' : ''} ${cssom ? 'cssom' : ''} ${adopted ? 'adopted' : ''}`}
            style={
              {
                '--panel-color': varOn ? '#7dd3fc' : undefined,
              } as React.CSSProperties
            }
          >
            <div style={{ padding: 12 }}>
              <Panel xr={xr}>panel</Panel>
            </div>
          </div>
        )}
      />
    </Scenario>
  )
}
