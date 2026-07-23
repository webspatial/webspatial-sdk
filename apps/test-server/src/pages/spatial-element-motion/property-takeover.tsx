import { useState } from 'react'
import { supports } from '@webspatial/core-sdk'
import type { SpatializedVisualValues } from '@webspatial/core-sdk'
import { useAnimation } from '@webspatial/react-sdk/experimental'
import {
  SpatialElementMotionPageShell,
  Log,
  PlayStateBadge,
  btnCls,
  btnPrimary,
  fmtValues,
  useLog,
} from './shared'

/** Represents a user-controlled translate vector in pixels. */
type TranslateVector = {
  x: number
  y: number
  z: number
}

/** Represents the tab ids for the takeover demo. */
type TakeoverMode = 'translate' | 'opacity'

/** Defines the initial translate vector used by the demo animation. */
const ORIGIN_TRANSLATE: TranslateVector = { x: 0, y: 0, z: 0 }

/** Defines the target translate vector configured for the demo animation. */
const TARGET_TRANSLATE: TranslateVector = { x: 100, y: 10, z: 100 }

/** Defines the per-click translate delta for manual user takeover controls. */
const TAKEOVER_STEP: TranslateVector = { x: 40, y: 20, z: 40 }

/** Defines the initial opacity used by the demo animation. */
const ORIGIN_OPACITY = 1.0

/** Defines the target opacity configured for the demo animation. */
const TARGET_OPACITY = 0.2

/** Defines the per-click opacity delta for manual takeover controls. */
const OPACITY_STEP = 0.15

/** Formats a translate vector into a CSS translate3d string. */
function formatTranslate3d(translate: TranslateVector): string {
  return `translate3d(${translate.x}px, ${translate.y}px, ${translate.z}px)`
}

/** Returns a complete translate vector from the animation completion payload. */
function readCompletedTranslate(
  values: SpatializedVisualValues | undefined,
): TranslateVector | null {
  const translate = values?.transform?.translate
  if (
    typeof translate?.x !== 'number' ||
    typeof translate?.y !== 'number' ||
    typeof translate?.z !== 'number'
  ) {
    return null
  }
  return {
    x: translate.x,
    y: translate.y,
    z: translate.z,
  }
}

/** Clamps opacity into the valid CSS range. */
function clampOpacity(value: number): number {
  return Math.max(0, Math.min(1, value))
}

/** Formats an opacity value for log lines and status text. */
function formatOpacity(value: number): string {
  return value.toFixed(2)
}

/** Returns the completed opacity from the animation completion payload. */
function readCompletedOpacity(
  values: SpatializedVisualValues | undefined,
): number | null {
  return typeof values?.opacity === 'number' ? values.opacity : null
}

