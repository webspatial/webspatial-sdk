type PhysicalMetricsValueShape = {
  meterToPtUnscaled: number
  meterToPtScaled: number
}

type WorldScalingCompensation = 'unscaled' | 'scaled'

declare global {
  interface Window {
    __physicalMetrics?: PhysicalMetricsValueShape
  }
}

type ConvertOption = { worldScalingCompensation: WorldScalingCompensation }

let snapshot: PhysicalMetricsValueShape = {
  meterToPtUnscaled: 1360,
  meterToPtScaled: 1360,
}

function getWorldScalingCompensation(options?: ConvertOption) {
  return options?.worldScalingCompensation ?? 'scaled' // default to scaled
}

export function point2physical(point: number, options?: ConvertOption) {
  const compensation = getWorldScalingCompensation(options)
  if (compensation === 'unscaled') {
    return point / snapshot.meterToPtUnscaled
  }
  return point / snapshot.meterToPtScaled
}

export function physical2point(physical: number, options?: ConvertOption) {
  const compensation = getWorldScalingCompensation(options)
  if (compensation === 'unscaled') {
    return physical * snapshot.meterToPtUnscaled
  }
  return physical * snapshot.meterToPtScaled
}

function updateValue() {
  const src = window.__physicalMetrics
  if (!src) return
  const next = {
    meterToPtScaled: src.meterToPtScaled ?? snapshot.meterToPtScaled,
    meterToPtUnscaled: src.meterToPtUnscaled ?? snapshot.meterToPtUnscaled,
  }
  // only update if there is a change
  if (
    next.meterToPtScaled !== snapshot.meterToPtScaled ||
    next.meterToPtUnscaled !== snapshot.meterToPtUnscaled
  ) {
    snapshot = next
  }
}

export function getValue(): PhysicalMetricsValueShape {
  return snapshot
}

export function subscribe(cb: any) {
  const handler = () => {
    updateValue()
    cb()
  }
  window.addEventListener('physicalMetricsUpdate', handler)
  return () => {
    window.removeEventListener('physicalMetricsUpdate', handler)
  }
}
