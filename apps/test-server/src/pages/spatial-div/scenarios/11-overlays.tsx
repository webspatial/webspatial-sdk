import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Btn, Pair, Panel, Scenario } from '../shared'

function ShadowHost({ xr }: { xr: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const host = ref.current!
    if (host.shadowRoot) return
    const root = host.attachShadow({ mode: 'open' })
    // Raw attribute, not JSX runtime: tests whether the SDK observes shadow trees / plain DOM at all.
    root.innerHTML = `<style>.p{width:120px;height:72px;border-radius:12px;background:#2f9b6b;color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px}</style>
      <div class="p" ${xr ? 'enable-xr' : ''} style="--xr-back:80">shadow raw ${xr ? 'enable-xr' : 'plain'}</div>`
  }, [xr])
  return <div ref={ref} />
}

function JsxShadowHost({ xr, warm }: { xr: boolean; warm: boolean }) {
  const host = useRef<HTMLDivElement>(null)
  const [root, setRoot] = useState<ShadowRoot | null>(null)
  useEffect(() => {
    if (host.current) {
      setRoot(
        host.current.shadowRoot || host.current.attachShadow({ mode: 'open' }),
      )
    }
  }, [])
  return (
    <div ref={host}>
      {root &&
        createPortal(
          <>
            <style>{`.p{width:120px;height:72px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:12px;background:${warm ? '#c58c49' : '#2f9b6b'};color:#fff}`}</style>
            <Panel xr={xr} back={60} className="p">
              shadow JSX {xr ? 'enable-xr' : 'plain'}
            </Panel>
          </>,
          root,
        )}
    </div>
  )
}

function ClickTargetPortal({ xr, useMain }: { xr: boolean; useMain: boolean }) {
  const [target, setTarget] = useState<HTMLElement | null>(null)
  return (
    <>
      <button
        className="px-2 py-1 bg-white text-black rounded text-xs"
        onClick={e => {
          setTarget(
            useMain ? document.body : e.currentTarget.ownerDocument.body,
          )
        }}
      >
        open portal
      </button>
      {target &&
        createPortal(
          <div
            className="pop"
            style={{
              position: 'fixed',
              top: 12,
              left: xr ? '50%' : 12,
            }}
          >
            portal .pop ({xr ? 'xr' : 'dom'}) →{' '}
            {useMain ? 'main body' : 'click ownerDocument'}
            <button className="ml-2 underline" onClick={() => setTarget(null)}>
              close
            </button>
          </div>,
          target,
        )}
    </>
  )
}

function JsxFrameHost({ xr, warm }: { xr: boolean; warm: boolean }) {
  const [body, setBody] = useState<HTMLElement | null>(null)
  return (
    <>
      <iframe
        title={`jsx-f-${xr}`}
        srcDoc="<!doctype html><html><body style='margin:8px;background:#0e1017'></body></html>"
        style={{ width: 140, height: 90, border: '1px dashed #555' }}
        onLoad={e => setBody(e.currentTarget.contentDocument?.body ?? null)}
      />
      {body &&
        createPortal(
          <>
            <style>{`.p{width:120px;height:72px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:12px;background:${warm ? '#c58c49' : '#b5562f'};color:#fff}`}</style>
            <Panel xr={xr} back={60} className="p">
              iframe JSX {xr ? 'enable-xr' : 'plain'}
            </Panel>
          </>,
          body,
        )}
    </>
  )
}

