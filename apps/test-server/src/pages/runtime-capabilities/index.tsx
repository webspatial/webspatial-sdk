import React, { useMemo, useState } from 'react'
import {
  CAPABILITY_TABLE,
  COMPONENT_KEYS,
  CSS_KEYS,
  DOM_DEPTH_KEYS,
  GESTURE_KEYS,
  getRuntime,
  JS_SCENE_KEYS,
  supports,
  SUB_TOKENS_BY_NAME,
  TOP_LEVEL_KEYS,
} from '@webspatial/core-sdk'
import { WebSpatialRuntime } from '@webspatial/react-sdk'

import { ContractChecksPanel } from './ContractChecks'

function ResultBadge({ value }: { value: boolean | undefined }) {
  if (value === true) {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold tracking-wide text-emerald-300 ring-1 ring-inset ring-emerald-500/30">
        Yes
      </span>
    )
  }
  if (value === false) {
    return (
      <span className="inline-flex items-center rounded-full bg-rose-500/12 px-2.5 py-0.5 text-xs font-semibold tracking-wide text-rose-300 ring-1 ring-inset ring-rose-500/25">
        No
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-full bg-gray-500/10 px-2.5 py-0.5 text-xs text-gray-500 ring-1 ring-inset ring-gray-600/40">
      n/a
    </span>
  )
}

const KEY_GROUPS: { title: string; keys: readonly string[] }[] = [
  { title: 'HTML / components', keys: COMPONENT_KEYS as unknown as string[] },
  { title: 'CSS', keys: CSS_KEYS as unknown as string[] },
  { title: 'Spatial gestures', keys: GESTURE_KEYS as unknown as string[] },
  { title: 'JS / scene / utility', keys: JS_SCENE_KEYS as unknown as string[] },
  { title: 'DOM depth', keys: DOM_DEPTH_KEYS as unknown as string[] },
]

function SectionCard({
  id,
  title,
  subtitle,
  accent,
  children,
}: {
  id?: string
  title: string
  subtitle?: string
  accent: 'sky' | 'violet' | 'amber'
  children: React.ReactNode
}) {
  const border =
    accent === 'sky'
      ? 'border-l-sky-500'
      : accent === 'violet'
        ? 'border-l-violet-500'
        : 'border-l-amber-400'
  return (
    <section
      id={id}
      className={`mb-12 scroll-mt-6 rounded-2xl border border-gray-800/80 bg-gradient-to-br from-[#161616] to-[#121212] shadow-xl shadow-black/40 ${border} border-l-4`}
    >
      <div className="border-b border-gray-800/80 px-6 py-4">
        <h2 className="text-lg font-semibold tracking-tight text-white">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
        ) : null}
      </div>
      <div className="p-4 sm:p-6">{children}</div>
    </section>
  )
}

type CapabilitiesTab = 'env' | 'live' | 'matrix' | 'contract'

const CAPABILITY_TABS: { id: CapabilitiesTab; label: string }[] = [
  { id: 'env', label: 'Environment' },
  { id: 'live', label: 'Live capabilities' },
  { id: 'matrix', label: 'vision vs pico' },
  { id: 'contract', label: 'Contract' },
]

