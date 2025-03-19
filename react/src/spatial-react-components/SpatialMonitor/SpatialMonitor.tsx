import { useMonitorDomChange } from './useMonitorDomChange'
import { useMonitorDocumentHeaderChange } from './useMonitorDocumentHeaderChange'
import { ElementType, ForwardedRef, forwardRef } from 'react'

type SpatialMonitorProps = {
  El?: ElementType
}

/**
 * Component that add MutationObserver to monitor all dom changes including its children.
 * If any dom changes, it will notify all SpatialDiv to render again for the purpose of sync standInstance layout to portalInstance.
 */
function SpatialMonitorBase(
  inProps: SpatialMonitorProps,
  inRef: ForwardedRef<HTMLElement>,
) {
  const { El = 'div', ...props } = inProps
  const ref = useMonitorDomChange(inRef)
  useMonitorDocumentHeaderChange()

  return <El {...props} ref={ref} />
}

export const SpatialMonitor = forwardRef(SpatialMonitorBase)
