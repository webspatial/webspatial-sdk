import { useRef, useEffect } from "react";
import { notifyDOMUpdate } from "../notifyUpdateStandInstanceLayout";

export function useMonitorDomChange() {
    const ref = useRef(undefined);

    useEffect(() => {
      const observer = new MutationObserver((mutationsList) => {
        notifyDOMUpdate(mutationsList);
      });
  
      const config = {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["style", "class"],
      };
  
      ref.current && observer.observe(ref.current, config);
  
      return () => {
        observer.disconnect();
      };
    }, []);

    return ref;
  }
  