export default function RuntimeCapabilitiesPage() {
  const ua =
    typeof navigator !== 'undefined' ? navigator.userAgent : '(no navigator)'

  const rt = useMemo(() => getRuntime(), [])

  const liveTopLevel = useMemo(
    () =>
      TOP_LEVEL_KEYS.map(name => ({
        name,
        value: supports(name),
      })),
    [],
  )

  const liveStats = useMemo(() => {
    let yes = 0
    let no = 0
    for (const r of liveTopLevel) {
      if (r.value === true) yes++
      else if (r.value === false) no++
    }
    return { yes, no, total: liveTopLevel.length }
  }, [liveTopLevel])

  const liveSubTokens = useMemo(() => {
    const byParent: {
      parent: string
      rows: { token: string; value: boolean }[]
    }[] = []
    for (const [name, tokens] of Object.entries(SUB_TOKENS_BY_NAME)) {
      byParent.push({
        parent: name,
        rows: tokens.map(token => ({
          token,
          value: supports(name, [token]),
        })),
      })
    }
    byParent.sort((a, b) => a.parent.localeCompare(b.parent))
    return byParent
  }, [])

  const visionRow = CAPABILITY_TABLE.visionos[0]
  const picoRow = CAPABILITY_TABLE.picoos[0]

  const matrixDiff = useMemo(() => {
    const keys = new Set([
      ...Object.keys(visionRow.flags),
      ...Object.keys(picoRow.flags),
    ])
    return [...keys]
      .sort((a, b) => a.localeCompare(b))
      .map(key => ({
        key,
        vision: visionRow.flags[key],
        pico: picoRow.flags[key],
        same: visionRow.flags[key] === picoRow.flags[key],
      }))
  }, [visionRow, picoRow])

  const mismatchCount = matrixDiff.filter(r => !r.same).length

  const [matrixFilter, setMatrixFilter] = useState('')
  const [tab, setTab] = useState<CapabilitiesTab>('env')
  const filteredMatrix = useMemo(() => {
    const q = matrixFilter.trim().toLowerCase()
    if (!q) return matrixDiff
    return matrixDiff.filter(r => r.key.toLowerCase().includes(q))
  }, [matrixDiff, matrixFilter])

  return (
    <div className="min-h-full bg-[#0c0c0c] pb-16">
      <div className="border-b border-gray-800/80 bg-gradient-to-r from-sky-950/40 via-[#12121a] to-violet-950/30">
        <div className="mx-auto max-w-[1600px] px-6 py-10 sm:px-10">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-sky-400/90">
            WebSpatial test server
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Runtime capabilities
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-400">
            Live{' '}
            <code className="rounded bg-black/40 px-1.5 py-0.5 text-gray-300">
              supports()
            </code>{' '}
            for this browser, grouped tables, and a static visionOS vs picoOS
            diff from{' '}
            <code className="rounded bg-black/40 px-1.5 py-0.5 text-gray-300">
              CAPABILITY_TABLE
            </code>
            .
          </p>

          <div
            role="tablist"
            aria-label="Capability views"
            className="mt-8 flex flex-wrap gap-0 border-b border-gray-700/90"
          >
            {CAPABILITY_TABS.map(t => {
              const selected = tab === t.id
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  id={`capabilities-tab-${t.id}`}
                  aria-selected={selected}
                  aria-controls={`capabilities-panel-${t.id}`}
                  onClick={() => setTab(t.id)}
                  className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a1628] ${
                    selected
                      ? 'border-sky-400 text-white'
                      : 'border-transparent text-gray-500 hover:border-gray-600 hover:text-gray-300'
                  }`}
                >
                  {t.label}
                </button>
              )
            })}
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-gray-800 bg-black/30 px-4 py-3 backdrop-blur-sm">
              <div className="text-xs font-medium text-gray-500">
                Runtime type
              </div>
              <div className="mt-1 font-mono text-lg text-white">
                {rt.type ?? 'null'}
              </div>
            </div>
            <div className="rounded-xl border border-gray-800 bg-black/30 px-4 py-3 backdrop-blur-sm">
              <div className="text-xs font-medium text-gray-500">
                Shell version
              </div>
              <div className="mt-1 font-mono text-lg text-white">
                {rt.shellVersion ?? 'null'}
              </div>
            </div>
            <div className="rounded-xl border border-gray-800 bg-black/30 px-4 py-3 backdrop-blur-sm">
              <div className="text-xs font-medium text-gray-500">
                Live top-level Yes
              </div>
              <div className="mt-1 text-lg font-semibold text-emerald-400">
                {liveStats.yes}
                <span className="text-sm font-normal text-gray-500">
                  {' '}
                  / {liveStats.total}
                </span>
              </div>
            </div>
            <div className="rounded-xl border border-gray-800 bg-black/30 px-4 py-3 backdrop-blur-sm">
              <div className="text-xs font-medium text-gray-500">
                Matrix mismatches
              </div>
              <div
                className={`mt-1 text-lg font-semibold ${mismatchCount ? 'text-rose-400' : 'text-emerald-400'}`}
              >
                {mismatchCount}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1600px] px-6 pt-10 sm:px-10">
        <div
          role="tabpanel"
          id="capabilities-panel-env"
          aria-labelledby="capabilities-tab-env"
          hidden={tab !== 'env'}
        >
          <SectionCard
            accent="sky"
            title="Environment"
            subtitle="User agent and internal runtime snapshot (getRuntime is not a public app API)."
          >
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-gray-800/80 bg-[#0f0f0f] p-4">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  navigator.userAgent
                </div>
                <pre className="max-h-48 overflow-auto text-xs leading-relaxed text-gray-300 whitespace-pre-wrap break-all font-mono">
                  {ua}
                </pre>
              </div>
              <div className="rounded-xl border border-gray-800/80 bg-[#0f0f0f] p-4">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  getRuntime()
                </div>
                <pre className="max-h-48 overflow-auto text-sm leading-relaxed text-sky-100/90 font-mono">
                  {JSON.stringify(rt, null, 2)}
                </pre>
              </div>
            </div>
            <p className="mt-4 text-xs text-gray-600">
              Public entry:{' '}
              <code className="text-gray-500">WebSpatialRuntime.supports</code>{' '}
              — same underlying probe as core{' '}
              <code className="text-gray-500">supports</code>.
            </p>
          </SectionCard>
        </div>

        <div
          role="tabpanel"
          id="capabilities-panel-live"
          aria-labelledby="capabilities-tab-live"
          hidden={tab !== 'live'}
        >
          <SectionCard
            accent="violet"
            title="Live capabilities"
            subtitle={`${TOP_LEVEL_KEYS.length} top-level keys and sub-tokens for the current page load.`}
          >
            {KEY_GROUPS.map(group => (
              <div key={group.title} className="mb-10 last:mb-0">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-violet-200/90">
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
                  {group.title}
                </h3>
                <div className="overflow-hidden rounded-xl border border-gray-800/80">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#1a1a1f] text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        <th className="px-4 py-3">supports(name)</th>
                        <th className="w-28 px-4 py-3">Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.keys.map((name, i) => {
                        const row = liveTopLevel.find(r => r.name === name)
                        const v = row?.value
                        return (
                          <tr
                            key={name}
                            className={`border-t border-gray-800/60 ${i % 2 === 0 ? 'bg-black/20' : 'bg-transparent'} hover:bg-violet-500/5`}
                          >
                            <td className="px-4 py-2.5 font-mono text-[13px] text-gray-200">
                              {name}
                            </td>
                            <td className="px-4 py-2.5">
                              <ResultBadge value={v} />
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}

            <h3 className="mb-3 mt-12 flex items-center gap-2 text-sm font-semibold text-violet-200/90">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
              Sub-tokens (single-token check)
            </h3>
            <div className="space-y-8">
              {liveSubTokens.map(group => (
                <div key={group.parent}>
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    {group.parent}
                  </div>
                  <div className="overflow-hidden rounded-xl border border-gray-800/80">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-[#1a1a1f] text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                          <th className="px-4 py-3">Call</th>
                          <th className="w-28 px-4 py-3">Result</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.rows.map((r, i) => (
                          <tr
                            key={r.token}
                            className={`border-t border-gray-800/60 ${i % 2 === 0 ? 'bg-black/20' : ''} hover:bg-violet-500/5`}
                          >
                            <td className="px-4 py-2.5 font-mono text-[13px] text-gray-200">
                              supports(&apos;{group.parent}&apos;, [&apos;
                              {r.token}&apos;])
                            </td>
                            <td className="px-4 py-2.5">
                              <ResultBadge value={r.value} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        <div
          role="tabpanel"
          id="capabilities-panel-matrix"
          aria-labelledby="capabilities-tab-matrix"
          hidden={tab !== 'matrix'}
        >
          <SectionCard
            accent="amber"
            title="Static matrix: visionOS vs picoOS"
            subtitle="Rows from capability-data.ts. Filter to find a flag quickly."
          >
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex flex-wrap gap-3">
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
                  <div className="text-xs text-amber-200/70">visionOS</div>
                  <div className="font-mono text-sm font-semibold text-amber-100">
                    WSAppShell/{visionRow.version}
                  </div>
                </div>
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
                  <div className="text-xs text-amber-200/70">picoOS</div>
                  <div className="font-mono text-sm font-semibold text-amber-100">
                    PicoWebApp/{picoRow.version}
                  </div>
                </div>
              </div>
              <label className="block w-full sm:max-w-xs">
                <span className="mb-1.5 block text-xs font-medium text-gray-500">
                  Filter flags
                </span>
                <input
                  type="search"
                  value={matrixFilter}
                  onChange={e => setMatrixFilter(e.target.value)}
                  placeholder="e.g. Model or WindowScene"
                  className="w-full rounded-lg border border-gray-700 bg-[#0f0f0f] px-3 py-2 text-sm text-white placeholder:text-gray-600 outline-none ring-sky-500/40 focus:border-sky-600/50 focus:ring-2"
                />
              </label>
            </div>

            <p className="mb-4 text-sm text-gray-500">
              Showing{' '}
              <span className="font-medium text-gray-300">
                {filteredMatrix.length}
              </span>{' '}
              of {matrixDiff.length} keys
              {mismatchCount === 0 ? (
                <span className="ml-2 text-emerald-400/90">— all match</span>
              ) : null}
            </p>

            <div className="overflow-hidden rounded-xl border border-gray-800/80">
              <div className="max-h-[65vh] overflow-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10 shadow-sm shadow-black/50">
                    <tr className="bg-[#222228] text-left text-xs font-semibold uppercase tracking-wider text-gray-400 backdrop-blur-md">
                      <th className="px-4 py-3">Flag key</th>
                      <th className="px-4 py-3">visionOS</th>
                      <th className="px-4 py-3">picoOS</th>
                      <th className="w-24 px-4 py-3">Match</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMatrix.map((row, i) => (
                      <tr
                        key={row.key}
                        className={`border-t border-gray-800/60 ${
                          !row.same
                            ? 'bg-rose-950/25'
                            : i % 2 === 0
                              ? 'bg-black/15'
                              : ''
                        } transition-colors hover:bg-white/[0.04]`}
                      >
                        <td className="px-4 py-2.5 font-mono text-[13px] text-gray-200">
                          {row.key}
                        </td>
                        <td className="px-4 py-2.5">
                          <ResultBadge value={row.vision} />
                        </td>
                        <td className="px-4 py-2.5">
                          <ResultBadge value={row.pico} />
                        </td>
                        <td className="px-4 py-2.5">
                          {row.same ? (
                            <span className="text-xs font-medium text-emerald-400/90">
                              OK
                            </span>
                          ) : (
                            <span className="text-xs font-semibold text-rose-400">
                              Diff
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </SectionCard>
        </div>

        <div
          role="tabpanel"
          id="capabilities-panel-contract"
          aria-labelledby="capabilities-tab-contract"
          hidden={tab !== 'contract'}
        >
          <SectionCard
            accent="violet"
            title="OpenSpec contract checks"
            subtitle="§3.5.1 window depth; §3.5.2 live spatialized ref (xrClientDepth / xrOffsetBack); §3.6 Model sub-tokens vs ref."
          >
            <ContractChecksPanel />
          </SectionCard>
        </div>

        <footer className="rounded-xl border border-dashed border-gray-800 bg-black/20 px-4 py-3 text-center text-xs text-gray-600">
          Check:{' '}
          <code className="text-gray-500">
            WebSpatialRuntime.supports(&apos;Model&apos;)
          </code>{' '}
          ==={' '}
          <code className="text-gray-400">
            {String(WebSpatialRuntime.supports('Model'))}
          </code>
        </footer>
      </div>
    </div>
  )
}
