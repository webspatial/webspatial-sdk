import ReactDOM from 'react-dom/client'
import React from 'react'
import { SpatialDiv, SpatialModel } from './webSpatialComponents'

var elements = document.querySelectorAll("[custom-spatial]")
var wvCounter = 0
for (var e of elements) {
    ReactDOM.createRoot(e).render(
        <React.StrictMode>
            <SpatialDiv spatialOffset={{ z: 50 }} className='' webViewID={"customWV" + (wvCounter++)}>
                <div dangerouslySetInnerHTML={{ __html: e.innerHTML }}></div>
            </SpatialDiv>
        </React.StrictMode >,
    )
}