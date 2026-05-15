import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  ELEMENT_DOM_DEPTH_KEYS,
  SUB_TOKENS_BY_NAME,
  supports,
  WINDOW_DOM_DEPTH_KEYS,
} from '@webspatial/core-sdk'
import {
  Model,
  type ModelRef,
  type SpatializedElementRef,
} from '@webspatial/react-sdk'

/**
 * Same partition as `openspec/.../review.md` §3.6 — first six Model sub-tokens are HTML-oriented,
 * remainder are JS API (ref / element). Kept in sync with `SUB_TOKENS_BY_NAME.Model` ordering in core.
 */
const MODEL_HTML_SUBTOKENS = SUB_TOKENS_BY_NAME.Model.slice(0, 6)
const MODEL_JS_SUBTOKENS = SUB_TOKENS_BY_NAME.Model.slice(6)

function ContractPassBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${
        ok
          ? 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30'
          : 'bg-rose-500/12 text-rose-300 ring-rose-500/25'
      }`}
    >
      {label}
    </span>
  )
}

function formatWindowValue(v: unknown): string {
  if (v === undefined) return 'undefined'
  if (v === null) return 'null'
  if (typeof v === 'number') return String(v)
  return typeof v
}

function formatRefDepthRead(v: unknown): string {
  if (v === undefined) return 'undefined'
  if (v === null) return 'null'
  if (typeof v === 'string') {
    const s = v.length > 48 ? `${v.slice(0, 45)}…` : v
    return JSON.stringify(s)
  }
  return typeof v
}

function describeRefProp(el: object | null, key: string): string {
  if (el == null) return '—'
  if (!(key in el)) return 'missing'
  const v = (el as Record<string, unknown>)[key]
  if (typeof v === 'function') return 'function'
  if (
    v &&
    typeof v === 'object' &&
    'then' in v &&
    typeof (v as Promise<unknown>).then === 'function'
  ) {
    return 'object (thenable)'
  }
  return typeof v
}

function htmlTokenSurface(el: Element | null, token: string): string {
  if (!el) return '—'
  const anyEl = el as HTMLElement & Record<string, unknown>
  if (typeof anyEl.getAttribute === 'function') {
    const a = anyEl.getAttribute(token)
    if (a !== null) return `attr="${a}"`
  }
  if (token in anyEl && anyEl[token] !== undefined) {
    return `prop (${typeof anyEl[token]})`
  }
  return '—'
}

function windowKeySurface(key: string): {
  keyInWindow: boolean
  hasOwn: boolean
  read: unknown
} {
  if (typeof window === 'undefined') {
    return { keyInWindow: false, hasOwn: false, read: undefined }
  }
  const w = window as unknown as Record<string, unknown>
  return {
    keyInWindow: key in window,
    hasOwn: Object.prototype.hasOwnProperty.call(window, key),
    read: w[key],
  }
}

/**
 * §3.5.1 — `xrInnerDepth` / `xrOuterDepth` on `Window`: when unsupported, must be absent from `window`.
 */
export function DomDepthWindowContractSection() {
  const rows = useMemo(() => {
    return (WINDOW_DOM_DEPTH_KEYS as readonly string[]).map((key: string) => {
      const sup = supports(key)
      const { keyInWindow, hasOwn, read } = windowKeySurface(key)
      const failAbsentSurface = !sup && keyInWindow
      return { key, sup, keyInWindow, hasOwn, read, failAbsentSurface }
    })
  }, [])

  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-violet-200/90">
        §3.5.1 <code className="text-gray-400">xrInnerDepth</code> /{' '}
        <code className="text-gray-400">xrOuterDepth</code> vs{' '}
        <code className="text-gray-400">window</code>
      </h3>
      <p className="mb-4 text-xs leading-relaxed text-gray-500">
        When <code className="text-gray-500">supports(key)</code> is{' '}
        <strong>false</strong>, the host must not define{' '}
        <code className="text-gray-500">window.&lt;key&gt;</code>. Use{' '}
        <code className="text-gray-500">key in window</code> and{' '}
        <code className="text-gray-500">hasOwn(window)</code> in the table; the
        §3.5.1 column is the <strong>false → absent</strong> check. When{' '}
        <strong>true</strong>, injection is host-defined;{' '}
        <code className="text-gray-500">read window[key]</code> is
        informational.
      </p>
      <div className="overflow-hidden rounded-xl border border-gray-800/80">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#1a1a1f] text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
              <th className="px-4 py-3">Key</th>
              <th className="px-4 py-3">supports(key)</th>
              <th className="px-4 py-3">key in window</th>
              <th className="px-4 py-3">hasOwn(window)</th>
              <th className="px-4 py-3">read window[key]</th>
              <th className="px-4 py-3">§3.5.1 (!sup → absent)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr
                key={r.key}
                className={`border-t border-gray-800/60 ${i % 2 === 0 ? 'bg-black/20' : ''}`}
              >
                <td className="px-4 py-2.5 font-mono text-[13px] text-gray-200">
                  {r.key}
                </td>
                <td className="px-4 py-2.5 font-mono text-xs text-gray-400">
                  {String(r.sup)}
                </td>
                <td className="px-4 py-2.5 font-mono text-xs text-gray-400">
                  {String(r.keyInWindow)}
                </td>
                <td className="px-4 py-2.5 font-mono text-xs text-gray-400">
                  {String(r.hasOwn)}
                </td>
                <td className="px-4 py-2.5 font-mono text-xs text-gray-400">
                  {formatWindowValue(r.read)}
                </td>
                <td className="px-4 py-2.5">
                  {!r.sup ? (
                    r.failAbsentSurface ? (
                      <ContractPassBadge ok={false} label="FAIL" />
                    ) : (
                      <ContractPassBadge ok={true} label="PASS" />
                    )
                  ) : (
                    <span className="text-xs text-gray-500">
                      n/a (supported path)
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/**
 * §3.5.2 — Live `&lt;div enable-xr&gt;` ref: `xrClientDepth` / `xrOffsetBack` follow `supports()` via
 * `useDomProxy` (see `useDomProxy.coverage.test.ts`).
 */
export function DomDepthSpatializedRefSection() {
  const spatialRef = useRef<SpatializedElementRef<HTMLDivElement>>(null)
  const [depthRows, setDepthRows] = useState<
    {
      key: string
      sup: boolean
      inRef: boolean
      read: string
    }[]
  >([])

  const resample = () => {
    const el = spatialRef.current as unknown as Record<string, unknown> | null
    if (!el) {
      setDepthRows([])
      return
    }
    setDepthRows(
      (ELEMENT_DOM_DEPTH_KEYS as readonly string[]).map((key: string) => ({
        key,
        sup: supports(key),
        inRef: key in el,
        read: formatRefDepthRead(el[key]),
      })),
    )
  }

  useLayoutEffect(() => {
    resample()
    const id = requestAnimationFrame(resample)
    return () => cancelAnimationFrame(id)
  }, [])

  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-violet-200/90">
        §3.5.2 <code className="text-gray-400">xrClientDepth</code> /{' '}
        <code className="text-gray-400">xrOffsetBack</code> on spatialized{' '}
        <code className="text-gray-400">ref</code>
      </h3>
      <p className="mb-4 text-xs leading-relaxed text-gray-500">
        Mounted <code className="text-gray-500">&lt;div enable-xr&gt;</code>{' '}
        with <code className="text-gray-500">--xr-depth</code> /{' '}
        <code className="text-gray-500">--xr-back</code> on style. The ref is
        the dom Proxy from <code className="text-gray-500">useDomProxy.ts</code>
        : <code className="text-gray-500">&apos;key&apos; in ref</code> uses the
        Proxy <code className="text-gray-500">has</code> trap and aligns with{' '}
        <code className="text-gray-500">supports(key)</code>. Automated checks
        live in{' '}
        <code className="text-gray-500">
          packages/react/.../useDomProxy.coverage.test.ts
        </code>
        .
      </p>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div
          enable-xr
          ref={spatialRef}
          className="rounded-lg border border-gray-700 bg-[#1a1a1f] px-4 py-3 text-xs text-gray-400"
          style={
            {
              width: 'min(100%, 280px)',
              minHeight: '72px',
              '--xr-depth': '42px',
              '--xr-back': '24px',
            } as React.CSSProperties
          }
        >
          Sample spatial div (depth / back set on style)
        </div>
        <button
          type="button"
          onClick={resample}
          className="rounded-lg border border-gray-600 bg-black/30 px-3 py-2 text-xs font-medium text-gray-200 hover:bg-white/5"
        >
          Re-sample ref
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-800/80">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#1a1a1f] text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
              <th className="px-4 py-3">Key</th>
              <th className="px-4 py-3">supports(key)</th>
              <th className="px-4 py-3">key in ref</th>
              <th className="px-4 py-3">ref[key]</th>
            </tr>
          </thead>
          <tbody>
            {depthRows.length === 0 ? (
              <tr className="border-t border-gray-800/60 bg-black/20">
                <td className="px-4 py-3 text-xs text-gray-500" colSpan={4}>
                  Ref not ready yet — use &quot;Re-sample ref&quot; after load.
                </td>
              </tr>
            ) : (
              depthRows.map((r, i) => {
                const expectInRef = r.sup
                const refOk = r.inRef === expectInRef
                return (
                  <tr
                    key={r.key}
                    className={`border-t border-gray-800/60 ${i % 2 === 0 ? 'bg-black/20' : ''}`}
                  >
                    <td className="px-4 py-2.5 font-mono text-[13px] text-gray-200">
                      {r.key}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-gray-400">
                      {String(r.sup)}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-gray-400">
                      {String(r.inRef)}
                      {refOk ? null : (
                        <span className="ml-2 text-rose-400/90">
                          (expected {String(expectInRef)})
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-gray-400">
                      {r.read}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function ModelContractSection() {
  const modelRef = useRef<ModelRef | null>(null)
  const [loadGen, setLoadGen] = useState(0)
  const [jsSnapshot, setJsSnapshot] = useState<Record<string, string>>({})

  useEffect(() => {
    const el = modelRef.current as unknown as object | null
    if (!el) return
    const next: Record<string, string> = {}
    for (const k of MODEL_JS_SUBTOKENS) {
      next[k] = describeRefProp(el, k)
    }
    setJsSnapshot(next)
  }, [loadGen])

  const htmlRows = useMemo(() => {
    const el = modelRef.current as unknown as Element | null
    return MODEL_HTML_SUBTOKENS.map(token => ({
      token,
      sup: supports('Model', [token]),
      surface: htmlTokenSurface(el, token),
    }))
  }, [loadGen])

  const jsRows = useMemo(() => {
    return MODEL_JS_SUBTOKENS.map(token => ({
      token,
      sup: supports('Model', [token]),
      surface: jsSnapshot[token] ?? '—',
    }))
  }, [jsSnapshot])

  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-violet-200/90">
        §3.6 Model sub-tokens vs{' '}
        <code className="text-gray-400">ref.current</code>
      </h3>
      <p className="mb-4 text-xs leading-relaxed text-gray-500">
        Includes <code className="text-gray-500">entityTransform</code>,{' '}
        <code className="text-gray-500">ready</code>, etc. (all JS tokens from{' '}
        <code className="text-gray-500">SUB_TOKENS_BY_NAME.Model</code>). HTML
        tokens vs attribute / prop surface; JS tokens vs{' '}
        <code className="text-gray-500">typeof</code> / presence on the node
        (e.g. <code className="text-gray-500">entityTransform</code> as{' '}
        <code className="text-gray-500">object</code> when present).
      </p>

      <div className="mb-6 overflow-hidden rounded-xl border border-gray-800/80">
        <Model
          ref={modelRef}
          className="block max-w-xs"
          style={{ height: '120px' }}
          src="/modelasset/cone.usdz"
          enable-xr
          onLoad={() => setLoadGen(g => g + 1)}
          onError={() => setLoadGen(g => g + 1)}
        />
      </div>

      <div className="mb-6">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
          HTML / attribute-oriented
        </div>
        <div className="overflow-hidden rounded-xl border border-gray-800/80">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#1a1a1f] text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                <th className="px-4 py-3">Token</th>
                <th className="px-4 py-3">supports</th>
                <th className="px-4 py-3">Surface (attr / prop)</th>
              </tr>
            </thead>
            <tbody>
              {htmlRows.map((r, i) => (
                <tr
                  key={r.token}
                  className={`border-t border-gray-800/60 ${i % 2 === 0 ? 'bg-black/20' : ''}`}
                >
                  <td className="px-4 py-2.5 font-mono text-[13px] text-gray-200">
                    {r.token}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-gray-400">
                    {String(r.sup)}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-gray-400">
                    {r.surface}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
          JS API (ref keys, e.g. ready, entityTransform)
        </div>
        <div className="overflow-hidden rounded-xl border border-gray-800/80">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#1a1a1f] text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                <th className="px-4 py-3">Token</th>
                <th className="px-4 py-3">supports</th>
                <th className="px-4 py-3">ref surface</th>
              </tr>
            </thead>
            <tbody>
              {jsRows.map((r, i) => (
                <tr
                  key={r.token}
                  className={`border-t border-gray-800/60 ${i % 2 === 0 ? 'bg-black/20' : ''}`}
                >
                  <td className="px-4 py-2.5 font-mono text-[13px] text-gray-200">
                    {r.token}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-gray-400">
                    {String(r.sup)}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-gray-400">
                    {r.surface}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-4 text-xs text-gray-600">
        <code className="text-gray-500">SUB_TOKENS_BY_NAME.Model</code> has{' '}
        {SUB_TOKENS_BY_NAME.Model.length} entries (HTML + JS).
      </p>
    </div>
  )
}

export function ContractChecksPanel() {
  return (
    <div className="space-y-16">
      <DomDepthWindowContractSection />
      <DomDepthSpatializedRefSection />
      <ModelContractSection />
    </div>
  )
}
