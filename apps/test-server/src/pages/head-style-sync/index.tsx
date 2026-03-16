import { useRef, useCallback, useState, useEffect } from 'react'
import { enableDebugTool } from '@webspatial/react-sdk'

enableDebugTool()

function HeadSyncProbe() {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const getTargetDocument = useCallback(() => {
    return rootRef.current?.ownerDocument ?? null
  }, [])

  const [status, setStatus] = useState<'pending' | 'pass' | 'fail'>('pending')
  const [message, setMessage] = useState<string>('')
  const baselineLinkRef = useRef<HTMLLinkElement | null>(null)
  const baselineCountRef = useRef<number>(0)
  const [baselineHref, setBaselineHref] = useState<string>('')
  const [currentInfo, setCurrentInfo] = useState<{
    linkCount: number
    firstHref: string
    baselineConnected: boolean
  }>({ linkCount: 0, firstHref: '', baselineConnected: false })

  const collect = useCallback(() => {
    const targetDocument = getTargetDocument()
    if (!targetDocument) {
      setCurrentInfo({ linkCount: 0, firstHref: '', baselineConnected: false })
      return {
        links: [] as HTMLLinkElement[],
        first: null as HTMLLinkElement | null,
      }
    }

    const links = Array.from(
      targetDocument.head.querySelectorAll(
        'link[rel="stylesheet"][data-webspatial-sync="1"]',
      ),
    ) as HTMLLinkElement[]
    const first = links[0] ?? null
    const baseline = baselineLinkRef.current
    setCurrentInfo({
      linkCount: links.length,
      firstHref: first?.href ?? '',
      baselineConnected: baseline?.isConnected ?? false,
    })
    return { links, first }
  }, [])

  // Capture a baseline synced stylesheet link node.
  useEffect(() => {
    const startedAt = Date.now()
    const timer = window.setInterval(() => {
      const { links, first } = collect()
      if (baselineLinkRef.current) return

      if (links.length > 0 && first) {
        baselineLinkRef.current = first
        baselineCountRef.current = links.length
        setBaselineHref(first.href)
        setMessage(
          'Baseline stylesheet link captured. You can run the stress test now.',
        )
        setStatus('pass')
        window.clearInterval(timer)
        return
      }

      if (Date.now() - startedAt > 5000) {
        setStatus('fail')
        setMessage(
          'Timed out: no synced stylesheet links were observed in the SpatialDiv child window head.',
        )
        window.clearInterval(timer)
      }
    }, 100)

    return () => {
      window.clearInterval(timer)
    }
  }, [collect])

  // Watch head changes and ensure synced stylesheet links are not replaced.
  useEffect(() => {
    if (!baselineLinkRef.current) return

    const check = () => {
      const { links } = collect()
      const baseline = baselineLinkRef.current
      const baselineCount = baselineCountRef.current

      if (!baseline) return
      if (!baseline.isConnected) {
        setStatus('fail')
        setMessage(
          'FAIL: the baseline stylesheet link was removed/replaced (possible duplicate injection or full rebuild).',
        )
        return
      }

      if (links.length > baselineCount) {
        setStatus('fail')
        setMessage(
          `FAIL: synced stylesheet link count increased (${baselineCount} -> ${links.length}), likely duplicate injection.`,
        )
        return
      }

      setStatus('pass')
    }

    // Initial check
    check()

    const obs = new MutationObserver(() => check())
    obs.observe(document.head, { childList: true, subtree: true })
    return () => {
      obs.disconnect()
    }
  }, [collect])

  const statusColor =
    status === 'pass' ? '#16a34a' : status === 'fail' ? '#dc2626' : '#f59e0b'

  return (
    <div
      ref={rootRef}
      style={{
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial',
        color: 'white',
        background: 'rgba(0,0,0,0.75)',
        padding: 12,
        borderRadius: 10,
        width: 360,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <strong>Head style sync probe</strong>
        <span style={{ color: statusColor, fontWeight: 700 }}>
          {status.toUpperCase()}
        </span>
      </div>

      {message && (
        <div style={{ marginTop: 8, fontSize: 12, opacity: 0.9 }}>
          {message}
        </div>
      )}

      <div style={{ marginTop: 10, fontSize: 12, lineHeight: 1.5 }}>
        <div>
          Baseline link href: <code>{baselineHref || '(pending)'}</code>
        </div>
        <div>
          Current synced link count: <code>{currentInfo.linkCount}</code>
        </div>
        <div>
          Baseline link connected:{' '}
          <code>{String(currentInfo.baselineConnected)}</code>
        </div>
        <div>
          Current first link href:{' '}
          <code>{currentInfo.firstHref || '(none)'}</code>
        </div>
      </div>
    </div>
  )
}

export default function HeadStyleSyncPage() {
  const [running, setRunning] = useState(false)
  const [runCount, setRunCount] = useState(0)

  const mutateHostHeadOnce = useCallback(() => {
    const id = 'webspatial-head-sync-test-style'
    const prev = document.getElementById(id)
    if (prev) prev.parentNode?.removeChild(prev)

    const style = document.createElement('style')
    style.id = id
    style.textContent = `/* head sync stress */\n:root{--webspatial-head-sync-seq:${Date.now()};}`
    document.head.appendChild(style)
  }, [])

  const runStress = useCallback(async () => {
    if (running) return
    setRunning(true)
    setRunCount(0)

    try {
      // Keep interval > 100ms so the host-side debounce still triggers sync.
      const rounds = 12
      for (let i = 0; i < rounds; i++) {
        mutateHostHeadOnce()
        setRunCount(i + 1)
        await new Promise(resolve => window.setTimeout(resolve, 140))
      }
    } finally {
      setRunning(false)
    }
  }, [mutateHostHeadOnce, running])

  return (
    <div className="p-10 text-white min-h-full">
      <h1 className="text-2xl mb-2">Head Style Sync</h1>
      <p className="text-sm text-gray-400 mb-6 max-w-3xl">
        This page validates the <code>&lt;div enable-xr&gt;</code> (SpatialDiv)
        path: when the host page <code>&lt;head&gt;</code> changes frequently,
        synced stylesheet <code>&lt;link&gt;</code> elements in the SpatialDiv
        child window should not be duplicated or replaced.
      </p>

      <div className="mb-4 flex gap-3 flex-wrap">
        <button
          className={`bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors ${
            running ? 'opacity-60 cursor-not-allowed' : ''
          }`}
          onClick={() => void runStress()}
          disabled={running}
        >
          {running ? `Running... (${runCount})` : 'Run host head stress'}
        </button>
        <button
          className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
          onClick={() => mutateHostHeadOnce()}
        >
          Mutate head once
        </button>
      </div>

      <div className="border border-gray-800 rounded-xl overflow-hidden bg-[#111] p-4 w-fit">
        <div
          enable-xr
          data-name="Head Style Sync (SpatialDiv)"
          style={{
            width: 520,
            height: 360,
            padding: 16,
            borderRadius: 12,
            background: 'rgba(20,20,20,0.6)',
            // Spatial custom vars
            '--xr-back': 120,
            '--xr-depth': 40,
          }}
        >
          <HeadSyncProbe />
        </div>
      </div>
    </div>
  )
}
