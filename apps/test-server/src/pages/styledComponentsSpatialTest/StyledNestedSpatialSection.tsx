import { useEffect, useRef, useState, type CSSProperties } from 'react'
import {
  CompareLabel,
  ControlRow,
  OpacityLabel,
  OpacityRange,
  OpacityValue,
  PageSection,
  PlainSpatialShell,
  SectionHeading,
  SectionNote,
  StyledSpatialBox,
  StyledSpatialBoxCssVar,
  ToggleButton,
} from './shared'

declare global {
  interface Window {
    __setStyledComponentsNestedOpacity?: (value: number) => number
    __getStyledComponentsNestedOpacity?: () => number
    __probeStyledComponentsNestedHeadSync?: () => StyledComponentsNestedHeadSyncProbe
  }
}

interface StyledComponentsNestedHeadSyncProbe {
  opacity: number
  targets: Array<{
    name: string
    hostClassName: string
    portalClassName: string
    portalOpacity: string | null
    syncedStyleCount: number
    portalHasRuleForClass: boolean
  }>
}

const NESTED_TARGETS = [
  'Nested styled inner A — $opacity',
  'Nested styled inner B — CSS var',
]

function findHostElement(name: string) {
  return Array.from(
    document.querySelectorAll<HTMLDivElement>('[data-name]'),
  ).find(element => element.getAttribute('data-name') === name)
}

function classListFrom(className: string) {
  return className.split(/\s+/).filter(Boolean)
}

function getSyncedRuleText(documentToRead: Document) {
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

export function StyledNestedSpatialSection() {
  const [hidden, setHidden] = useState(false)
  const [opacity, setOpacity] = useState(1)
  const opacityRef = useRef(opacity)

  opacityRef.current = opacity

  useEffect(() => {
    window.__setStyledComponentsNestedOpacity = value => {
      const next = Math.min(1, Math.max(0, value > 1 ? value / 100 : value))
      setOpacity(next)
      return next
    }
    window.__getStyledComponentsNestedOpacity = () => opacityRef.current
    window.__probeStyledComponentsNestedHeadSync = () => {
      return {
        opacity: opacityRef.current,
        targets: NESTED_TARGETS.map(name => {
          const host = findHostElement(name)
          const portalWindow =
            host && window.getSpatialized2DElement?.(host)?.windowProxy
          const portalDocument = portalWindow?.document
          const portalElement = portalDocument?.body
            .firstElementChild as HTMLElement | null
          const ruleText = portalDocument
            ? getSyncedRuleText(portalDocument)
            : ''
          const portalClassName = portalElement?.className ?? ''

          return {
            name,
            hostClassName: host?.className ?? '',
            portalClassName,
            portalOpacity: portalElement
              ? portalWindow!.getComputedStyle(portalElement).opacity
              : null,
            syncedStyleCount:
              portalDocument?.querySelectorAll(
                'style[data-webspatial-sync="1"]',
              ).length ?? 0,
            portalHasRuleForClass: hasRuleForAnyClass(
              ruleText,
              portalClassName,
            ),
          }
        }),
      }
    }
    console.log('[test-server-route] mounted StyledNestedSpatialSection')
    return () => {
      delete window.__setStyledComponentsNestedOpacity
      delete window.__getStyledComponentsNestedOpacity
      delete window.__probeStyledComponentsNestedHeadSync
    }
  }, [])

  return (
    <PageSection>
      <SectionHeading>4. Nested SpatialDiv styled host</SectionHeading>
      <SectionNote>
        Expected: the outer SpatialDiv owns one portal webview, and each nested
        styled host owns another child webview. Opacity changes on A should keep
        syncing styled-components rules into the nested child head.
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
      <PlainSpatialShell
        enable-xr
        data-name="Nested styled outer shell"
        style={{ '--xr-back': 100 } as CSSProperties}
      >
        <CompareLabel>A — nested SC prop ($opacity)</CompareLabel>
        <StyledSpatialBox
          enable-xr
          data-name="Nested styled inner A — $opacity"
          $hidden={hidden}
          $opacity={opacity}
        >
          Nested inner A — opacity from styled prop
        </StyledSpatialBox>
        <CompareLabel>B — nested CSS variable (--spatial-opacity)</CompareLabel>
        <StyledSpatialBoxCssVar
          enable-xr
          data-name="Nested styled inner B — CSS var"
          $hidden={hidden}
          style={{ '--spatial-opacity': opacity } as CSSProperties}
        >
          Nested inner B — opacity from CSS variable
        </StyledSpatialBoxCssVar>
      </PlainSpatialShell>
    </PageSection>
  )
}
