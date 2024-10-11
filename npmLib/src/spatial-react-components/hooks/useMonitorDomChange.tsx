import { useRef, useEffect } from "react";
import { notifyUpdateStandInstanceLayout } from "../globalInject";

export function useMonitorDomChange() {
    const ref = useRef(undefined);

    useEffect(() => {
      const observer = new MutationObserver((mutationsList) => {
        console.log('dbg useMonitorDomChange MutationObserver', mutationsList)
        notifyUpdateStandInstanceLayout();
      });
  
      const config = {
        childList: true,
        subtree: true,
        attributes: true,
        // attributeFilter: ["style", "class"],
      };
  
      ref.current && observer.observe(ref.current, config);
  
      return () => {
        observer.disconnect();
      };
    }, []);

    return ref;
  }
  