export default function Overlays() {
  const [portal, setPortal] = useState(false)
  const [portalMain, setPortalMain] = useState(true)
  const [dialog, setDialog] = useState(false)
  const [popover, setPopover] = useState(false)
  const [jsxBound, setJsxBound] = useState(false)
  const [warm, setWarm] = useState(false)

  const iframeDoc = (xr: boolean) =>
    `<body style="margin:0;background:#0e1017"><div ${xr ? 'enable-xr' : ''} style="--xr-back:80;width:120px;height:72px;border-radius:12px;background:#b5562f;color:#fff;display:flex;align-items:center;justify-content:center;font:12px sans-serif">iframe ${xr ? 'enable-xr' : 'plain'}</div></body>`

  return (
    <Scenario
      title="Overlays and component boundaries"
      expect="V1 support decision. Plain DOM: dialog sits in the top layer above everything; popover likewise; portal content loses .scoped styling (yellow) because it is no longer under the scoped ancestor. A portal into the click target's ownerDocument may differ from document.body on a Hybrid child WebView. Shadow DOM and iframe render their own subtree — raw enable-xr attributes vs JSX createPortal are separate probes."
      watch="Dialog/popover rendered inside the panel plane instead of top layer, or blocked by native surfaces; portal keeps/loses styling differently on xr side; ownerDocument.body === document.body on xr when it should not (or vice versa); enable-xr inside shadow root or iframe silently does nothing; JSX portal into shadow/iframe ignored; foreign-document style injection failing."
      css={[
        `.scoped .pop { background: #ffd166; color: #000; }  /* in-tree only */`,
        `.pop { background: #333; color: #fff; }  /* unscoped fallback after portal */`,
        dialog
          ? `dialog.showModal()  /* top layer, not a CSS position */`
          : `/* no dialog */`,
        popover
          ? `[popover=manual]  /* HTML popover top layer */`
          : `/* no popover */`,
        portal
          ? `createPortal(..., ${portalMain ? 'document.body' : 'clickTarget.ownerDocument.body'})`
          : `/* no portal */`,
        jsxBound
          ? `createPortal(<div enable-xr>, shadowRoot | iframe.contentDocument.body)`
          : `raw attribute enable-xr inside shadow innerHTML / srcdoc`,
        warm
          ? `scoped stylesheet background: #c58c49`
          : `scoped stylesheet background: #2f9b6b`,
      ].join('\n')}
      controls={
        <>
          <Btn
            on={dialog}
            hint="<dialog>.showModal() — HTML top layer, not position:fixed CSS"
            onClick={() => setDialog(!dialog)}
          >
            &lt;dialog&gt; showModal inside panel
          </Btn>
          <Btn
            on={popover}
            hint="el.setAttribute('popover','manual'); el.showPopover() — HTML popover top layer"
            onClick={() => setPopover(!popover)}
          >
            popover inside panel
          </Btn>
          <Btn
            on={portal}
            hint={
              portalMain
                ? 'createPortal(overlay, document.body) — leaves .scoped, loses yellow .pop'
                : 'createPortal(overlay, clickTarget.ownerDocument.body)'
            }
            onClick={() => setPortal(!portal)}
          >
            portal{' '}
            {portalMain
              ? 'to main document.body'
              : 'to click-target ownerDocument'}
          </Btn>
          <Btn
            on={portalMain}
            hint="toggle portal destination: document.body vs e.currentTarget.ownerDocument.body"
            onClick={() => setPortalMain(!portalMain)}
          >
            toggle portal target
          </Btn>
          <Btn
            on={jsxBound}
            hint="createPortal(<div enable-xr>, shadowRoot | iframe.body) vs raw innerHTML enable-xr"
            onClick={() => setJsxBound(!jsxBound)}
          >
            JSX portal into shadow / iframe
          </Btn>
          <Btn
            on={warm}
            hint=".ws-boundary-card { background: #c58c49; }  /* scoped stylesheet inside shadow/iframe */"
            onClick={() => setWarm(!warm)}
          >
            scoped theme
          </Btn>
        </>
      }
    >
      <Pair
        render={xr => (
          <div
            className="scoped"
            style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}
          >
            <Panel
              xr={xr}
              back={80}
              style={{ flexDirection: 'column', gap: 6 }}
            >
              panel
              <span className="pop text-xs">
                in-tree .pop (scoped = yellow)
              </span>
              {dialog && (
                <dialog
                  ref={el => {
                    if (el && !el.open) el.showModal()
                  }}
                  className="pop"
                  onClose={() => setDialog(false)}
                >
                  dialog in {xr ? 'xr' : 'dom'} panel{' '}
                  <button
                    className="ml-2 underline"
                    onClick={() => setDialog(false)}
                  >
                    close
                  </button>
                </dialog>
              )}
              {popover && (
                <div
                  className="pop"
                  ref={(el: HTMLDivElement | null) => {
                    if (!el) return
                    el.setAttribute('popover', 'manual')
                    try {
                      el.showPopover?.()
                    } catch {
                      // Already open or unsupported
                    }
                  }}
                >
                  popover ({xr ? 'xr' : 'dom'})
                </div>
              )}
              {portal && <ClickTargetPortal xr={xr} useMain={portalMain} />}
            </Panel>
            {jsxBound ? (
              <>
                <JsxShadowHost xr={xr} warm={warm} />
                <JsxFrameHost xr={xr} warm={warm} />
              </>
            ) : (
              <>
                <ShadowHost xr={xr} />
                <iframe
                  title={`f-${xr}`}
                  srcDoc={iframeDoc(xr)}
                  style={{ width: 140, height: 90, border: '1px dashed #555' }}
                />
              </>
            )}
          </div>
        )}
        height={220}
      />
    </Scenario>
  )
}
