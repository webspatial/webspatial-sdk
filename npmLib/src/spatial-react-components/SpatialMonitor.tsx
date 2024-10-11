import { useMonitorDomChange } from "./hooks/useMonitorDomChange";

export function SpatialMonitor(props: any) {
    const {children, ...otherProps} = props;
    const ref = useMonitorDomChange()
    return <div ref={ref} {...otherProps}> {children} </div>
}