function TranslateTakeoverPanel() {
  const { lines, log, clear } = useLog()
  /** Tracks the editable translate after natural completion; null means editing is still locked. */
  const [userTranslate, setUserTranslate] = useState<TranslateVector | null>(
    null,
  )
  /** Indicates whether this runtime can use native element playback. */
  const supportsElementPlayback = supports('useAnimation')

  const [motion, api, style] = useAnimation({
    from: {
      transform: { translate: ORIGIN_TRANSLATE },
    },
    to: {
      transform: { translate: TARGET_TRANSLATE },
    },
    duration: 2.0,
    timingFunction: 'easeInOut',
    autoStart: false,
    onStart: () => {
      setUserTranslate(null)
      log('translate: onStart')
    },
    onComplete: values => {
      const nextUserTranslate = readCompletedTranslate(values)
      if (!nextUserTranslate) {
        log('translate: onComplete missing translate payload')
        return
      }
      setUserTranslate(nextUserTranslate)
      log(`translate: onComplete → ${fmtValues(values)}`)
      log(
        `translate: natural completion unlocked direct editing at ${formatTranslate3d(
          nextUserTranslate,
        )}`,
      )
    },
    onStop: values => log(`translate: onStop → ${fmtValues(values)}`),
    onReset: values => log(`translate: onReset → ${fmtValues(values)}`),
    onError: err => log(`translate: onError → ${err.reason}`),
  })

  /** Indicates whether the user can edit translate directly after natural completion. */
  const canEditTranslate = userTranslate !== null
  /** Resolves the rendered panel style from animation output plus user translate overrides. */
  const resolvedStyle = canEditTranslate
    ? {
        ...style,
        transform: formatTranslate3d(userTranslate),
      }
    : style

  /** Starts a fresh playback session under animation ownership. */
  const handlePlay = () => {
    setUserTranslate(null)
    log('translate: animation ownership active')
    api.play()
  }

  /** Resets the session to the origin translate and clears takeover mode. */
  const handleReset = () => {
    setUserTranslate(null)
    log('translate: reset to origin and waiting for natural completion')
    api.reset()
  }

  /** Stops the current playback session and returns control bookkeeping to animation mode. */
  const handleStop = () => {
    setUserTranslate(null)
    log('translate: stopped and cleared direct editing state')
    api.stop()
  }

  /** Applies a user-driven translate delta after animation ownership is released. */
  const applyTakeoverDelta = (delta: TranslateVector, label: string) => {
    if (!canEditTranslate) {
      log('translate: wait for natural completion before changing translate')
      return
    }
    setUserTranslate(previous => {
      if (!previous) return previous
      const next = {
        x: previous.x + delta.x,
        y: previous.y + delta.y,
        z: previous.z + delta.z,
      }
      log(`translate: ${label} → ${formatTranslate3d(next)}`)
      return next
    })
  }

  return (
    <section
      enable-xr-monitor
      className="rounded-2xl border border-gray-800 bg-[#111] p-6"
    >
      <div
        enable-xr
        xr-animation={motion}
        style={{
          ...resolvedStyle,
          width: 220,
          height: 160,
          background: 'linear-gradient(135deg, #14532d, #16a34a)',
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px solid rgba(255, 255, 255, 0.18)',
        }}
      >
        <span style={{ color: 'white', fontSize: 16 }}>Take Over Me</span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button className={btnPrimary} onClick={handlePlay}>
          Play
        </button>
        <button className={btnCls} onClick={handleStop}>
          Stop
        </button>
        <button className={btnCls} onClick={handleReset}>
          Reset
        </button>
        <button className={btnCls} onClick={clear}>
          Clear Log
        </button>
      </div>

      <div className="mt-4 rounded-lg border border-emerald-900/70 bg-emerald-950/30 p-4 text-xs text-emerald-100">
        <h4 className="mb-2 font-medium text-emerald-200">
          Translate Controls
        </h4>
        <div className="mt-2 font-mono">
          editReady={String(canEditTranslate)}
        </div>
        <div className="mt-2 font-mono">
          userTranslate=
          {userTranslate
            ? formatTranslate3d(userTranslate)
            : 'waiting-for-onComplete'}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            className={btnCls}
            disabled={!canEditTranslate}
            onClick={() =>
              applyTakeoverDelta({ x: TAKEOVER_STEP.x, y: 0, z: 0 }, 'move +X')
            }
          >
            Move +X 40
          </button>
          <button
            className={btnCls}
            disabled={!canEditTranslate}
            onClick={() =>
              applyTakeoverDelta({ x: 0, y: -TAKEOVER_STEP.y, z: 0 }, 'move -Y')
            }
          >
            Move -Y 20
          </button>
          <button
            className={btnCls}
            disabled={!canEditTranslate}
            onClick={() =>
              applyTakeoverDelta({ x: 0, y: 0, z: TAKEOVER_STEP.z }, 'move +Z')
            }
          >
            Move +Z 40
          </button>
        </div>
        <div className="mt-3 text-emerald-50/90">
          The panel waits for the natural <code>onComplete</code> callback and
          then enables direct position edits using the returned{' '}
          <code>transform.translate</code> as the baseline.
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <PlayStateBadge state={api.playState} />
        <span className="text-xs font-mono text-gray-500">
          isAnimating={String(api.isAnimating)} &nbsp; isPaused=
          {String(api.isPaused)} &nbsp; finished={String(api.finished)}
        </span>
      </div>

      <div className="mt-3 rounded-lg border border-sky-900/70 bg-sky-950/30 p-4 text-xs text-sky-100">
        <h4 className="mb-2 font-medium text-sky-200">
          Runtime Capability Probe
        </h4>
        <div className="font-mono">
          supports(useAnimation)={String(supportsElementPlayback)}
        </div>
        <div className="mt-2 text-sky-50/90">
          {supportsElementPlayback
            ? 'Native element motion is available in this runtime.'
            : 'Native element motion is unavailable in this runtime. If playState changes but the panel does not move, the page may be using the web fallback path.'}
        </div>
      </div>

      <Log lines={lines} />

      <div className="mt-4 rounded-lg border border-gray-800 bg-black/30 p-4 text-xs text-gray-500">
        <h4 className="mb-2 font-medium text-gray-400">Verification Steps</h4>
        <ul className="list-disc space-y-1 pl-4">
          <li>
            <strong>Play</strong> and wait until the animation completes
            naturally.
          </li>
          <li>
            <strong>Move +X / -Y / +Z</strong> unlock only after{' '}
            <code>onComplete</code> returns a full <code>translate</code>{' '}
            payload.
          </li>
          <li>
            <strong>Move +X / -Y / +Z</strong> should keep moving the panel
            after completion, proving the user now owns the returned final
            translate value.
          </li>
          <li>
            <strong>Play</strong> or <strong>Reset</strong> again should
            reattach animation ownership for the next session.
          </li>
        </ul>
      </div>
    </section>
  )
}

