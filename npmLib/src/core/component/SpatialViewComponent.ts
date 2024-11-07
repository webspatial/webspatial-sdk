import { WebSpatial } from "../private/WebSpatial";
import { SpatialComponent } from "./SpatialComponent";

/**
 * Represenets a volume that can be added to the webpage
 * Child entities will be added within this volume's space
 * Defaults to having 1x1x1 meter dimensions
 * Resolution defaults to 100x100 pixels
 */
export class SpatialViewComponent extends SpatialComponent {
    /**
     * Sets the resolution of the spatial view in dom pixels
     */
    async setResolution(x: number, y: number) {
        await WebSpatial.updateResource(this._resource, { resolution: { x: x, y: y } })
    }
}