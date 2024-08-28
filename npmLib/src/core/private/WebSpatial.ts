import { SpatialInputComponent } from "../component/SpatialInputComponent"
import { Logger, LoggerLevel, NativeLogger, WebLogger } from "./log"
import { RemoteCommand } from "./remote-command"
import { WindowStyle } from "../types"


export class Vec3 {
    constructor(public x = 0, public y = 0, public z = 0) {
    }
}

export class Vec4 {
    x = 0
    y = 0
    z = 0
    w = 1
}

export class WindowGroup {
    id = ""
}

export class WebSpatialResource {
    id = ""
    windowGroupId = ""
    data = {} as any
}

export class WebSpatial {
    public static eventPromises: any = {}
    public static inputComponents: { [key: string]: SpatialInputComponent; } = {}


    static init() {
        (window as any).__SpatialWebEvent = (e: any) => {
            if (e.inputComponentID) {
                var obj = WebSpatial.inputComponents[e.inputComponentID]
                obj._gotEvent(e.data)
            } else {
                var p = WebSpatial.eventPromises[e.requestID];
                if (p) {
                    if (e.success) {
                        p.res(e)
                    } else {
                        p.rej(e)
                    }
                }
            }
        }
    }

    static async sendCommand(cmd: RemoteCommand) {
        var msg = JSON.stringify(cmd);

        // Android testing
        // (window as any).Android.nativeMessage(msg)
        // return

        (window as any).webkit.messageHandlers.bridge.postMessage(msg)
    }

    static logger: Logger = (window as any).WebSpatailEnabled ? new NativeLogger(this.sendCommand) : new WebLogger('WebSpatial');

    static getImmersiveWindowGroup() {
        var wg = new WindowGroup()
        wg.id = "Immersive"
        return wg
    }

    static getCurrentWindowGroup() {
        var wg = new WindowGroup()
        wg.id = "current"
        return wg
    }

    static getCurrentWebPanel() {
        var wg = new WebSpatialResource()
        wg.id = "current"
        wg.windowGroupId = WebSpatial.getCurrentWindowGroup().id
        return wg
    }

    static async createWindowGroup(style: WindowStyle = "Plain") {
        var cmd = new RemoteCommand("createWindowGroup", { windowStyle: style })

        var result = await new Promise((res, rej) => {
            WebSpatial.eventPromises[cmd.requestID] = { res: res, rej: rej }
            WebSpatial.sendCommand(cmd)
        })
        var res = new WindowGroup()
        res.id = (result as any).data.createdID
        return res
    }

    static async destroyResource(resource: WebSpatialResource) {
        const data = {

        }
        var cmd = new RemoteCommand("destroyResource", {
            windowGroupID: resource.windowGroupId,
            resourceID: resource.id
        })

        WebSpatial.sendCommand(cmd)
    }

    static async ping(msg: string) {
        var cmd = new RemoteCommand("ping", {
            windowGroupID: this.getCurrentWindowGroup().id,
            resourceID: this.getCurrentWebPanel().id,
            message: msg
        })

        var result = await new Promise((res, rej) => {
            WebSpatial.eventPromises[cmd.requestID] = { res: res, rej: rej }
            WebSpatial.sendCommand(cmd)
        })
        return result
    }

    static async getStats() {
        var cmd = new RemoteCommand("getStats", {
            windowGroupID: this.getCurrentWindowGroup().id,
            resourceID: this.getCurrentWebPanel().id
        })

        var result = await new Promise((res, rej) => {
            WebSpatial.eventPromises[cmd.requestID] = { res: res, rej: rej }
            WebSpatial.sendCommand(cmd)
        })
        return result
    }

    static async setComponent(entity: WebSpatialResource, resource: WebSpatialResource) {
        var cmd = new RemoteCommand("setComponent", {
            windowGroupID: entity.windowGroupId,
            resourceID: resource.id,
            entityID: entity.id,
        })

        WebSpatial.sendCommand(cmd)
    }

    // windowGroup is the group the resource will be tied to (if not provided it will use the current window grou)
    // parentWebView is the SpatialWebView that the resource will be tied to (if not provided, resource will continue to exist even if this page is unloaded)
    static async createResource(type: string, windowGroup: WindowGroup, parentWebView: WebSpatialResource, params = {} as any) {
        var cmd = new RemoteCommand("createResource", {
            windowGroupID: windowGroup.id,
            resourceID: parentWebView.id,
            type: type,
            params: params
        });

        var result = await new Promise((res, rej) => {
            WebSpatial.eventPromises[cmd.requestID] = { res: res, rej: rej }
            WebSpatial.sendCommand(cmd)
        })
        var res = new WebSpatialResource()
        res.id = (result as any).data.createdID
        res.windowGroupId = cmd.data.windowGroupID
        return res
    }

    static async updateWindowGroup(wg: WindowGroup, data: any) {
        var cmd = new RemoteCommand("updateWindowGroup", {
            windowGroupID: wg.id,
            update: data
        })

        var result = await new Promise((res, rej) => {
            WebSpatial.eventPromises[cmd.requestID] = { res: res, rej: rej }
            WebSpatial.sendCommand(cmd)
        })
        return result
    }

    static async updateResource(resource: WebSpatialResource, data: any = null) {
        var cmd = new RemoteCommand("updateResource", {
            windowGroupID: resource.windowGroupId,
            resourceID: resource.id,
            update: data || resource.data
        });

        var result = await new Promise((res, rej) => {
            WebSpatial.eventPromises[cmd.requestID] = { res: res, rej: rej }
            WebSpatial.sendCommand(cmd)
        })
        return result
    }

    static async applyAnimationToResource(resource: WebSpatialResource, data: any = null) {
        var cmd = new RemoteCommand("animateResource", {
            windowGroupID: resource.windowGroupId,
            resourceID: resource.id,
            animation: data || resource.data
        });

        var result = await new Promise((res, rej) => {
            WebSpatial.eventPromises[cmd.requestID] = { res: res, rej: rej }
            WebSpatial.sendCommand(cmd)
        })
        return result
    }

    static async openImmersiveSpace() {
        var cmd = new RemoteCommand("openImmersiveSpace");
        await WebSpatial.sendCommand(cmd)
    }

    static async dismissImmersiveSpace() {
        var cmd = new RemoteCommand("dismissImmersiveSpace");
        await WebSpatial.sendCommand(cmd)
    }

    static onFrame(fn: any) {
        var dt = 0
        var lastTime = window.performance.now()
        var loop = () => {
            setTimeout(() => {
                loop()
            }, 1000 / 90);
            var curTime = window.performance.now()
            fn(curTime, curTime - lastTime)
            lastTime = curTime
        }
        loop()

    }
}
WebSpatial.init()
if ((window as any).WebSpatailEnabled) {
    let pos = 0
    let last = 0;
    (window as any)._magicUpdate = () => {
        const now = Date.now();
        let dt = now - last;
        last = now
        if ((dt / 1000) < 1 / 10) {
            pos += 1 * (dt / 1000)
            return Math.sin(pos) * 0.3
        } else {
            return 0
        }
    }
}