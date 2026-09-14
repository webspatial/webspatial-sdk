import type { ComponentType } from 'react'
import { SpatialDivPageShell } from './shared'
import Layout from './scenarios/01-layout'
import Styles from './scenarios/02-styles'
import Transforms from './scenarios/03-transforms'
import Clipping from './scenarios/04-clipping'
import Scroll from './scenarios/05-scroll'
import Stacking from './scenarios/06-stacking'
import Visibility from './scenarios/07-visibility'
import Animation from './scenarios/08-animation'
import Input from './scenarios/09-input'
import DomApis from './scenarios/10-dom-apis'
import Overlays from './scenarios/11-overlays'
import Gestures from './scenarios/12-gestures'
import Focus from './scenarios/13-focus'
import Lifecycle from './scenarios/14-lifecycle'
import DynamicStylesheets from './scenarios/15-dynamic-stylesheets'
import EnvironmentQueries from './scenarios/16-environment-queries'
import DocumentListeners from './scenarios/17-document-listeners'
import Modality from './scenarios/18-modality'
import AnchoredPortals from './scenarios/19-anchored-portals'

function wrap(Page: ComponentType) {
  return function SpatialDivScenario() {
    return (
      <SpatialDivPageShell>
        <Page />
      </SpatialDivPageShell>
    )
  }
}

export const SpatialDivLayoutPage = wrap(Layout)
export const SpatialDivStylesPage = wrap(Styles)
export const SpatialDivTransformsPage = wrap(Transforms)
export const SpatialDivClippingPage = wrap(Clipping)
export const SpatialDivScrollPage = wrap(Scroll)
export const SpatialDivStackingPage = wrap(Stacking)
export const SpatialDivVisibilityPage = wrap(Visibility)
export const SpatialDivAnimationPage = wrap(Animation)
export const SpatialDivInputPage = wrap(Input)
export const SpatialDivDomApisPage = wrap(DomApis)
export const SpatialDivOverlaysPage = wrap(Overlays)
export const SpatialDivGesturesPage = wrap(Gestures)
export const SpatialDivFocusPage = wrap(Focus)
export const SpatialDivLifecyclePage = wrap(Lifecycle)
export const SpatialDivDynamicStylesheetsPage = wrap(DynamicStylesheets)
export const SpatialDivEnvironmentQueriesPage = wrap(EnvironmentQueries)
export const SpatialDivDocumentListenersPage = wrap(DocumentListeners)
export const SpatialDivModalityPage = wrap(Modality)
export const SpatialDivAnchoredPortalsPage = wrap(AnchoredPortals)
