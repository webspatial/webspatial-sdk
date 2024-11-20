import { createContext } from "react";

export class SpatialReactContextObject {
    private debugName: string;
    

    constructor(debugName: string) {
        this.debugName = debugName;
    }

    dom: HTMLElement | null = null;
    fn?: (dom: HTMLElement) => void;

    onDomChange (fn: (dom: HTMLElement) => void) {
        // console.log('dbg onDomChange', this.debugName, this.dom)

        this.fn = fn;
        if (this.dom) {
            fn(this.dom)
        }
    }

    offDomChange(fn: (dom: HTMLElement) => void) {
        this.fn = undefined
    }

    notifyDomChange(dom: HTMLElement) {
        // console.log('dbg notifyDomChange', this.debugName)
        this.dom = dom;
        this.fn && this.fn(dom)
    }
}

export const SpatialReactContext = createContext<SpatialReactContextObject | null>(null);
