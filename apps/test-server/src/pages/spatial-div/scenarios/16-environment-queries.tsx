import React, { useEffect, useState } from 'react'
import { Btn, Pair, Panel, Scenario } from '../shared'

/**
 * 1c — Environment queries.
 * A Hybrid portal document has its own viewport, :root, font-size, color-scheme,
 * and font set. Tailwind md:/dark:, next-themes, container queries, rem, vw/vh
 * can evaluate against the wrong document.
 */
export default function EnvironmentQueries() {
  const [wide, setWide] = useState(true)
  const [dark, setDark] = useState(false)
  const [rtl, setRtl] = useState(false)
  const [rootPx, setRootPx] = useState(16)
  const [scheme, setScheme] = useState<'light' | 'dark' | 'auto'>('auto')

  useEffect(() => {
    const html = document.documentElement
    const prevFont = html.style.fontSize
    const prevDir = html.getAttribute('dir')
    const prevScheme = html.style.colorScheme
    const hadDark = html.classList.contains('dark')
    html.style.fontSize = `${rootPx}px`
    html.setAttribute('dir', rtl ? 'rtl' : 'ltr')
    html.style.colorScheme = scheme === 'auto' ? '' : scheme
    html.classList.toggle('dark', dark)
    return () => {
      html.style.fontSize = prevFont
      if (prevDir == null) html.removeAttribute('dir')
      else html.setAttribute('dir', prevDir)
      html.style.colorScheme = prevScheme
      html.classList.toggle('dark', hadDark)
    }
  }, [rootPx, rtl, scheme, dark])

  const css = [
    `.env-box { width: ${wide ? '480px' : '240px'}; container-type: inline-size; }`,
    `@media (min-width: 400px) { .env-media { outline: 3px solid #22e06b; } }`,
    `.env-vw { width: 20vw; height: 10vh; }`,
    `.env-dvh { height: 12dvh; }`,
    `.env-rem { font-size: 1.25rem; padding: 0.5rem; }  /* html font-size: ${rootPx}px */`,
    `@container (min-width: 360px) { .env-cq { background: #2f9b6b; } }`,
    `@media (prefers-color-scheme: dark) { .env-scheme { outline: 3px solid #c58c49; } }`,
    `html.dark .env-dark { background: #1a1030; color: #ffd166; }`,
    `[dir=rtl] .env-rtl { flex-direction: row-reverse; }`,
    `@font-face { font-family: LabEnv; src: local('Georgia'); }`,
    `.env-font { font-family: LabEnv, Georgia, serif; }`,
    `html { font-size: ${rootPx}px; dir: ${rtl ? 'rtl' : 'ltr'}; color-scheme: ${scheme}; class.dark: ${dark} }`,
  ].join('\n')

  return (
    <Scenario
      title="Environment queries"
      expect="Media, viewport units, rem, container queries, prefers-color-scheme, html.dark, dir=rtl, and @font-face all resolve against the *host* document — the same values as the left column. Tailwind md:/dark: and next-themes depend on this."
      watch="Spatial column uses the portal WebView's viewport / :root / color-scheme / font set: md: never matches, rem is 16 forever, vw is the panel width, dark: and rtl never apply, @font-face is missing."
      controls={
        <>
          <Btn
            on={wide}
            hint=".env-box { width: 480px vs 240px } — drives @container (min-width: 360px)"
            onClick={() => setWide(!wide)}
          >
            container {wide ? '480' : '240'}px
          </Btn>
          <Btn
            on={dark}
            hint="document.documentElement.classList.toggle('dark')"
            onClick={() => setDark(!dark)}
          >
            html.dark
          </Btn>
          <Btn
            on={rtl}
            hint="document.documentElement.dir = rtl | ltr"
            onClick={() => setRtl(!rtl)}
          >
            dir={rtl ? 'rtl' : 'ltr'}
          </Btn>
          <Btn
            hint={`html { font-size: ${rootPx === 16 ? 20 : 16}px }  /* rem / 1.25rem follows */`}
            onClick={() => setRootPx(p => (p === 16 ? 20 : 16))}
          >
            html font-size {rootPx}px
          </Btn>
          <Btn
            hint="html { color-scheme: light | dark | auto } — @media (prefers-color-scheme)"
            onClick={() =>
              setScheme(s =>
                s === 'auto' ? 'dark' : s === 'dark' ? 'light' : 'auto',
              )
            }
          >
            color-scheme {scheme}
          </Btn>
        </>
      }
      css={css}
    >
      <Pair
        render={xr => (
          <div
            className={`env-box ${wide ? 'wide' : 'narrow'}`}
            style={{ width: wide ? 480 : 240 }}
          >
            <Panel
              xr={xr}
              className="env-media env-vw env-rem env-cq env-scheme env-dark env-rtl env-font"
              style={{
                width: '20vw',
                height: '10vh',
                minHeight: 72,
                flexDirection: 'column',
                gap: 4,
                fontSize: '1.25rem',
              }}
            >
              <span className="text-[10px] leading-tight">
                media / vw / rem / cq / scheme / dark / rtl / font
              </span>
              <span className="env-dvh text-[10px]">12dvh sample</span>
            </Panel>
          </div>
        )}
        height={220}
      />
    </Scenario>
  )
}
