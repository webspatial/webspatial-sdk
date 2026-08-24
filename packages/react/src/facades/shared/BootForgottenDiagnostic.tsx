'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { isBootForgotten, warnBootForgotten } from './warnBootForgotten'

type DiagnosticRegistration = {
  setVisible: (visible: boolean) => void
}

const diagnosticRegistrations = new Map<symbol, DiagnosticRegistration>()

const diagnosticStyle: CSSProperties = {
  position: 'fixed',
  left: '16px',
  right: '16px',
  bottom: '16px',
  zIndex: 2147483647,
  boxSizing: 'border-box',
  padding: '12px 14px',
  border: '1px solid #b45309',
  borderRadius: '6px',
  background: '#fff7ed',
  color: '#7c2d12',
  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.18)',
  fontFamily:
    'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontSize: '14px',
  lineHeight: '20px',
  pointerEvents: 'none',
}

export function BootForgottenDiagnostic({
  componentName,
}: {
  componentName: string
}) {
  const registrationId = useRef(Symbol(componentName))
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!isBootForgotten()) return

    const id = registrationId.current
    diagnosticRegistrations.set(id, { setVisible })
    updateVisibleDiagnostic()
    warnBootForgotten(componentName)

    return () => {
      diagnosticRegistrations.delete(id)
      updateVisibleDiagnostic()
    }
  }, [componentName])

  if (!visible) return null

  return (
    <div data-webspatial-boot-forgotten role="alert" style={diagnosticStyle}>
      WebSpatial is rendering fallback UI because {componentName} mounted before
      bootSpatial() ran. Wrap this subtree in &lt;SpatialBoot&gt; or call await
      bootSpatial() before rendering WebSpatial components.
    </div>
  )
}

function updateVisibleDiagnostic(): void {
  const visibleDiagnostic = diagnosticRegistrations.keys().next().value ?? null
  for (const [id, registration] of diagnosticRegistrations) {
    registration.setVisible(id === visibleDiagnostic)
  }
}