function OpacityTakeoverPanel() {
  const { lines, log, clear } = useLog()
  /** Tracks the editable opacity after natural completion; null means editing is still locked. */
  const [userOpacity, setUserOpacity] = useState<number | null>(null)
  /** Indicates whether this runtime can use native element playback. */
  const supportsElementPlayback = supports('useAnimation')

  const [motion, api, style] = useAnimation({
    from: {
      opacity: ORIGIN_OPACITY,
    },
    to: {
      opacity: TARGET_OPACITY,
    },
    duration: 2.0,
    timingFunction: 'easeInOut',
    autoStart: false,
    onStart: () => {
      setUserOpacity(null)
      log('opacity: onStart')
    },
    onComplete: values => {
      const nextUserOpacity = readCompletedOpacity(values)
      if (nextUserOpacity === null) {
        log('opacity: onComplete missing opacity payload')
        return
      }
      setUserOpacity(nextUserOpacity)
      log(`opacity: onComplete → ${fmtValues(values)}`)
      log(
        `opacity: natural completion unlocked direct editing at ${formatOpacity(
          nextUserOpacity,
        )}`,
      )
    },
    onStop: values => log(`opacity: onStop → ${fmtValues(values)}`),
    onReset: values => log(`opacity: onReset → ${fmtValues(values)}`),
    onError: err => log(`opacity: onError → ${err.reason}`),
  })

  /** Indicates whether the user can edit opacity directly after natural completion. */
  const canEditOpacity = userOpacity !== null
  /** Resolves the rendered panel style from animation output plus user opacity overrides. */
  const resolvedStyle = canEditOpacity
    ? {
        ...style,
        opacity: userOpacity,
      }
    : style

  /** Starts a fresh playback session under animation ownership. */
  const handlePlay = () => {
    setUserOpacity(null)
    log('opacity: animation ownership active')
    api.play()
  }

  /** Resets the session to the original opacity and clears direct editing state. */
  const handleReset = () => {
    setUserOpacity(null)
    log('opacity: reset to origin and waiting for natural completion')
    api.reset()
  }

  /** Stops the current playback session and clears direct editing state. */
  const handleStop = () => {
    setUserOpacity(null)
    log('opacity: stopped and cleared direct editing state')
    api.stop()
  }

  /** Applies a user-driven opacity delta after animation ownership is released. */
  const applyOpacityDelta = (delta: number, label: string) => {
    if (!canEditOpacity) {
      log('opacity: wait for natural completion before changing opacity')
      return
    }
    setUserOpacity(previous => {
      if (previous === null) return previous
      const next = clampOpacity(previous + delta)
      log(`opacity: ${label} → ${formatOpacity(next)}`)
      return next
    })
  }

  /** Sets the opacity to a concrete user-controlled value after natural completion. */
  const setOpacityValue = (value: number, label: string) => {
    if (!canEditOpacity) {
      log('opacity: wait for natural completion before setting opacity')
      return
    }
    const next = clampOpacity(value)
    setUserOpacity(next)
    log(`opacity: ${label} → ${formatOpacity(next)}`)
  }

  return (
    <section
      enable-xr-monitor
      className="rounded-2xl border border-gray-800 bg-[#111] p-6"
    >
      <div
        enable-xr
        xr-animation={motion}
        style={{
          ...resolvedStyle,
          width: 220,
          height: 160,
          background: 'linear-gradient(135deg, #1d4ed8, #7c3aed)',
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px solid rgba(255, 255, 255, 0.18)',
        }}
      >
        <span style={{ color: 'white', fontSize: 16 }}>Fade And Edit Me</span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button className={btnPrimary} onClick={handlePlay}>
          Play
        </button>
        <button className={btnCls} onClick={handleStop}>
          Stop
        </button>
        <button className={btnCls} onClick={handleReset}>
          Reset
        </button>
        <button className={btnCls} onClick={clear}>
          Clear Log
        </button>
      </div>

      <div className="mt-4 rounded-lg border border-emerald-900/70 bg-emerald-950/30 p-4 text-xs text-emerald-100">
        <h4 className="mb-2 font-medium text-emerald-200">Opacity Controls</h4>
        <div className="mt-2 font-mono">editReady={String(canEditOpacity)}</div>
        <div className="mt-2 font-mono">
          userOpacity=
          {userOpacity === null
            ? 'waiting-for-onComplete'
            : formatOpacity(userOpacity)}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            className={btnCls}
            disabled={!canEditOpacity}
            onClick={() => applyOpacityDelta(OPACITY_STEP, 'increase opacity')}
          >
            Opacity +0.15
          </button>
          <button
            className={btnCls}
            disabled={!canEditOpacity}
            onClick={() => applyOpacityDelta(-OPACITY_STEP, 'decrease opacity')}
          >
            Opacity -0.15
          </button>
          <button
            className={btnCls}
            disabled={!canEditOpacity}
            onClick={() => setOpacityValue(1.0, 'set opacity to 1.00')}
          >
            Set 1.00
          </button>
        </div>
        <div className="mt-3 text-emerald-50/90">
          The panel waits for the natural <code>onComplete</code> callback and
          then enables direct opacity edits using the returned{' '}
          <code>opacity</code> as the baseline.
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <PlayStateBadge state={api.playState} />
        <span className="text-xs font-mono text-gray-500">
          isAnimating={String(api.isAnimating)} &nbsp; isPaused=
          {String(api.isPaused)} &nbsp; finished={String(api.finished)}
        </span>
      </div>

      <div className="mt-3 rounded-lg border border-sky-900/70 bg-sky-950/30 p-4 text-xs text-sky-100">
        <h4 className="mb-2 font-medium text-sky-200">
          Runtime Capability Probe
        </h4>
        <div className="font-mono">
          supports(useAnimation)={String(supportsElementPlayback)}
        </div>
        <div className="mt-2 text-sky-50/90">
          {supportsElementPlayback
            ? 'Native element motion is available in this runtime.'
            : 'Native element motion is unavailable in this runtime. If playState changes but the panel does not fade, the page may be using the web fallback path.'}
        </div>
      </div>

      <Log lines={lines} />

      <div className="mt-4 rounded-lg border border-gray-800 bg-black/30 p-4 text-xs text-gray-500">
        <h4 className="mb-2 font-medium text-gray-400">Verification Steps</h4>
        <ul className="list-disc space-y-1 pl-4">
          <li>
            <strong>Play</strong> and wait until the opacity animation completes
            naturally.
          </li>
          <li>
            <strong>Opacity +0.15 / -0.15 / Set 1.00</strong> unlock only after{' '}
            <code>onComplete</code> returns an <code>opacity</code> value.
          </li>
          <li>
            <strong>Opacity controls</strong> should keep changing the panel
            after completion, proving the user now owns the returned final
            opacity value.
          </li>
          <li>
            <strong>Play</strong> or <strong>Reset</strong> again should
            reattach animation ownership for the next session.
          </li>
        </ul>
      </div>
    </section>
  )
}

export default function PropertyTakeoverPage() {
  /** Tracks the active takeover demo tab. */
  const [mode, setMode] = useState<TakeoverMode>('translate')

  return (
    <SpatialElementMotionPageShell
      title="Property Takeover"
      description={
        <>
          Switch between <code>translate</code> and <code>opacity</code>{' '}
          takeover demos. Both scenarios validate that after a naturally
          completed element motion session, the user can directly edit the final
          property value returned by <code>onComplete</code>.
        </>
      }
    >
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          className={mode === 'translate' ? btnPrimary : btnCls}
          onClick={() => setMode('translate')}
        >
          Translate
        </button>
        <button
          className={mode === 'opacity' ? btnPrimary : btnCls}
          onClick={() => setMode('opacity')}
        >
          Opacity
        </button>
      </div>
      {mode === 'translate' ? (
        <TranslateTakeoverPanel />
      ) : (
        <OpacityTakeoverPanel />
      )}
    </SpatialElementMotionPageShell>
  )
}
