import { useMonitorDomChange } from "./hooks/useMonitorDomChange";
import { useMonitorDocumentHeaderChange } from "./hooks/useMonitorDocumentHeaderChange";
import React from "react";

/**
 * Component that add MutationObserver to monitor all dom changes including its children.
 * If any dom changes, it will notify all SpatialDiv to render again for the purpose of sync standInstance layout to portalInstance.
 */
export function SpatialMonitor(props: any) {
    const { children, ...otherProps } = props;
    const ref = useMonitorDomChange()
    useMonitorDocumentHeaderChange()

    return <div ref={ref} {...otherProps}> {children} </div>
}