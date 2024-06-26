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
        this.style as CSSProperties;
        let toSet = encodeURIComponent(this.innerHTML)
        return React.createElement(SpatialIFrame, {
            innerHTMLContent: this.innerHTML,
            spatialOffset: { z: 50 },
            style: { width: this.style.width, height: this.style.height, backgroundColor: "red" },
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
        if (name === 'source') {
            this.root!.render(this.createCollapsed(newValue));
        }
    }
}

export class WebSpatialHydrate {
    static async Hydrate() {
        window.customElements.define('spatial-iframe', SpatialIFrameElement);
    }
}





