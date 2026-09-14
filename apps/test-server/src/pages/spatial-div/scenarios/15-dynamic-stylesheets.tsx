import React, { useEffect, useRef, useState } from 'react'
import { Btn, Pair, Panel, Scenario, useLog } from '../shared'

/**
 * 1b — Dynamic stylesheets.
 * insertRule on an *existing* CSSStyleSheet does not mutate the DOM, so a
 * MutationObserver / "copy <style> nodes" approach misses it. Emotion and
 * styled-components production mode use exactly this path.
 */
export default function DynamicStylesheets() {
  const [inject, setInject] = useState(false)
  const [cssom, setCssom] = useState(0)
  const [adopted, setAdopted] = useState(false)
  const [log, push, clear] = useLog(20)
  const sheetEl = useRef<HTMLStyleElement | null>(null)

  // Persistent empty stylesheet: later insertRule/deleteRule must NOT
  // append or remove nodes (that is the whole test).
  useEffect(() => {
    const el = document.createElement('style')
    el.dataset.labCssom = 'true'
    el.textContent = '/* 1b cssom host — rules added only via insertRule */'
    document.head.appendChild(el)
    sheetEl.current = el
    return () => {
      el.remove()
      sheetEl.current = null
    }
  }, [])

  useEffect(() => {
    const mo = new MutationObserver(ms => {
      push(
        `MutationObserver head: ${ms
          .map(
            m => `${m.type}:${m.addedNodes.length}a/${m.removedNodes.length}r`,
          )
          .join(', ')}`,
      )
    })
    mo.observe(document.head, {
      childList: true,
      subtree: true,
      characterData: true,
    })
    return () => mo.disconnect()
  }, [push])

  useEffect(() => {
    if (!inject) return
    const el = document.createElement('style')
    el.textContent =
      '.lab-sheet-inject .panel { outline: 4px solid #22e06b; --xr-back: 160; }'
    document.head.appendChild(el)
    push('runtime <style> appended to document.head (DOM mutation)')
    return () => {
      el.remove()
      push('runtime <style> removed')
    }
  }, [inject, push])

  useEffect(() => {
    const sheet = sheetEl.current?.sheet
    if (!sheet) return
    while (sheet.cssRules.length) sheet.deleteRule(0)
    if (!cssom) {
      push('CSSOM: sheet emptied via deleteRule (no DOM mutation expected)')
      return
    }
    const color = cssom % 2 ? '#c58c49' : '#2f9b6b'
    sheet.insertRule(
      `.lab-sheet-cssom .panel { background: ${color} !important; }`,
      0,
    )
    push(
      `CSSOM insertRule #${cssom} on existing sheet (cssRules=${sheet.cssRules.length}; no node add)`,
    )
  }, [cssom, push])

  useEffect(() => {
    if (!adopted || !('adoptedStyleSheets' in document)) return
    const sheet = new CSSStyleSheet()
    sheet.replaceSync(
      '.lab-sheet-adopted .panel { box-shadow: 0 0 0 4px #e0225a inset; transform: scale(1.1); }',
    )
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet]
    push('adoptedStyleSheets: constructed sheet attached')
    return () => {
      document.adoptedStyleSheets = document.adoptedStyleSheets.filter(
        s => s !== sheet,
      )
      push('adoptedStyleSheets: constructed sheet detached')
    }
  }, [adopted, push])

  const css = [
    `/* Runtime <style> — appends a node; MutationObserver fires */`,
    inject
      ? `.lab-sheet-inject .panel { outline: 4px solid #22e06b; --xr-back: 160; }`
      : `/* off */`,
    ``,
    `/* CSSOM insertRule on a pre-existing <style> — NO DOM mutation */`,
    cssom
      ? `.lab-sheet-cssom .panel { background: ${cssom % 2 ? '#c58c49' : '#2f9b6b'} !important; }`
      : `/* sheet empty */`,
    ``,
    `/* adoptedStyleSheets — constructed CSSStyleSheet, also no childList */`,
    adopted
      ? `.lab-sheet-adopted .panel { box-shadow: 0 0 0 4px #e0225a inset; transform: scale(1.1); }`
      : `/* off */`,
  ].join('\n')

  return (
    <Scenario
      title="Dynamic stylesheets"
      expect="Runtime <style> (DOM mutation), CSSOM insertRule on an existing sheet (no mutation), and adoptedStyleSheets all restyle the panel the same on both columns. Emotion / styled-components prod mode uses insertRule — copying by observing <style> nodes misses it."
      watch="insertRule changes the DOM twin but not the spatial surface (or vice versa); MutationObserver silent on insertRule but the host still restyles; adopted sheets ignored because they were never copied into the portal document."
      controls={
        <>
          <Btn
            on={inject}
            hint="document.head.appendChild(<style>) — childList mutation; observers can copy the node"
            onClick={() => setInject(!inject)}
          >
            Runtime &lt;style&gt;
          </Btn>
          <Btn
            on={cssom > 0}
            hint="existingStyle.sheet.insertRule(...) — no node add/remove. Emotion/styled-components prod."
            onClick={() => setCssom(n => n + 1)}
          >
            CSSOM insertRule / replace
          </Btn>
          <Btn
            on={adopted}
            hint="document.adoptedStyleSheets = [new CSSStyleSheet()] — no <style> node"
            onClick={() => setAdopted(!adopted)}
          >
            adoptedStyleSheets
          </Btn>
          <Btn onClick={clear}>clear log</Btn>
        </>
      }
      css={css}
      readout={log || 'MutationObserver + CSSOM actions appear here'}
    >
      <Pair
        render={xr => (
          <div
            className={`${inject ? 'lab-sheet-inject' : ''} ${cssom ? 'lab-sheet-cssom' : ''} ${adopted ? 'lab-sheet-adopted' : ''}`}
          >
            <Panel xr={xr}>panel</Panel>
          </div>
        )}
        height={180}
      />
    </Scenario>
  )
}
