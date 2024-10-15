import { useEffect, useRef, useState } from "react";
import { decodeSpatialStyle } from "../spatialCSSStyleCodec";
import { SpatialStyleInfoUpdateEvent } from "../notifyUpdateStandInstanceLayout";

function useForceUpdate() {
  const [, setToggle] = useState(false);
  return () => setToggle((toggle) => !toggle);
}

function checkClassAndUpdateZOffset(
  targetNode: HTMLElement,
  updateZOffset: (zOffset: number) => void,
) {
  const computedStyle = getComputedStyle(targetNode);
  // try to decode content
  const spatialStyle = decodeSpatialStyle(computedStyle);
  if (spatialStyle) {
    updateZOffset(spatialStyle.back);
  } else {
    updateZOffset(0.000001)
  }
}

function useMonitorNodeClassStyleChange(
  targetStandardNodeGetter: () => Element | null | undefined,
  updateZOffset: (zOffset: number) => void,
) {
  useEffect(() => {
    const targetNode: HTMLElement = targetStandardNodeGetter() as HTMLElement;
    const observer = new MutationObserver((mutationsList) => {
      for (let mutation of mutationsList) {
        if (mutation.type === "attributes") {
          if (mutation.target === targetNode) {
            checkClassAndUpdateZOffset(targetNode, updateZOffset);
          }
        }
      }
    });
    const config = {
      childList: false,
      subtree: false,
      attributes: true,
      // attributeFilter: ["style", "class"],
    };
    observer.observe(targetNode, config);

    return () => {
      observer.disconnect();
    };
  }, []);
}

function useMonitorGlobalStyles(
  targetStandardNodeGetter: () => Element | null | undefined,
  updateZOffset: (zOffset: number) => void,
) {
  useEffect(() => {
    const targetNode: HTMLElement = targetStandardNodeGetter() as HTMLElement;
    const onSpatialStyleInfoUpdateEvent = () => {
      checkClassAndUpdateZOffset(targetNode, updateZOffset);
    };

    document.addEventListener(
      SpatialStyleInfoUpdateEvent.standInstanceLayout,
      onSpatialStyleInfoUpdateEvent
    );

    return () => {
      document.removeEventListener(
        SpatialStyleInfoUpdateEvent.standInstanceLayout,
        onSpatialStyleInfoUpdateEvent
      );
    };
  }, []);
}

export function useSpatialStyle(
  targetStandardNodeGetter: () => Element | null | undefined,
  resizeSpatial:  () => Promise<void>
) {
  const spatialStyle = useRef<{ zOffset: number | undefined }>({
    zOffset: undefined,
  });

  const forceUpdate = useForceUpdate();
  const innerUpdateZOffset = (zOffset: number) => {
    spatialStyle.current.zOffset = zOffset
    resizeSpatial()
    forceUpdate()
  }
  
  useEffect(() => {
    const targetNode: HTMLElement = targetStandardNodeGetter() as HTMLElement;
    checkClassAndUpdateZOffset(targetNode, innerUpdateZOffset);
  }, []);

  useMonitorGlobalStyles(targetStandardNodeGetter, innerUpdateZOffset);
  useMonitorNodeClassStyleChange(
    targetStandardNodeGetter,
    innerUpdateZOffset
  );

  return spatialStyle
}
