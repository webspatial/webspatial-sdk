import { useCallback, useEffect, useRef, useState } from "react";
import { SpatialStyleInfoUpdateEvent } from "../notifyUpdateStandInstanceLayout";
import isEqual from "lodash.isequal";

const SpatialCustomVars = {
  back: '--xr-back',
  debugName: '--xr-name',
}
function decodeSpatialStyle(computedStyle: CSSStyleDeclaration) {
  let debugName = computedStyle.getPropertyValue(SpatialCustomVars.debugName);
  let backProperty = computedStyle.getPropertyValue(SpatialCustomVars.back);
  let back: number | undefined = undefined;
  try {
    back = parseFloat(backProperty);
  } catch (error) {
     
  }
  return {back, debugName};
}

function parseSpatialStyle(node: HTMLElement) {
  const computedStyle = getComputedStyle(node);
  const { back, debugName } = decodeSpatialStyle(computedStyle);

  const position = { x: 0, y: 0, z: back || 1 };
  const rotation = { x: 0, y: 0, z: 0, w: 1 };
  const scale = { x: 1, y: 1, z: 1 };
  return { position, rotation, scale, debugName };
}

export function useSpatialStyle() {
  const ref = useRef(null);
  const [spatialStyle, setSpatialStyle] = useState({
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 },
    debugName: ''
  });
  const [ready, setReady] = useState(false);

  const checkSpatialStyleUpdate = useCallback(() => {
    const nextSpatialStyle = parseSpatialStyle(ref.current!);
    if (!isEqual(spatialStyle, nextSpatialStyle)) {
      setSpatialStyle(nextSpatialStyle);
    }
  }, []);

  useEffect(() => {
    // first time update
    if (!ref.current) {
      return;
    }

    const spatialStyle = parseSpatialStyle(ref.current!);
    setSpatialStyle(spatialStyle);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ref.current) {
      return;
    }

    // sync spatial style when this dom or sub dom change
    const observer = new MutationObserver((mutationsList) => {
      checkSpatialStyleUpdate();
    });
    const config = {
      childList: true,
      subtree: true,
      attributes: true,
      // attributeOldValue: true,
      attributeFilter: ["style", "class"],
    };
    observer.observe(ref.current!, config);

    return () => {
      observer.disconnect();
    };
  }, []);

  // TODO: check style property change for spatial react component

  useEffect(() => {
    if (!ref.current) {
      return;
    }

    // check style property change when some external node changed
    function isDescendant(child: Node, parent: Node) {
      if (child === parent) {
        return true;
      }
      let node: Node | null = child;
      while (node) {
        if (node === parent) {
          return true;
        }
        node = node.parentElement;
      }
      return false;
    }

    const onDomUpdated = (event: Event) => {
      const mutationsList = (event as CustomEvent).detail as MutationRecord[];
      // spatialReactComponentDiv is hardcode currently, maybe refactor later (get from SpatialReactComponent)
      const spatialReactComponentDiv = (ref.current! as HTMLElement)
        .previousElementSibling!;
      // ignore the mutation that is in the current ref dom or the previous sibling dom (Like SpatialReactComponent)
      const targets = mutationsList
        .map((m) => m.target)
        .filter(
          (node) =>
            node !== ref.current! &&
            !isDescendant(node, spatialReactComponentDiv)
        );
      if (targets.length > 0) {
        checkSpatialStyleUpdate();
      }
    };

    // check style property change when some external style change
    document.addEventListener(
      SpatialStyleInfoUpdateEvent.domUpdated,
      onDomUpdated
    );

    return () => {
      document.removeEventListener(
        SpatialStyleInfoUpdateEvent.domUpdated,
        onDomUpdated
      );
    };
  }, []);

  return { ref, ready, spatialStyle };
}
