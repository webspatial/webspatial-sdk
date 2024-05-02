import {Object3D, Quaternion, Vector2, Vector3, Vector4} from "three"
export class SpatialWindowState {
    title=""
    id=0
    resolution = new Vector2()
    position = new Vector3()
    scale = new Vector3()
    rotation = new Vector4()
}

export class SpatialWindow extends Object3D {
    windowId = "thisWindow"
    resolution = {x: 1920, y: 1080}
    async updateTransform(){
        var msg = JSON.stringify({type: "updateTransform", data: {targetWindow: this.windowId, resolution: this.resolution, position: this.position, rotation: {x:this.quaternion.x,y:this.quaternion.y,z:this.quaternion.z,w:this.quaternion.w}, scale: this.scale}})
       await (window as any).ReactNativeWebView.postMessage(msg);
    }

    async openUrl(url: string){
        var msg = JSON.stringify({type: "openUrl", data: {targetWindow: this.windowId, url: url}})
       await (window as any).ReactNativeWebView.postMessage(msg);
    }
}

export class SpatialWeb {
    public static eventPromiseId = 0;
    public static eventPromises:any = {}
    public static init(){
        let w = (window as any)
        w.__SpatialWebEvent = (e:any)=>{
            var res = SpatialWeb.eventPromises[e.eventId];
            if(res){
                res(e)
            }
        }

        // Overwrite log to print in react native window
        var oldLog = console.log
        console.log = (str)=>{
            oldLog(str)
            var msg = JSON.stringify({type: "webLog", data: {message: str}});
            (window as any).ReactNativeWebView.postMessage(msg);
        }
    }

    public static async getCurrentSpatialWindow(){
        return new SpatialWindow()
    }

    public static async createNewSpatialWindow(url:string){
        var p = new Promise(async (res, rej)=>{
            var eventId = SpatialWeb.eventPromiseId++;
            var msg = JSON.stringify({type: "createWindow", eventId: eventId})
            await (window as any).ReactNativeWebView.postMessage(msg);
            SpatialWeb.eventPromises[eventId] = res
        })
        var res:any = await p
        var w = new SpatialWindow();
        w.windowId = res.data.windowId////
        return w
    }
    
    public static onFrame(fn:any){
        var loop = ()=>{
            setTimeout(() => {
                loop()
            }, 1000/60);
            fn(window.performance.now())
        }
        loop()
       
    }
}//
