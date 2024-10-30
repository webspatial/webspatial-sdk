

import { SpatialEntity, SpatialWindowComponent } from '../../core';
import { getSession } from '../../utils';
import { vecType, quatType, RectType } from '../types';

// Manager classes to handle resource creation/deletion
export class SpatialWindowManager {
    initPromise?: Promise<any>
    entity?: SpatialEntity
    webview?: SpatialWindowComponent
    window: WindowProxy | null = null

    private async initInternal(url: string) {
        this.entity = await (getSession()!).createEntity()
        this.webview = await (getSession()!).createWindowComponent()
        await this.webview.loadURL(url)
        await this.entity.setCoordinateSpace("Dom");
        await this.webview.setScrollWithParent(true);
        await this.webview.setScrollEnabled(false);
        await this.entity.setComponent(this.webview);

        var wc = (await (getSession()!).getCurrentWindowComponent())
        var ent = await wc.getEntity()
        await this.entity.setParent(ent!)
    }

    private async initInternalFromWindow( parentSpatialWindowManager?: SpatialWindowManager | null) {
        var w = await getSession()!.createWindowContext()
        this.window = w
        this.entity = await (getSession()!).createEntity()
        this.webview = await (getSession()!).createWindowComponent()
        await this.webview.setFromWindow(w)
        await this.entity.setCoordinateSpace("Dom");
        await this.webview.setScrollWithParent(true);
        await this.webview.setScrollEnabled(false);
        await this.entity.setComponent(this.webview)

        if (parentSpatialWindowManager !== undefined) {
            if (parentSpatialWindowManager !== null) {
                // Add as a child of the parent
                await parentSpatialWindowManager.initPromise
                this.entity!.setParent(parentSpatialWindowManager.entity!)
            } else {
                // Add as a child of the current page
                var wc = (await (getSession()!).getCurrentWindowComponent())
                var ent = await wc.getEntity()
                await this.entity!.setParent(ent!)
            }
        }
    }

    async init(url: string) {
        this.initPromise = this.initInternal(url)
        await this.initPromise
    }
    async initFromWidow(parentSpatialWindowManager?: SpatialWindowManager | null) {
        this.initPromise = this.initInternalFromWindow(parentSpatialWindowManager)
        await this.initPromise
    }
    async resize(rect: RectType, offset: vecType, rotation: quatType = { x: 0, y: 0, z: 0, w: 1 }) {
        let targetPosX = (rect.x + ((rect.width) / 2))
        // Adjust to get the page relative to document instead of viewport
        // This is needed as when you scroll down the page the rect.top moves but we dont want it to so we can offset that by adding scroll
        let targetPosY = (rect.y + rect.height) + ((rect.height) / 2) + window.scrollY

        if (!this.webview) {
            return
        }
        var entity = this.entity!
        entity.transform.position.x = targetPosX + (offset ? offset.x : 0)
        entity.transform.position.y = targetPosY + (offset ? offset.y : 0)
        entity.transform.position.z = (offset ? offset.z : 0)

        entity.transform.orientation.x = rotation.x
        entity.transform.orientation.y = rotation.y
        entity.transform.orientation.z = rotation.z
        entity.transform.orientation.w = rotation.w
        await entity.updateTransform()

        var webview = this.webview!
        await webview.setResolution(rect.width, rect.height);
    }

    async destroy() {
        if (this.initPromise) {
            await this.initPromise
            this.entity?.destroy()
            this.webview?.destroy()
            this.window = null
        }
    }
}
