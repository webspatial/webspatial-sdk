export enum SpatialStyleInfoUpdateEvent {
  standInstanceLayout = 'standInstanceLayout',
  domUpdated = 'domUpdated',
}

/**
 * External-developers can call this function to sync the standardInstance layout to PortalInstance.
 *
 * Currently: notifyUpdateStandInstanceLayout is called when the document head changed
 * or when the monitored div changed (in both cases spatialDiv's layout may be changed, so we need to update the layout)
 */
export function notifyUpdateStandInstanceLayout() {
  document.dispatchEvent(
    new CustomEvent(SpatialStyleInfoUpdateEvent.standInstanceLayout, {
      detail: {},
    }),
  )
}

export function notifyDOMUpdate(mutationsList: MutationRecord[]) {
  document.dispatchEvent(
    new CustomEvent(SpatialStyleInfoUpdateEvent.domUpdated, {
      detail: mutationsList,
    }),
  )
}
