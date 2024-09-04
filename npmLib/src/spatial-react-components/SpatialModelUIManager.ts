import { SpatialEntity, SpatialModelUIComponent } from "../core"
import { getSession } from "../utils"
import { vecType } from "./types"


export class SpatialModelUIManager {
    initPromise?: Promise<any>
    entity?: SpatialEntity
    modelComponent?: SpatialModelUIComponent

    async initInternal(url: string) {
        this.entity = await (await getSession()!).createEntity()

        var wc = (await getSession()!.getCurrentWindowComponent())
        var ent = await wc.getEntity()
        await this.entity.setParent(ent!)

        this.modelComponent = await (await getSession()!).createModelUIComponent()
        await this.modelComponent.setURL(url)
        await this.entity.setComponent(this.modelComponent)
    }
    async init(url: string) {
        this.initPromise = this.initInternal(url)
        await this.initPromise
    }
    async resize(element: HTMLElement, offset: vecType) {
        let rect = element.getBoundingClientRect();
        let targetPosX = (rect.left + ((rect.right - rect.left) / 2))
        let targetPosY = (rect.bottom + ((rect.top - rect.bottom) / 2)) + window.scrollY
        if (!this.modelComponent) {
            return
        }
        var entity = this.entity!
        entity.transform.position.x = targetPosX + offset.x
        entity.transform.position.y = targetPosY + offset.y
        entity.transform.position.z = offset.z
        await entity.updateTransform()

        var modelComponent = this.modelComponent!
        await modelComponent.setResolution(rect.width, rect.height);

        await modelComponent.setAspectRatio("fit");
    }

    async setOpacity(opacity: number) {
        if (!this.modelComponent) {
            return
        }
        return this.modelComponent.setOpacity(opacity);
    }

    async destroy() {
        if (this.initPromise) {
            await this.initPromise
            this.entity?.destroy()
            this.modelComponent?.destroy()
        }
    }
}
