import { SpatialDiv,  getSessionAsync } from './webSpatialComponents'
// import { Spatial } from '.'
import r2wc from "@r2wc/react-to-web-component"

export class WebSpatialHydrate {
    static Hydrate() {
        let session = getSessionAsync()
        if (session) {
            // Set styles
            let documentSpatialStyle = document.documentElement.attributes['spatial-style' as any]
            if (documentSpatialStyle) {
                document.documentElement.style.cssText += documentSpatialStyle.value
                let styles = documentSpatialStyle.value.split(";")
                for (let style of styles) {
                    let keyVal = style.split(":")
                    if (keyVal.length == 2) {
                        let key = keyVal[0].trim()
                        let val = keyVal[1].trim()
                        if (key == "glassEffect" && val == "true") {
                            session.getCurrentIFrameComponent().setStyle({ glassEffect: true })
                        }
                    }
                }
            }
        }

        // Create custom element components from React components
        const CustomPortalIFrame = r2wc(SpatialDiv, { shadow: "open" })
        customElements.define("spatial-iframe", CustomPortalIFrame)
    }
}





