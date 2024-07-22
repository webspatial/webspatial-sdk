import ReactDOM from 'react-dom/client'
import React, { CSSProperties } from 'react'
import { SpatialIFrame, getSessionAsync } from './webSpatialComponents'
import { Spatial } from '.'

// import * as retargetEvents from 'react-shadow-dom-retarget-events';

export default class SpatialIFrameElement extends HTMLElement {
    static get observedAttributes() {
        return ['source'];
    }

    mountPoint?: HTMLSpanElement;
    source: string = "";
    root?: ReactDOM.Root

    createCollapsed(source: string) {
        var style = this.style as CSSProperties;
        let toSet = encodeURIComponent(this.innerHTML)
        return React.createElement(SpatialIFrame, {
            innerHTMLContent: this.innerHTML,
            spatialOffset: { z: 50 },
            style: { width: style.width, height: style.height, boxShadow: style.boxShadow, backgroundColor: style.backgroundColor, filter: style.filter },
            className: "",
            src: source,
            onload: (spatialFrame) => {
                spatialFrame.sendContent(toSet)
            }
        }, React.createElement('slot'));
    }

    connectedCallback() {
        this.mountPoint = document.createElement('div');
        const shadowRoot = this.attachShadow({ mode: 'open' });
        shadowRoot.appendChild(this.mountPoint);

        const source = this.getAttribute('source');
        this.root = ReactDOM.createRoot(this.mountPoint);
        this.root.render(this.createCollapsed(source!));
        //   retargetEvents(shadowRoot);
    }

    attributeChangedCallback(name: string, oldValue: any, newValue: any) {
        if (!this.root) {
            return;
        }
        if (name === 'source') {
            this.root!.render(this.createCollapsed(newValue));
        }
    }
}

export class WebSpatialHydrate {
    static async Hydrate() {
        window.customElements.define('spatial-iframe', SpatialIFrameElement);
    }

    static async ReplaceLinks() {
        var s = await getSessionAsync()
        var aEl = document.getElementsByTagName("a")
        for (var e of aEl) {
            if (e.href && e.href != "#") {
                let link = e.href
                e.href = "#"
                e.onclick = async () => {
                    var p = await s!.getParentIFrameComponent()
                    if (p != null) {
                        p.loadURL(link)
                    }
                }
            }
        }
    }
}





