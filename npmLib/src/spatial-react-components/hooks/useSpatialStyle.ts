import { useEffect, useRef, useState } from "react";
import { decodeSpatialStyle } from "../spatialCSSStyleCodec";
import { SpatialStyleInfoUpdateEvent } from "../notifyUpdateStandInstanceLayout";

function useForceUpdate() {
  const [, setToggle] = useState(false);
  return () => setToggle((toggle) => !toggle);
}

function checkClassAndUpdateZOffset(
  targetNode: HTMLElement,
  updateZOffset: (zOffset: number | undefined) => void,
) {
  const spatialStyle = parseSpatialStyle(targetNode);
  if (spatialStyle) {
    updateZOffset(spatialStyle.back);
  } else {
    updateZOffset(undefined)
  }
}

function parseSpatialStyle(targetNode: HTMLElement) {
  const computedStyle = getComputedStyle(targetNode);
  const spatialStyle = decodeSpatialStyle(computedStyle);
  return spatialStyle
}

function useMonitorNodeClassStyleChange(
  targetStandardNodeGetter: () => Element | null | undefined,
  updateZOffset: (zOffset: number| undefined) => void,
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
  const innerUpdateZOffset = (zOffset: number | undefined) => {
    spatialStyle.current.zOffset = zOffset
    resizeSpatial()
    forceUpdate()
  }
  
  useEffect(() => {
    const targetNode: HTMLElement = targetStandardNodeGetter() as HTMLElement;
    const spatialStyle = parseSpatialStyle(targetNode);
    if (spatialStyle) {
      innerUpdateZOffset(spatialStyle.back);
    }
  }, []);

  useMonitorGlobalStyles(targetStandardNodeGetter, innerUpdateZOffset);
  useMonitorNodeClassStyleChange(
    targetStandardNodeGetter,
    innerUpdateZOffset
  );

  return spatialStyle
}
