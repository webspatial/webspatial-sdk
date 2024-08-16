
import { SpatialEntity } from '../SpatialEntity';
import { SpatialIFrameComponent } from '../SpatialResource/SpatialIFrameComponent';
import { getSessionAsync } from './getSessionAsync';
import { vecType, quatType } from './types';


// Manager classes to handle resource creation/deletion
export class SpatialIFrameManager {
    initPromise?: Promise<any>
    entity?: SpatialEntity
    webview?: SpatialIFrameComponent
    window?: WindowProxy

    async initInternal(url: string) {
        this.entity = await (await getSessionAsync()!).createEntity()
        await this.entity.setParentWindowGroup(await (await getSessionAsync()!).getCurrentWindowGroup())
        this.webview = await (await getSessionAsync()!).createIFrameComponent()
        await this.webview.loadURL(url)
        await this.webview.setInline(true);
        await this.webview.setScrollWithParent(true);
        await this.webview.setScrollEnabled(false);
        await this.entity.setComponent(this.webview)
    }
    async initInternalFromWindow(w: any) {
        this.entity = await (await getSessionAsync()!).createEntity()
        await this.entity.setParentWindowGroup(await (await getSessionAsync()!).getCurrentWindowGroup())
        this.webview = await (await getSessionAsync()!).createIFrameComponent()
        await this.webview.setFromWindow(w)
        await this.webview.setInline(true);
        await this.webview.setScrollWithParent(true);
        await this.webview.setScrollEnabled(false);
        await this.entity.setComponent(this.webview)
    }
    async init(url: string) {
        this.initPromise = this.initInternal(url)
        await this.initPromise
    }
    async initFromWidow(w: WindowProxy) {
        this.window = w;
        this.initPromise = this.initInternalFromWindow(w)
        await this.initPromise
    }
    async resize(domRect: DOMRect, offset: vecType, rotation: quatType = { x: 0, y: 0, z: 0, w: 1 }) {
        let rect = domRect
        let targetPosX = (rect.left + ((rect.right - rect.left) / 2))

        // Adjust to get the page relative to document instead of viewport
        // This is needed as when you scroll down the page the rect.top moves but we dont want it to so we can offset that by adding scroll
        let targetPosY = (rect.bottom + ((rect.top - rect.bottom) / 2)) + window.scrollY

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
            this.window = undefined
        }
    }
}
