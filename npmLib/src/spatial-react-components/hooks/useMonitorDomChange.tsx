import { useRef, useEffect } from "react";
import { notifyUpdateStandInstanceLayout } from "../notifyUpdateStandInstanceLayout";

export function useMonitorDomChange() {
    const ref = useRef(undefined);

    useEffect(() => {
      const observer = new MutationObserver((mutationsList) => {
        notifyUpdateStandInstanceLayout();
      });
  
      const config = {
        childList: true,
        subtree: true,
        attributes: true,
      };
  
      ref.current && observer.observe(ref.current, config);
  
      return () => {
        observer.disconnect();
      };
    }, []);

    return ref;
  }
  