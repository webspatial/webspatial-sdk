import { useEffect, useState, type CSSProperties } from 'react'
import {
  CompareLabel,
  ControlRow,
  OpacityLabel,
  OpacityRange,
  OpacityValue,
  PageSection,
  SectionHeading,
  SectionNote,
  StyledSpatialBox,
  StyledSpatialBoxCssVar,
  ToggleButton,
} from './shared'

declare global {
  interface Window {
    __setStyledComponentsSpatialOpacity?: (value: number) => number
    __getStyledComponentsSpatialOpacity?: () => number
    __probeStyledComponentsSpatialHeadSync?: () => StyledComponentsSpatialHeadSyncProbe
    __runStyledComponentsSpatialOpacitySweep?: (
      values?: number[],
    ) => Promise<StyledComponentsSpatialHeadSyncSweep>
    getSpatialized2DElement?: (element: HTMLDivElement) => {
      windowProxy?: WindowProxy
    }
  }
}

type ProbeTargetLabel = 'A' | 'B'

interface StyledComponentsSpatialHeadSyncProbeTarget {
  label: ProbeTargetLabel
  hostClassName: string
  portalClassName: string
  portalOpacity: string | null
  syncedStyleCount: number
  portalHasRuleForClass: boolean
}

interface StyledComponentsSpatialHeadSyncProbe {
  opacity: number
  mismatchTargets: ProbeTargetLabel[]
  targets: StyledComponentsSpatialHeadSyncProbeTarget[]
}

interface StyledComponentsSpatialHeadSyncSweep {
  mismatchFrames: number
  frames: StyledComponentsSpatialHeadSyncProbe[]
}

const PROBE_TARGETS: Array<{ label: ProbeTargetLabel; name: string }> = [
  { label: 'A', name: 'Styled host A — $opacity' },
  { label: 'B', name: 'Styled host B — CSS var' },
]

function waitForFrames(count: number) {
  return new Promise<void>(resolve => {
    const tick = () => {
      count -= 1
      if (count <= 0) {
        resolve()
        return
      }
      window.requestAnimationFrame(tick)
    }
    window.requestAnimationFrame(tick)
  })
}

function findHostElement(name: string) {
  return Array.from(
    document.querySelectorAll<HTMLDivElement>('[data-name]'),
  ).find(element => element.getAttribute('data-name') === name)
}

function classListFrom(className: string) {
  return className.split(/\s+/).filter(Boolean)
}

function getStyleRuleText(documentToRead: Document) {
  return Array.from(
    documentToRead.querySelectorAll<HTMLStyleElement>(
      'style[data-webspatial-sync="1"]',
    ),
  )
    .flatMap(style => {
      const sheet = style.sheet
      if (!sheet) return [style.textContent ?? '']
      try {
        return Array.from(sheet.cssRules).map(rule => rule.cssText)
      } catch {
        return [style.textContent ?? '']
      }
    })
    .join('\n')
}

function hasRuleForAnyClass(ruleText: string, className: string) {
  return classListFrom(className).some(name => {
    const escaped = window.CSS?.escape?.(name) ?? name
    return ruleText.includes(`.${escaped}`) || ruleText.includes(`.${name}`)
  })
}

export function StyledSpatialHostSection() {
  const [hidden, setHidden] = useState(false)
  const [opacity, setOpacity] = useState(1)

  useEffect(() => {
    window.__setStyledComponentsSpatialOpacity = value => {
      const next = Math.min(1, Math.max(0, value > 1 ? value / 100 : value))
      setOpacity(next)
      return next
    }
    window.__getStyledComponentsSpatialOpacity = () => opacity
    window.__probeStyledComponentsSpatialHeadSync = () => {
      const targets = PROBE_TARGETS.map(({ label, name }) => {
        const host = findHostElement(name)
        const portalWindow =
          host && window.getSpatialized2DElement?.(host)?.windowProxy
        const portalDocument = portalWindow?.document
        const portalElement = portalDocument?.body
          .firstElementChild as HTMLElement | null
        const ruleText = portalDocument ? getStyleRuleText(portalDocument) : ''
        const portalClassName = portalElement?.className ?? ''
        return {
          label,
          hostClassName: host?.className ?? '',
          portalClassName,
          portalOpacity: portalElement
            ? portalWindow!.getComputedStyle(portalElement).opacity
            : null,
          syncedStyleCount:
            portalDocument?.querySelectorAll('style[data-webspatial-sync="1"]')
              .length ?? 0,
          portalHasRuleForClass: hasRuleForAnyClass(ruleText, portalClassName),
        }
      })
      return {
        opacity,
        mismatchTargets: targets
          .filter(target => !target.portalHasRuleForClass)
          .map(target => target.label),
        targets,
      }
    }
    window.__runStyledComponentsSpatialOpacitySweep = async values => {
      const frames: StyledComponentsSpatialHeadSyncProbe[] = []
      for (const value of values ?? [1, 0.1, 0.9, 0.2, 0.8, 0.05, 1]) {
        window.__setStyledComponentsSpatialOpacity?.(value)
        await waitForFrames(2)
        frames.push(window.__probeStyledComponentsSpatialHeadSync!())
      }
      return {
        mismatchFrames: frames.filter(frame => frame.mismatchTargets.length > 0)
          .length,
        frames,
      }
    }
    console.log('[test-server-route] mounted StyledSpatialHostSection')
    return () => {
      delete window.__setStyledComponentsSpatialOpacity
      delete window.__getStyledComponentsSpatialOpacity
      delete window.__probeStyledComponentsSpatialHeadSync
      delete window.__runStyledComponentsSpatialOpacitySweep
    }
  }, [])

  useEffect(() => {
    window.__getStyledComponentsSpatialOpacity = () => opacity
  }, [opacity])

  return (
    <PageSection>
      <SectionHeading>1. Styled host with enable-xr</SectionHeading>
      <SectionNote>
        Expected in spatial runtime: opacity / visibility / transform /
        --xr-back sync to the native spatial layer (whole panel). Two boxes
        below share one slider: <strong>A</strong> uses <code>$opacity</code>{' '}
        (new SC rules per step); <strong>B</strong> uses{' '}
        <code>--spatial-opacity</code> (stable class, inline var only). If B is
        smooth and A flickers, churn is likely class/head-sync timing—not native
        opacity alone.
      </SectionNote>
      <ControlRow>
        <ToggleButton type="button" onClick={() => setHidden(v => !v)}>
          {hidden ? 'Show' : 'Hide'}
        </ToggleButton>
        <OpacityLabel>
          Opacity
          <OpacityRange
            min={0}
            max={100}
            step={1}
            value={Math.round(opacity * 100)}
            onChange={e => setOpacity(Number(e.target.value) / 100)}
          />
          <OpacityValue>{opacity.toFixed(2)}</OpacityValue>
        </OpacityLabel>
      </ControlRow>
      <CompareLabel>A — SC prop ($opacity)</CompareLabel>
      <StyledSpatialBox
        enable-xr
        data-name="Styled host A — $opacity"
        $hidden={hidden}
        $opacity={opacity}
      >
        Portaled content — opacity from styled prop (head grows per step)
      </StyledSpatialBox>
      <CompareLabel>B — CSS variable (--spatial-opacity)</CompareLabel>
      <StyledSpatialBoxCssVar
        enable-xr
        data-name="Styled host B — CSS var"
        $hidden={hidden}
        style={{ '--spatial-opacity': opacity } as CSSProperties}
      >
        Portaled content — opacity from CSS variable (stable SC class)
      </StyledSpatialBoxCssVar>
    </PageSection>
  )
}
