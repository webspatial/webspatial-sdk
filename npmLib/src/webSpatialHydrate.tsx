import ReactDOM from 'react-dom/client'
import React from 'react'
import { SpatialIFrame, getSessionAsync } from './webSpatialComponents'
import { Spatial } from '.'

export class WebSpatialHydrate {
    static async Hydrate() {

        if (!new Spatial().isSupported()) {
            console.warn("Webspatial not supported")
            return
        }

        var session = await getSessionAsync()
        await session.getCurrentIFrameComponent().setStyle({ glassEffect: true, cornerRadius: 50 })
        // await WebSpatial.setWebPanelStyle(WebSpatial.getCurrentWindowGroup(), WebSpatial.getCurrentWebPanel())
        document.documentElement.style.backgroundColor = "transparent";
        document.body.style.backgroundColor = "transparent"

        var elements = document.querySelectorAll("[custom-spatial]")
        for (var e of elements) {
            let toSet = encodeURIComponent(e.innerHTML)
            ReactDOM.createRoot(e).render(
                <React.StrictMode>
                    <SpatialIFrame spatialOffset={{ z: 80 }} style={{ width: e.clientWidth, height: e.clientHeight }} className='' src="/bootstrapEmbed.html" onload={(spatialFrame) => {
                        spatialFrame.sendContent(toSet)
                    }}>
                    </SpatialIFrame>
                </React.StrictMode >,
            )
        }
    }
}
